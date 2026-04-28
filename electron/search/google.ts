import { parse } from 'node-html-parser'
import type { SearchResult } from './types'
import { fetchText, decodeHtmlEntities, faviconFor } from './util'

// Startpage proxies Google's results without tracking, and (unlike google.com
// itself) returns parseable HTML to a non-JS client. We use it as our Google
// backend so the browser can show real Google results inside our own UI.
export type GoogleKind = 'web' | 'news' | 'videos' | 'images'

function category(kind: GoogleKind): string {
  if (kind === 'news') return '&cat=news'
  if (kind === 'videos') return '&cat=video'
  if (kind === 'images') return '&cat=images'
  return '&cat=web'
}

export async function googleSearch(query: string, kind: GoogleKind = 'web'): Promise<SearchResult[]> {
  const url = `https://www.startpage.com/sp/search?query=${encodeURIComponent(query)}${category(kind)}`
  const html = await fetchText(
    url,
    { method: 'GET', headers: { 'Accept': 'text/html,application/xhtml+xml' } },
    7000
  )
  if (/captcha|access denied|unusual traffic/i.test(html)) {
    throw new Error('startpage_blocked')
  }
  const root = parse(html)
  const blocks = root.querySelectorAll('.result')

  const out: SearchResult[] = []
  const seen = new Set<string>()
  for (const block of blocks) {
    // Strip embedded CSS/JS so .text gives clean content.
    for (const s of block.querySelectorAll('style, script')) s.remove()
    const linkEl = block.querySelector('a.result-link')
                || block.querySelector('.result-title a')
                || block.querySelector('h2 a')
                || block.querySelector('h3 a')
    const href = (linkEl?.getAttribute('href') || '').trim()
    if (!/^https?:\/\//.test(href)) continue
    if (seen.has(href)) continue

    // Strip any embedded <style>/<script> from title element before reading text.
    let titleText = ''
    if (linkEl) {
      for (const s of linkEl.querySelectorAll('style, script')) s.remove()
      titleText = linkEl.text.trim()
    }
    if (!titleText) {
      const t2 = block.querySelector('.result-title')
      if (t2) {
        for (const s of t2.querySelectorAll('style, script')) s.remove()
        titleText = t2.text.trim()
      }
    }
    const title = decodeHtmlEntities(titleText)
    if (!title) continue

    // Snippet: first child div whose text isn't the title or URL.
    let snippet = ''
    for (const d of block.querySelectorAll('p, .description, .w-gl__description')) {
      const t = (d.text || '').trim()
      if (t && t.length > 20 && !t.includes(title)) { snippet = t; break }
    }
    if (!snippet) {
      for (const d of block.querySelectorAll('div')) {
        const t = (d.text || '').trim()
        if (t && t.length > 40 && t.length < 400 && !t.includes(title) && !t.startsWith('http')) {
          snippet = t
          break
        }
      }
    }

    seen.add(href)
    out.push({ title, url: href, description: decodeHtmlEntities(snippet), favicon: faviconFor(href) })
    if (out.length >= 20) break
  }

  return out
}
