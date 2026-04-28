import { BrowserWindow, session } from 'electron'
import type { SearchResult } from './types'
import { faviconFor } from './util'

// Hidden BrowserWindow that loads google.com/search like a real Chrome user.
// Google can't distinguish us from any other browser, so no JS-gate / consent
// wall blocks results. We extract the rendered DOM via executeJavaScript.
export type GoogleKind = 'web' | 'news' | 'videos' | 'images'

let win: BrowserWindow | null = null
let queue: Promise<unknown> = Promise.resolve()
let initialized = false

export function initHeadless() {
  if (initialized) return
  initialized = true
  const s = session.fromPartition('persist:helios-search')
  // Pre-seed Google's consent cookie so the first query never hits the EU
  // consent interstitial.
  s.cookies
    .set({
      url: 'https://www.google.com',
      name: 'CONSENT',
      value: 'YES+cb.20210720-07-p0.en+FX+410',
      domain: '.google.com',
      path: '/',
      secure: true,
      expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365
    })
    .catch(() => undefined)

  // Block resource types we don't read. The DOM extractor only walks anchors
  // and text — CSS, fonts, images, and media are pure waste.
  s.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, cb) => {
    const t = details.resourceType
    if (t === 'image' || t === 'media' || t === 'font' || t === 'stylesheet') {
      cb({ cancel: true })
      return
    }
    cb({ cancel: false })
  })

  win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 900,
    webPreferences: {
      session: s,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  win.on('closed', () => { win = null })
}

export function disposeHeadless() {
  if (win && !win.isDestroyed()) win.destroy()
  win = null
  initialized = false
}

const EXTRACTOR = `
(() => {
  const out = [];
  const seen = new Set();
  const anchors = document.querySelectorAll('a[href]');
  for (const a of anchors) {
    const url = a.href;
    if (!url || !/^https?:/.test(url)) continue;
    if (/^https?:\\/\\/(www\\.)?google\\./.test(url)) continue;
    if (/^https?:\\/\\/webcache\\./.test(url)) continue;
    if (/^https?:\\/\\/policies\\.google/.test(url)) continue;
    if (seen.has(url)) continue;

    // Find a heading inside the anchor: h3 (web), div[role=heading] (news/video),
    // or known card-title classes.
    const headEl = a.querySelector('h3, div[role="heading"], .MBeuO, .n0jPhd, .heVdSe');
    if (!headEl) continue;
    const title = (headEl.innerText || headEl.textContent || '').trim();
    if (!title || title.length < 3) continue;

    // Snippet: walk up to a block container, then look for known snippet classes,
    // else take any reasonable-length text block that isn't the title.
    let snippet = '';
    const block = a.closest('div.g, div.MjjYud, div.tF2Cxc, div.SoaBEf, div.WlydOe, div.dbsr, div[data-sokoban-container]') || a.parentElement;
    if (block) {
      const sn = block.querySelector('div[data-sncf], div.VwiC3b, span.VwiC3b, div.GI74Re, div.Y3v8qd, div.lEBKkf, .ITZIwc');
      if (sn) snippet = (sn.innerText || sn.textContent || '').trim();
      if (!snippet) {
        for (const d of block.querySelectorAll('div, span')) {
          const t = (d.innerText || d.textContent || '').trim();
          if (t && t !== title && t.length > 30 && t.length < 400 && !t.includes(title)) { snippet = t; break; }
        }
      }
    }
    seen.add(url);
    out.push({ title, url, description: snippet });
    if (out.length >= 20) break;
  }
  return out;
})();
`

function tbm(kind: GoogleKind): string {
  if (kind === 'news') return '&tbm=nws'
  if (kind === 'videos') return '&tbm=vid'
  if (kind === 'images') return '&tbm=isch'
  return ''
}

export async function googleHeadlessSearch(query: string, kind: GoogleKind = 'web'): Promise<SearchResult[]> {
  if (!initialized) initHeadless()
  if (!win || win.isDestroyed()) {
    initialized = false
    initHeadless()
  }
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en${tbm(kind)}`

  const run = async (): Promise<SearchResult[]> => {
    if (!win || win.isDestroyed()) throw new Error('search_window_disposed')
    const wc = win.webContents
    // dom-ready fires once the DOM is parsed — we don't need ads/scripts to settle.
    const ready = new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('google_timeout')), 4000)
      const ok = () => { cleanup(); resolve() }
      const fail = (_e: unknown, code: number, desc: string) => { cleanup(); reject(new Error('google_load_fail_' + code + '_' + desc)) }
      const cleanup = () => {
        clearTimeout(t)
        wc.removeListener('dom-ready', ok)
        wc.removeListener('did-fail-load', fail as any)
      }
      wc.once('dom-ready', ok)
      wc.once('did-fail-load', fail as any)
    })
    await wc.loadURL(url).catch(() => undefined)
    await ready
    let raw = await wc.executeJavaScript(EXTRACTOR, true)
    let list: Array<{ title: string; url: string; description: string }> = Array.isArray(raw) ? raw : []
    if (list.length === 0) {
      // One short retry — Google sometimes hydrates results late on slow days.
      await new Promise((r) => setTimeout(r, 100))
      raw = await wc.executeJavaScript(EXTRACTOR, true)
      list = Array.isArray(raw) ? raw : []
    }
    if (list.length === 0) {
      const html: string = await wc.executeJavaScript('document.documentElement.innerText.slice(0, 500)', true).catch(() => '')
      if (/unusual traffic|not a robot/i.test(html)) throw new Error('google_captcha')
    }
    return list.map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
      favicon: faviconFor(r.url)
    }))
  }

  const p = queue.then(run, run)
  queue = p.catch(() => undefined)
  return p
}
