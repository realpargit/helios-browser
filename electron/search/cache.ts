import type { SearchEnvelope } from './types'

const FRESH_TTL = 5 * 60 * 1000
const STALE_TTL = 30 * 60 * 1000
const MAX = 200

type Entry = { ts: number; envelope: SearchEnvelope }

const map = new Map<string, Entry>()
const inflight = new Map<string, Promise<SearchEnvelope>>()

function normalize(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function key(query: string, kind = 'web'): string {
  return kind + '::' + normalize(query)
}

function evict() {
  while (map.size > MAX) {
    const oldest = map.keys().next().value
    if (!oldest) break
    map.delete(oldest)
  }
}

export type CacheStatus = 'fresh' | 'stale' | 'miss'

export function get(query: string, kind = 'web'): { status: CacheStatus; envelope?: SearchEnvelope } {
  const k = key(query, kind)
  const e = map.get(k)
  if (!e) return { status: 'miss' }
  const age = Date.now() - e.ts
  if (age < FRESH_TTL) return { status: 'fresh', envelope: e.envelope }
  if (age < STALE_TTL) return { status: 'stale', envelope: e.envelope }
  map.delete(k)
  return { status: 'miss' }
}

export function set(query: string, envelope: SearchEnvelope, kind = 'web') {
  const k = key(query, kind)
  // LRU bump: re-set moves to end.
  map.delete(k)
  map.set(k, { ts: Date.now(), envelope })
  evict()
}

export function getInflight(query: string, kind = 'web'): Promise<SearchEnvelope> | undefined {
  return inflight.get(key(query, kind))
}

export function setInflight(query: string, p: Promise<SearchEnvelope>, kind = 'web') {
  const k = key(query, kind)
  inflight.set(k, p)
  p.finally(() => { inflight.delete(k) })
}

// Prefix reuse: if "rust async traits" misses but "rust async" is fresh,
// return its envelope as a stage-1 placeholder. Caller should still kick a
// real search; this just gets *something* on screen instantly.
export function getPrefix(query: string, kind = 'web'): SearchEnvelope | undefined {
  const q = normalize(query)
  if (q.length < 3) return undefined
  const tokens = q.split(' ')
  if (tokens.length < 2) return undefined
  // Try progressively shorter prefixes.
  for (let n = tokens.length - 1; n >= 1; n--) {
    const prefix = tokens.slice(0, n).join(' ')
    const k = key(prefix, kind)
    const e = map.get(k)
    if (e && Date.now() - e.ts < STALE_TTL && e.envelope.ok) return e.envelope
  }
  return undefined
}

export function clear() {
  map.clear()
  inflight.clear()
}
