import type { SearchResult } from './types'

export function canonicalUrl(u: string): string {
  try {
    const parsed = new URL(u)
    parsed.hash = ''
    // Strip common tracking params.
    const drop = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ref', 'ref_src']
    for (const k of drop) parsed.searchParams.delete(k)
    let s = parsed.toString()
    if (s.endsWith('/') && parsed.pathname === '/') s = s.slice(0, -1)
    return s.toLowerCase()
  } catch {
    return u.toLowerCase()
  }
}

export function dedupe(lists: SearchResult[][], limit = 30): SearchResult[] {
  const seen = new Set<string>()
  const out: SearchResult[] = []
  for (const list of lists) {
    for (const r of list) {
      const key = canonicalUrl(r.url)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(r)
      if (out.length >= limit) return out
    }
  }
  return out
}
