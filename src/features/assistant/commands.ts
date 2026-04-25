// Pattern-matched command bar. No LLM. Recognizes natural-ish phrases and
// dispatches them through the existing window.helios IPC.

const SITES: Record<string, string> = {
  google:        'https://www.google.com',
  youtube:       'https://www.youtube.com',
  yt:            'https://www.youtube.com',
  gmail:         'https://mail.google.com',
  mail:          'https://mail.google.com',
  drive:         'https://drive.google.com',
  maps:          'https://maps.google.com',
  calendar:      'https://calendar.google.com',
  photos:        'https://photos.google.com',
  translate:     'https://translate.google.com',
  docs:          'https://docs.google.com',
  sheets:        'https://sheets.google.com',
  slides:        'https://slides.google.com',
  meet:          'https://meet.google.com',
  spotify:       'https://open.spotify.com',
  github:        'https://github.com',
  gh:            'https://github.com',
  stackoverflow: 'https://stackoverflow.com',
  reddit:        'https://www.reddit.com',
  twitter:       'https://x.com',
  x:             'https://x.com',
  facebook:      'https://www.facebook.com',
  fb:            'https://www.facebook.com',
  instagram:     'https://www.instagram.com',
  ig:            'https://www.instagram.com',
  whatsapp:      'https://web.whatsapp.com',
  linkedin:      'https://www.linkedin.com',
  discord:       'https://discord.com',
  twitch:        'https://www.twitch.tv',
  netflix:       'https://www.netflix.com',
  amazon:        'https://www.amazon.com',
  ebay:          'https://www.ebay.com',
  wikipedia:     'https://en.wikipedia.org',
  wiki:          'https://en.wikipedia.org',
  chatgpt:       'https://chat.openai.com',
  claude:        'https://claude.ai',
  notion:        'https://www.notion.so',
  figma:         'https://www.figma.com',
  apple:         'https://www.apple.com',
  microsoft:     'https://www.microsoft.com',
  outlook:       'https://outlook.live.com',
  office:        'https://www.office.com',
  pinterest:     'https://www.pinterest.com',
  tiktok:        'https://www.tiktok.com',
  dropbox:       'https://www.dropbox.com',
  paypal:        'https://www.paypal.com'
}

const THEMES = ['google','dark','light','midnight','dracula','nord','sepia','ocean','forest','rose','high-contrast']

export type CommandResult = { ok: boolean; reply: string }

function resolveSite(name: string): string | null {
  const k = name.toLowerCase().trim()
  if (SITES[k]) return SITES[k]
  if (k.includes('.') && !k.includes(' ')) return k.startsWith('http') ? k : 'https://' + k
  return null
}

function looksLikeUrl(s: string): boolean {
  return /^https?:\/\//i.test(s) || (s.includes('.') && !s.includes(' '))
}

export async function runCommand(input: string): Promise<CommandResult> {
  const h = (window as any).helios
  const raw = input.trim()
  if (!raw) return { ok: false, reply: 'Say something.' }
  const s = raw.toLowerCase()

  // Help
  if (s === 'help' || s === '?' || s === 'commands') {
    return { ok: true, reply:
      'Try:\n' +
      '  open spotify  /  open youtube.com  /  open https://...\n' +
      '  new tab github  /  search cats playing piano\n' +
      '  close tab  /  close all tabs  /  close other tabs\n' +
      '  back  /  forward  /  reload\n' +
      '  bookmark this  /  list bookmarks  /  list tabs\n' +
      '  set theme dark  /  clear history  /  show downloads\n' +
      '  quit'
    }
  }

  // Quit
  if (s === 'quit' || s === 'exit' || s === 'close browser') {
    await h.window.close()
    return { ok: true, reply: 'Bye.' }
  }

  // Window controls
  if (s === 'minimize') { await h.window.minimize(); return { ok: true, reply: 'Minimized.' } }
  if (s === 'maximize' || s === 'fullscreen') { await h.window.maximize(); return { ok: true, reply: 'Toggled maximize.' } }

  // Tabs: navigation
  if (s === 'back' || s === 'go back') {
    const id = await h.tabs.getActive(); if (id) await h.tabs.back(id)
    return { ok: true, reply: 'Back.' }
  }
  if (s === 'forward' || s === 'go forward') {
    const id = await h.tabs.getActive(); if (id) await h.tabs.forward(id)
    return { ok: true, reply: 'Forward.' }
  }
  if (s === 'reload' || s === 'refresh') {
    const id = await h.tabs.getActive(); if (id) await h.tabs.reload(id)
    return { ok: true, reply: 'Reloading.' }
  }

  // Tabs: close variants
  if (s === 'close all tabs' || s === 'close all') {
    await h.assistant.closeAllTabs()
    return { ok: true, reply: 'Closed all tabs.' }
  }
  if (s === 'close other tabs' || s === 'close others') {
    const all = await h.tabs.getAll()
    const active = await h.tabs.getActive()
    for (const t of all) if (t.id !== active) await h.tabs.close(t.id)
    return { ok: true, reply: 'Closed other tabs.' }
  }
  if (s === 'close tab' || s === 'close this tab' || s === 'close') {
    const id = await h.tabs.getActive(); if (id) await h.tabs.close(id)
    return { ok: true, reply: 'Closed.' }
  }

  // List things
  if (s === 'list tabs' || s === 'show tabs') {
    const all = await h.tabs.getAll()
    if (!all.length) return { ok: true, reply: 'No tabs.' }
    return { ok: true, reply: all.map((t: any, i: number) => `${i + 1}. ${t.title || t.url}`).join('\n') }
  }
  if (s === 'list bookmarks' || s === 'show bookmarks') {
    const bk = await h.bookmarks.getAll()
    if (!bk.length) return { ok: true, reply: 'No bookmarks yet.' }
    return { ok: true, reply: bk.slice(0, 20).map((b: any) => `• ${b.title} — ${b.url}`).join('\n') }
  }
  if (s === 'show downloads' || s === 'list downloads') {
    const dl = await h.downloads.getAll()
    if (!dl.length) return { ok: true, reply: 'No downloads.' }
    return { ok: true, reply: dl.slice(0, 10).map((d: any) => `• ${d.filename} (${d.state})`).join('\n') }
  }
  if (s === 'show history') {
    const hi = await h.history.getAll({ limit: 15 })
    if (!hi.length) return { ok: true, reply: 'History is empty.' }
    return { ok: true, reply: hi.map((r: any) => `• ${r.title || r.url}`).join('\n') }
  }

  // Bookmark this
  if (s === 'bookmark this' || s === 'bookmark' || s === 'save this') {
    const id = await h.tabs.getActive()
    const all = await h.tabs.getAll()
    const tab = all.find((t: any) => t.id === id)
    if (!tab || !tab.url || tab.url.startsWith('about:')) return { ok: false, reply: 'Nothing to bookmark.' }
    await h.bookmarks.add({ url: tab.url, title: tab.title, favicon: tab.favicon })
    return { ok: true, reply: `Bookmarked ${tab.title || tab.url}.` }
  }

  // Clear data
  if (s === 'clear history') { await h.history.clear(); return { ok: true, reply: 'History cleared.' } }
  if (s === 'clear downloads') { await h.downloads.clear(); return { ok: true, reply: 'Downloads cleared.' } }

  // Theme
  const themeMatch = s.match(/^(?:set\s+)?theme\s+(.+)$/)
  if (themeMatch) {
    const wanted = themeMatch[1].trim()
    if (!THEMES.includes(wanted)) return { ok: false, reply: `Unknown theme. Try: ${THEMES.join(', ')}` }
    await h.settings.set('theme', wanted)
    return { ok: true, reply: `Theme set to ${wanted}.` }
  }

  // open / new tab / search
  const openMatch = raw.match(/^(?:open|go to|goto|visit)\s+(.+)$/i)
  const newTabMatch = raw.match(/^(?:new tab|open new tab|tab)\s+(.+)$/i)
  const searchMatch = raw.match(/^(?:search|google|find)\s+(.+)$/i)

  if (newTabMatch) {
    const target = newTabMatch[1].trim()
    const url = resolveSite(target) ?? (looksLikeUrl(target) ? (target.startsWith('http') ? target : 'https://' + target) : null)
    if (url) {
      await h.tabs.create(url)
      return { ok: true, reply: `Opened ${url} in a new tab.` }
    }
    await h.tabs.create()
    const id = await h.tabs.getActive()
    if (id) await h.tabs.navigate(id, target)
    return { ok: true, reply: `Searched for "${target}" in a new tab.` }
  }

  if (openMatch) {
    const target = openMatch[1].trim()
    const url = resolveSite(target) ?? (looksLikeUrl(target) ? (target.startsWith('http') ? target : 'https://' + target) : null)
    if (url) {
      const id = await h.tabs.getActive()
      if (id) await h.tabs.navigate(id, url)
      return { ok: true, reply: `Opening ${url}.` }
    }
    const id = await h.tabs.getActive()
    if (id) await h.tabs.navigate(id, target)
    return { ok: true, reply: `Searching for "${target}".` }
  }

  if (searchMatch) {
    const q = searchMatch[1].trim()
    const id = await h.tabs.getActive()
    if (id) await h.tabs.navigate(id, q)
    return { ok: true, reply: `Searching for "${q}".` }
  }

  // Bare URL or known site name
  const direct = resolveSite(raw)
  if (direct) {
    const id = await h.tabs.getActive()
    if (id) await h.tabs.navigate(id, direct)
    return { ok: true, reply: `Opening ${direct}.` }
  }

  // Fallback: treat as a search query in the active tab
  const id = await h.tabs.getActive()
  if (id) {
    await h.tabs.navigate(id, raw)
    return { ok: true, reply: `Searching for "${raw}".` }
  }
  return { ok: false, reply: 'No active tab.' }
}
