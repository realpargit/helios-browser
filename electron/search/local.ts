import type { SearchResult } from './types'
import { faviconFor } from './util'

export type LocalSource = {
  history: () => Array<{ url: string; title: string; favicon?: string }>
  bookmarks: () => Array<{ url: string; title: string; favicon?: string }>
}

let source: LocalSource | null = null

export function configureLocal(s: LocalSource) {
  source = s
}

export function searchLocal(query: string, limit = 5): SearchResult[] {
  if (!source) return []
  const q = query.trim().toLowerCase()
  if (!q) return []
  const seen = new Set<string>()
  const out: SearchResult[] = []
  const score = (title: string, url: string): number => {
    const t = title.toLowerCase()
    const u = url.toLowerCase()
    if (t === q || u === q) return 100
    if (t.startsWith(q)) return 80
    if (u.includes('://' + q)) return 70
    if (t.includes(q)) return 50
    if (u.includes(q)) return 30
    return 0
  }
  const consider = (entry: { url: string; title: string; favicon?: string }, kind: 'bookmark' | 'history') => {
    if (!entry.url || seen.has(entry.url)) return
    const s = score(entry.title || '', entry.url)
    if (s <= 0) return
    seen.add(entry.url)
    out.push({
      title: entry.title || entry.url,
      url: entry.url,
      description: kind === 'bookmark' ? 'Bookmark' : 'From your history',
      favicon: entry.favicon || faviconFor(entry.url),
      source: 'local',
      score: s + (kind === 'bookmark' ? 10 : 0)
    })
  }
  for (const b of source.bookmarks()) consider(b, 'bookmark')
  for (const h of source.history()) consider(h, 'history')
  out.sort((a, b) => (b.score || 0) - (a.score || 0))
  return out.slice(0, limit)
}
