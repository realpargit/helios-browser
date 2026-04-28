export type SearchResult = {
  title: string
  url: string
  description: string
  favicon?: string
  // Provider that produced this result. Used for ranking + diversity.
  source?: string
  score?: number
}

export type KnowledgeCard = {
  title: string
  description: string
  url?: string
  thumbnail?: string
}

export interface SearchProvider {
  name: string
  search(query: string, signal?: AbortSignal): Promise<SearchResult[]>
}

export type SearchEnvelope =
  | { ok: true; results: SearchResult[]; card?: KnowledgeCard; sources: string[] }
  | { ok: false; reason: string }

export type Stage = 'cache' | 'fast' | 'full' | 'final'

export type StageUpdate = {
  sessionId: number
  query: string
  stage: Stage
  envelope: SearchEnvelope
  elapsedMs: number
}

export type ProviderId = 'google' | 'ddg' | 'searxng' | 'wikipedia' | 'local' | 'brave'
