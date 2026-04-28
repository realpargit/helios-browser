import { net } from 'electron'
import type { KnowledgeCard, ProviderId, SearchEnvelope, SearchResult, Stage, StageUpdate } from './types'
import { withTimeout } from './util'
import * as cache from './cache'
import * as health from './health'
import { dedupe } from './dedupe'
import { passesQualityGate, rerank } from './ranker'
import { ddg } from './ddg'
import { searxng } from './searxng'
import { wikipediaCard } from './wikipedia'
import { googleHeadlessSearch } from './google-headless'
import { searchLocal } from './local'

const STAGE_2_BUDGET_MS = 900
const DDG_TIMEOUT = 900
const SEARXNG_TIMEOUT = 1100
const GOOGLE_TIMEOUT = 2500
const WIKI_TIMEOUT = 2000

let nextSessionId = 1

export type EngineOptions = {
  prefetch?: boolean
  forceRefresh?: boolean
  deepen?: boolean
  onUpdate?: (u: StageUpdate) => void
}

// Detailed search telemetry is dev-only. In production this is a no-op,
// and Vite tree-shakes the call sites' string-building when possible.
function plog(parts: Record<string, string | number | boolean>) {
  if (!__DEV__) return
  const s = Object.entries(parts).map(([k, v]) => `${k}=${v}`).join(' ')
  console.log('[helios:search] ' + s)
}

export type EngineHandle = {
  sessionId: number
  cancel: () => void
  promise: Promise<SearchEnvelope>
}

const cancelled = new Set<number>()

function emit(opts: EngineOptions, sessionId: number, query: string, stage: Stage, envelope: SearchEnvelope, started: number, firstPaintRef: { ms: number | null }) {
  if (cancelled.has(sessionId)) return
  const elapsedMs = Math.round(performance.now() - started)
  if (firstPaintRef.ms === null && envelope.ok && envelope.results.length > 0) {
    firstPaintRef.ms = elapsedMs
    plog({ session: sessionId, first_paint: elapsedMs + 'ms', stage })
  }
  opts.onUpdate?.({ sessionId, query, stage, envelope, elapsedMs })
}

function tag(results: SearchResult[], src: ProviderId): SearchResult[] {
  return results.map((r) => ({ ...r, source: r.source || src }))
}

async function timed<T>(id: ProviderId, p: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  const t0 = performance.now()
  try {
    const v = await withTimeout(p, timeoutMs, label)
    health.record(id, true, performance.now() - t0)
    return v
  } catch (e) {
    health.record(id, false, performance.now() - t0)
    throw e
  }
}

// Preconnect on app startup / search-bar focus. Warms DNS + TLS so the first
// real query doesn't pay handshake costs.
let preconnected = false
export function preconnect() {
  if (preconnected) return
  preconnected = true
  const targets = [
    'https://html.duckduckgo.com',
    'https://searx.be',
    'https://en.wikipedia.org'
  ]
  for (const url of targets) {
    try {
      const r = net.request({ url, method: 'HEAD' })
      r.on('response', () => {})
      r.on('error', () => {})
      r.end()
    } catch { /* ignore */ }
  }
}

export function search(query: string, opts: EngineOptions = {}): EngineHandle {
  const sessionId = nextSessionId++
  const started = performance.now()
  const q = query.trim()

  const firstPaint = { ms: null as number | null }
  plog({ session: sessionId, event: 'start', q, prefetch: !!opts.prefetch })

  const promise = (async (): Promise<SearchEnvelope> => {
    if (!q) {
      const env: SearchEnvelope = { ok: false, reason: 'empty_query' }
      emit(opts, sessionId, q, 'final', env, started, firstPaint)
      return env
    }

    // ---- Stage 1: cache + local ----
    const cached = cache.get(q)
    if (cached.envelope && cached.status === 'fresh' && !opts.forceRefresh) {
      emit(opts, sessionId, q, 'cache', cached.envelope, started, firstPaint)
      emit(opts, sessionId, q, 'final', cached.envelope, started, firstPaint)
      plog({ session: sessionId, final: Math.round(performance.now() - started) + 'ms', cached: true })
      return cached.envelope
    }

    if (cached.envelope && cached.status === 'stale') {
      emit(opts, sessionId, q, 'cache', cached.envelope, started, firstPaint)
      plog({ session: sessionId, stage: 'cache', kind: 'stale' })
      // fall through to refresh
    } else {
      // Try prefix reuse for an instant render before any provider returns.
      const prefix = cache.getPrefix(q)
      const localRes = searchLocal(q, 5)
      if (prefix && prefix.ok) {
        const merged: SearchEnvelope = {
          ok: true,
          results: dedupe([localRes, prefix.results]),
          card: prefix.card,
          sources: ['local', ...prefix.sources]
        }
        emit(opts, sessionId, q, 'cache', merged, started, firstPaint)
        plog({ session: sessionId, stage: 'cache', kind: 'prefix', results: merged.results.length })
      } else if (localRes.length > 0) {
        emit(opts, sessionId, q, 'cache', { ok: true, results: localRes, sources: ['local'] }, started, firstPaint)
        plog({ session: sessionId, stage: 'cache', kind: 'local', results: localRes.length })
      }
    }

    if (opts.prefetch && cached.status === 'fresh') return cached.envelope!

    // Inflight dedupe: if an identical query is already running, share it.
    const existing = cache.getInflight(q)
    if (existing && !opts.forceRefresh) {
      plog({ session: sessionId, inflight: 'shared' })
      const env = await existing
      emit(opts, sessionId, q, 'final', env, started, firstPaint)
      return env
    }

    const work = runProgressive(query, q, sessionId, opts, started, firstPaint)
    cache.setInflight(q, work)
    return work
  })()

  return {
    sessionId,
    cancel: () => { cancelled.add(sessionId) },
    promise
  }
}

async function runProgressive(originalQuery: string, q: string, sessionId: number, opts: EngineOptions, started: number, firstPaint: { ms: number | null }): Promise<SearchEnvelope> {
  // Wikipedia — fully non-blocking, lands whenever it lands.
  let card: KnowledgeCard | undefined = undefined
  withTimeout(wikipediaCard(q), WIKI_TIMEOUT, 'wikipedia').then(
    (c) => { if (c) card = c },
    () => {}
  )

  const localRes = searchLocal(q, 5)

  // Pick the fastest healthy fast-path provider. If both unhealthy, default ddg.
  const fastChoice = health.pickFastest(['ddg', 'searxng']) || 'ddg'

  const fastProvider = fastChoice === 'searxng'
    ? () => timed('searxng', searxng.search(q), SEARXNG_TIMEOUT, 'searxng')
    : () => timed('ddg', ddg.search(q), DDG_TIMEOUT, 'ddg')
  const otherProvider = fastChoice === 'searxng'
    ? () => timed('ddg', ddg.search(q), DDG_TIMEOUT, 'ddg')
    : () => timed('searxng', searxng.search(q), SEARXNG_TIMEOUT, 'searxng')

  const fastP = fastProvider().then(
    (r) => tag(r, fastChoice as ProviderId),
    () => [] as SearchResult[]
  )
  const otherP = otherProvider().then(
    (r) => tag(r, (fastChoice === 'ddg' ? 'searxng' : 'ddg') as ProviderId),
    () => [] as SearchResult[]
  )

  // Stage 2 hard cutoff race: emit on first provider that passes the gate,
  // OR at 900ms regardless. Whichever fires first wins.
  let stage2Emitted = false
  const cutoff = new Promise<void>((r) => setTimeout(r, STAGE_2_BUDGET_MS))

  const tryEmit = (results: SearchResult[], provider: string): boolean => {
    if (stage2Emitted) return true
    const merged = dedupe([localRes, results])
    const ranked = rerank(merged)
    const gate = passesQualityGate(ranked)
    const ms = Math.round(performance.now() - started)
    plog({ session: sessionId, stage: 'fast', provider, results: ranked.length, time: ms + 'ms', gate: gate.ok ? 'pass' : 'fail:' + gate.reason })
    if (gate.ok) {
      stage2Emitted = true
      emit(opts, sessionId, q, 'fast',
        { ok: true, results: ranked, card, sources: ['local', fastChoice] },
        started, firstPaint)
      return true
    }
    return false
  }

  await Promise.race([
    fastP.then((r) => { tryEmit(r, fastChoice) }),
    cutoff
  ])
  if (!stage2Emitted) plog({ session: sessionId, stage: 'fast', cutoff: STAGE_2_BUDGET_MS + 'ms' })

  // Wait briefly for the second cheap provider to merge in.
  const [fastResolved, otherResolved] = await Promise.all([fastP, otherP])
  const cheapMerged = dedupe([localRes, fastResolved, otherResolved])
  const cheapRanked = rerank(cheapMerged)

  // If stage-2 didn't emit yet, try once more with both cheap providers.
  if (!stage2Emitted) {
    const gate = passesQualityGate(cheapRanked)
    if (gate.ok) {
      stage2Emitted = true
      emit(opts, sessionId, q, 'fast',
        { ok: true, results: cheapRanked, card, sources: ['local', 'ddg', 'searxng'] },
        started, firstPaint)
      plog({ session: sessionId, stage: 'fast', provider: 'ddg+searxng', results: cheapRanked.length, gate: 'pass' })
    }
  }

  // Google runs ONLY when:
  //   (a) the cheap fast-path failed the quality gate, OR
  //   (b) caller explicitly asked to deepen, OR
  //   (c) merged cheap results are still weak (<5 = below the gate's floor),
  // AND never on prefetch.
  const cheapWeak = cheapRanked.length < 5
  const needGoogle = !opts.prefetch && (!stage2Emitted || opts.deepen || cheapWeak)
  let googleRes: SearchResult[] = []
  if (needGoogle) {
    plog({ session: sessionId, google: 'running', reason: !stage2Emitted ? 'fast_gate_failed' : opts.deepen ? 'deepen' : 'cheap_weak' })
    try {
      googleRes = tag(await timed('google', googleHeadlessSearch(q, 'web'), GOOGLE_TIMEOUT, 'google'), 'google')
    } catch (e) {
      plog({ session: sessionId, google: 'failed', err: String((e as Error)?.message || e) })
    }
  } else {
    plog({ session: sessionId, google: 'skipped', reason: opts.prefetch ? 'prefetch' : 'fast_gate_passed' })
  }

  const allMerged = dedupe([localRes, googleRes, fastResolved, otherResolved])
  const allRanked = rerank(allMerged)
  const sources: string[] = ['local']
  if (googleRes.length) sources.push('google')
  if (fastResolved.length) sources.push(fastChoice)
  if (otherResolved.length) sources.push(fastChoice === 'ddg' ? 'searxng' : 'ddg')

  if (allRanked.length === 0) {
    const env: SearchEnvelope = { ok: false, reason: 'all_providers_failed' }
    emit(opts, sessionId, q, 'final', env, started, firstPaint)
    plog({ session: sessionId, final: Math.round(performance.now() - started) + 'ms', cached: false, ok: false })
    return env
  }

  const finalEnv: SearchEnvelope = { ok: true, results: allRanked, card, sources }
  emit(opts, sessionId, q, 'full', finalEnv, started, firstPaint)

  // Wait for wikipedia tail (briefly) so cache stores the richest envelope.
  await new Promise((r) => setTimeout(r, 200))
  if (card && finalEnv.ok) finalEnv.card = card
  emit(opts, sessionId, q, 'final', finalEnv, started, firstPaint)
  cache.set(q, finalEnv)
  plog({ session: sessionId, final: Math.round(performance.now() - started) + 'ms', cached: false, results: allRanked.length, sources: sources.join(',') })
  return finalEnv
}
