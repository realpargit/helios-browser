import type { SearchProvider, SearchResult } from './types'
import { fetchJSON, faviconFor } from './util'

// SearXNG public instance fallback. Public instances are rate-limited and
// occasionally down — we treat any failure as fatal-for-this-provider only.
const PUBLIC_INSTANCES = [
  'https://searx.be',
  'https://search.disroot.org',
  'https://searx.tiekoetter.com'
]

interface SearxResp {
  results?: Array<{ title?: string; url?: string; content?: string }>
}

export const searxng: SearchProvider = {
  name: 'searxng',
  async search(query: string): Promise<SearchResult[]> {
    let lastErr: any = null
    for (const base of PUBLIC_INSTANCES) {
      try {
        const data = await fetchJSON<SearxResp>(
          base + '/search?format=json&safesearch=1&language=en&q=' + encodeURIComponent(query),
          undefined,
          4000
        )
        const list = data.results ?? []
        const out: SearchResult[] = []
        for (const r of list) {
          if (!r.url || !r.title) continue
          if (!/^https?:\/\//.test(r.url)) continue
          out.push({
            title: r.title,
            url: r.url,
            description: r.content || '',
            favicon: faviconFor(r.url)
          })
          if (out.length >= 20) break
        }
        if (out.length) return out
      } catch (e) {
        lastErr = e
      }
    }
    if (lastErr) throw lastErr
    return []
  }
}
