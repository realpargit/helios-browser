import type { SearchResult } from './types'
import { hostOf } from './util'

// Strip subdomains for a rough "registrable domain" — good enough for
// diversity scoring without pulling in a public-suffix list.
export function regDomain(url: string): string {
  const h = hostOf(url)
  if (!h) return ''
  const parts = h.split('.')
  if (parts.length <= 2) return h
  return parts.slice(-2).join('.')
}

const PROVIDER_BIAS: Record<string, number> = {
  google: 1.2,
  brave: 1.15,
  ddg: 1.0,
  searxng: 0.95,
  local: 0.6,
  wikipedia: 0.8
}

// Rerank with a domain-diversity boost. New domains rank higher than the
// 3rd-and-beyond hit from a domain we've already seen. Empty titles/snippets
// are pushed to the end.
export function rerank(results: SearchResult[]): SearchResult[] {
  const domainCount = new Map<string, number>()
  const scored = results.map((r, i) => {
    const d = regDomain(r.url)
    const seen = domainCount.get(d) || 0
    domainCount.set(d, seen + 1)
    const positionalScore = 1 - i / Math.max(results.length, 1)
    const diversity = seen === 0 ? 0.4 : seen === 1 ? 0.05 : -0.4
    const provider = PROVIDER_BIAS[r.source || ''] ?? 1
    const completeness = (r.title?.trim() ? 0 : -1) + (r.description?.trim() ? 0 : -0.3)
    const score = positionalScore * provider + diversity + completeness
    return { r: { ...r, score }, score }
  })
  scored.sort((a, b) => b.score - a.score)
  // Cap at 2 per domain in the top 10.
  const cap = new Map<string, number>()
  const out: SearchResult[] = []
  const overflow: SearchResult[] = []
  for (const { r } of scored) {
    const d = regDomain(r.url)
    const c = cap.get(d) || 0
    if (out.length < 10 && c >= 2) {
      overflow.push(r)
      continue
    }
    cap.set(d, c + 1)
    out.push(r)
  }
  return [...out, ...overflow]
}

export type GateReason = 'too_few' | 'low_diversity' | 'incomplete' | 'concentrated'

export type GateResult = { ok: true } | { ok: false; reason: GateReason }

// Quality gate for stage-2 emission. If this fails, we wait for stage-3
// rather than ship a thin or low-quality first paint.
export function passesQualityGate(results: SearchResult[]): GateResult {
  if (results.length < 5) return { ok: false, reason: 'too_few' }
  const domains = new Set<string>()
  const domCount = new Map<string, number>()
  let incomplete = 0
  for (let i = 0; i < Math.min(results.length, 10); i++) {
    const r = results[i]
    if (!r.title?.trim() || !r.description?.trim()) incomplete++
    const d = regDomain(r.url)
    domains.add(d)
    domCount.set(d, (domCount.get(d) || 0) + 1)
  }
  if (domains.size < 3) return { ok: false, reason: 'low_diversity' }
  if (incomplete > 2) return { ok: false, reason: 'incomplete' }
  // Max 2 results from any single domain in the top 10 — same rule the
  // reranker enforces, applied here as a gate.
  for (const c of domCount.values()) {
    if (c > 2) return { ok: false, reason: 'concentrated' }
  }
  return { ok: true }
}
