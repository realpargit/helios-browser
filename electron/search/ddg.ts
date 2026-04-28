import { parse } from 'node-html-parser'
import type { SearchProvider, SearchResult } from './types'
import { fetchText, decodeHtmlEntities, faviconFor } from './util'

// DuckDuckGo HTML provider (no API key). They rewrite outbound links through
// /l/?uddg=<encoded-real-url> — we have to decode that to get the real URL.
function unwrapDdgRedirect(href: string): string {
  if (!href) return href
  try {
    const u = href.startsWith('//') ? 'https:' + href : href
    const parsed = new URL(u, 'https://duckduckgo.com/')
    if (parsed.pathname === '/l/' || parsed.pathname === '//duckduckgo.com/l/') {
      const real = parsed.searchParams.get('uddg')
      if (real) return decodeURIComponent(real)
    }
    return parsed.toString()
  } catch {
    return href
  }
}

export const ddg: SearchProvider = {
  name: 'duckduckgo',
  async search(query: string): Promise<SearchResult[]> {
    const html = await fetchText(
      'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query),
      { method: 'GET' },
      5000
    )
    const root = parse(html)
    const items = root.querySelectorAll('.result, .results_links, .web-result')
    const out: SearchResult[] = []
    for (const item of items) {
      const a = item.querySelector('a.result__a')
      const snippet = item.querySelector('.result__snippet')
      if (!a) continue
      const rawHref = a.getAttribute('href') || ''
      const url = unwrapDdgRedirect(rawHref)
      if (!url || !/^https?:\/\//.test(url)) continue
      const title = decodeHtmlEntities(a.text.trim())
      const description = snippet ? decodeHtmlEntities(snippet.text.trim()) : ''
      if (!title) continue
      out.push({ title, url, description, favicon: faviconFor(url) })
      if (out.length >= 20) break
    }
    return out
  }
}
