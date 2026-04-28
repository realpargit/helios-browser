import type { KnowledgeCard } from './types'
import { fetchJSON } from './util'

// Wikipedia REST: opensearch finds the closest page, then page/summary returns
// a clean knowledge card payload (title, description, thumbnail, canonical URL).
export async function wikipediaCard(query: string): Promise<KnowledgeCard | null> {
  if (!query.trim()) return null
  try {
    const opensearch = await fetchJSON<[string, string[], string[], string[]]>(
      'https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&namespace=0&format=json&origin=*&search=' +
        encodeURIComponent(query),
      undefined,
      4000
    )
    const title = opensearch?.[1]?.[0]
    if (!title) return null
    const summary = await fetchJSON<any>(
      'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_')),
      undefined,
      4000
    )
    if (!summary || summary.type === 'disambiguation') return null
    const desc: string = summary.extract || ''
    if (!desc) return null
    return {
      title: summary.title || title,
      description: desc,
      url: summary.content_urls?.desktop?.page,
      thumbnail: summary.thumbnail?.source
    }
  } catch {
    return null
  }
}
