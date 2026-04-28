import type { ProviderId } from './types'

type Sample = { ok: boolean; latencyMs: number; ts: number }

const WINDOW = 10
const PENALTY_MS = 30_000
const samples = new Map<ProviderId, Sample[]>()
const penaltyUntil = new Map<ProviderId, number>()

export function record(id: ProviderId, ok: boolean, latencyMs: number) {
  const arr = samples.get(id) || []
  arr.push({ ok, latencyMs, ts: Date.now() })
  while (arr.length > WINDOW) arr.shift()
  samples.set(id, arr)
  if (!ok) penaltyUntil.set(id, Date.now() + PENALTY_MS)
}

export function isHealthy(id: ProviderId): boolean {
  const until = penaltyUntil.get(id) || 0
  if (Date.now() < until) return false
  const arr = samples.get(id)
  if (!arr || arr.length < 3) return true
  const okRate = arr.filter((s) => s.ok).length / arr.length
  return okRate >= 0.5
}

export function score(id: ProviderId): number {
  // Higher = better. Healthy + fast wins.
  if (!isHealthy(id)) return 0
  const arr = samples.get(id)
  if (!arr || arr.length === 0) return 1
  const okRate = arr.filter((s) => s.ok).length / arr.length
  const okSamples = arr.filter((s) => s.ok)
  const median = okSamples.length
    ? okSamples.map((s) => s.latencyMs).sort((a, b) => a - b)[Math.floor(okSamples.length / 2)]
    : 1500
  // Penalize >2s; reward <500ms.
  const speed = Math.max(0.1, Math.min(2, 800 / Math.max(median, 100)))
  return okRate * speed
}

export function pickFastest(candidates: ProviderId[]): ProviderId | null {
  let best: ProviderId | null = null
  let bestScore = -1
  for (const c of candidates) {
    if (!isHealthy(c)) continue
    const s = score(c)
    if (s > bestScore) {
      bestScore = s
      best = c
    }
  }
  return best
}
