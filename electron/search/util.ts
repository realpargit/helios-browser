export function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}_timeout`)), ms)
    p.then((v) => { clearTimeout(t); resolve(v) }, (e) => { clearTimeout(t); reject(e) })
  })
}

export function hostOf(u: string): string {
  try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' }
}

// DuckDuckGo's free favicon service — no key, no Google.
export function faviconFor(url: string): string | undefined {
  const h = hostOf(url)
  if (!h) return undefined
  return `https://icons.duckduckgo.com/ip3/${h}.ico`
}

export function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(parseInt(d, 10)))
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Helios/0.1 Chrome/124.0.0.0 Safari/537.36'

export async function fetchText(url: string, init?: RequestInit, timeoutMs = 5000): Promise<string> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', ...(init?.headers || {}) }
    })
    if (!res.ok) throw new Error(`http_${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}

export async function fetchJSON<T = any>(url: string, init?: RequestInit, timeoutMs = 5000): Promise<T> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { 'User-Agent': UA, 'Accept': 'application/json', ...(init?.headers || {}) }
    })
    if (!res.ok) throw new Error(`http_${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(t)
  }
}
