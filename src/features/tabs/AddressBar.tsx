import { useState, useRef, useEffect, useMemo } from 'react'
import { useBrowserStore } from '../../store/browserStore'

type Suggestion = {
  kind: 'history' | 'bookmark' | 'popular' | 'search'
  url: string
  title: string
  favicon?: string
}

const POPULAR_SITES: Array<{ name: string; url: string }> = [
  { name: 'Google',    url: 'https://www.google.com' },
  { name: 'YouTube',   url: 'https://www.youtube.com' },
  { name: 'Gmail',     url: 'https://mail.google.com' },
  { name: 'Google Drive', url: 'https://drive.google.com' },
  { name: 'Google Maps',  url: 'https://maps.google.com' },
  { name: 'Google Calendar', url: 'https://calendar.google.com' },
  { name: 'Google Photos',   url: 'https://photos.google.com' },
  { name: 'Google Translate',url: 'https://translate.google.com' },
  { name: 'Google Docs',     url: 'https://docs.google.com' },
  { name: 'Google Sheets',   url: 'https://sheets.google.com' },
  { name: 'Google Meet',     url: 'https://meet.google.com' },
  { name: 'Spotify',         url: 'https://open.spotify.com' },
  { name: 'GitHub',          url: 'https://github.com' },
  { name: 'Stack Overflow',  url: 'https://stackoverflow.com' },
  { name: 'Reddit',          url: 'https://www.reddit.com' },
  { name: 'Twitter / X',     url: 'https://x.com' },
  { name: 'Facebook',        url: 'https://www.facebook.com' },
  { name: 'Instagram',       url: 'https://www.instagram.com' },
  { name: 'WhatsApp Web',    url: 'https://web.whatsapp.com' },
  { name: 'LinkedIn',        url: 'https://www.linkedin.com' },
  { name: 'Discord',         url: 'https://discord.com' },
  { name: 'Twitch',          url: 'https://www.twitch.tv' },
  { name: 'Netflix',         url: 'https://www.netflix.com' },
  { name: 'Amazon',          url: 'https://www.amazon.com' },
  { name: 'eBay',            url: 'https://www.ebay.com' },
  { name: 'Wikipedia',       url: 'https://en.wikipedia.org' },
  { name: 'ChatGPT',         url: 'https://chat.openai.com' },
  { name: 'Claude',          url: 'https://claude.ai' },
  { name: 'Notion',          url: 'https://www.notion.so' },
  { name: 'Figma',           url: 'https://www.figma.com' },
  { name: 'Apple',           url: 'https://www.apple.com' },
  { name: 'Microsoft',       url: 'https://www.microsoft.com' },
  { name: 'Outlook',         url: 'https://outlook.live.com' },
  { name: 'Office 365',      url: 'https://www.office.com' },
  { name: 'Pinterest',       url: 'https://www.pinterest.com' },
  { name: 'TikTok',          url: 'https://www.tiktok.com' },
  { name: 'Dropbox',         url: 'https://www.dropbox.com' },
  { name: 'PayPal',          url: 'https://www.paypal.com' }
]

function BackIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
}
function ForwardIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
}
function ReloadIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
}
function HomeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>
}
function StopIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
}
function LockIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
}
function InfoIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
}
function StarFilledIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
}
function StarEmptyIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
}
function SearchGlyph() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
}
function HistoryGlyph() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15.5,14"/></svg>
}
function GlobeGlyph() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>
}

export function AddressBar() {
  const { tabs, activeTabId, bookmarks, history, settings, setUrlBarFocused } = useBrowserStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const h = window.helios

  const [inputValue, setInputValue] = useState(activeTab?.url || '')
  const [focused, setFocused] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [reloadSpin, setReloadSpin] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!focused && activeTab) {
      const u = activeTab.url
      if (u === 'about:newtab') setInputValue('')
      else if (u.startsWith('about:search')) setInputValue(decodeURIComponent(u.split('?q=')[1] || ''))
      else setInputValue(u)
    }
  }, [activeTab?.url, focused])

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = inputValue.trim().toLowerCase()
    if (!q) return []
    const seen = new Set<string>()
    const out: Suggestion[] = []
    const push = (s: Suggestion) => {
      const key = s.url
      if (seen.has(key)) return
      seen.add(key)
      out.push(s)
    }
    for (const b of bookmarks as any[]) {
      if ((b.title || '').toLowerCase().includes(q) || (b.url || '').toLowerCase().includes(q)) {
        push({ kind: 'bookmark', url: b.url, title: b.title || b.url, favicon: b.favicon })
      }
    }
    for (const hi of history as any[]) {
      if ((hi.title || '').toLowerCase().includes(q) || (hi.url || '').toLowerCase().includes(q)) {
        push({ kind: 'history', url: hi.url, title: hi.title || hi.url, favicon: hi.favicon })
      }
      if (out.length >= 12) break
    }
    for (const p of POPULAR_SITES) {
      if (p.name.toLowerCase().includes(q) || p.url.toLowerCase().includes(q)) {
        push({ kind: 'popular', url: p.url, title: p.name })
      }
    }
    const trimmed = out.slice(0, 8)
    if (trimmed.length === 0 || !trimmed.some(s => s.kind === 'search')) {
      trimmed.unshift({ kind: 'search', url: inputValue.trim(), title: inputValue.trim() })
    }
    return trimmed.slice(0, 8)
  }, [inputValue, bookmarks, history])

  useEffect(() => { setHighlight(0) }, [inputValue])

  const showSuggestions = focused && suggestions.length > 0 && inputValue.trim().length > 0

  function navigate(target: string) {
    if (!activeTabId) return
    h.tabs.navigate(activeTabId, target)
    inputRef.current?.blur()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeTabId || !inputValue.trim()) return
    const pick = showSuggestions ? suggestions[highlight] : null
    navigate(pick ? pick.url : inputValue.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((i) => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Escape') { inputRef.current?.blur() }
  }

  const canGoBack = activeTab?.canGoBack ?? false
  const canGoForward = activeTab?.canGoForward ?? false
  const isLoading = activeTab?.isLoading ?? false
  const url = activeTab?.url || ''
  const isHttps = url.startsWith('https://')
  const isAboutPage = url.startsWith('about:') || url === ''

  return (
    <div style={{
      height: 44,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '0 10px',
      WebkitAppRegion: 'no-drag' as any
    }}>
      <RoundBtn onClick={() => activeTabId && h.tabs.back(activeTabId)} disabled={!canGoBack} title="Back">
        <BackIcon />
      </RoundBtn>
      <RoundBtn onClick={() => activeTabId && h.tabs.forward(activeTabId)} disabled={!canGoForward} title="Forward">
        <ForwardIcon />
      </RoundBtn>
      <RoundBtn
        onClick={() => {
          if (!activeTabId) return
          if (isLoading) { h.tabs.stop(activeTabId) }
          else { setReloadSpin((n) => n + 1); h.tabs.reload(activeTabId) }
        }}
        title={isLoading ? 'Stop' : 'Reload this page'}
      >
        {isLoading
          ? <span style={{ display: 'inline-flex', animation: 'spin 0.9s linear infinite' }}><ReloadIcon /></span>
          : <span key={reloadSpin} className="helios-reload-spin" style={{ display: 'inline-flex' }}><ReloadIcon /></span>}
      </RoundBtn>
      <RoundBtn
        onClick={() => {
          if (!activeTabId) return
          h.tabs.navigate(activeTabId, 'about:newtab')
        }}
        title="Home"
      >
        <HomeIcon />
      </RoundBtn>

      {/* Omnibox pill */}
      <form
        key={focused ? 'f' : 'b'}
        className={focused ? 'helios-omnibox-focused' : ''}
        data-anim-target="addr"
        onSubmit={handleSubmit}
        onClick={() => inputRef.current?.focus()}
        style={{
          flex: 1,
          height: 32,
          margin: '0 8px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 10,
          borderRadius: showSuggestions ? '18px 18px 0 0' : 18,
          background: focused ? 'var(--bg-0)' : 'var(--bg-2)',
          border: `1px solid ${focused ? 'var(--accent)' : 'transparent'}`,
          boxShadow: focused ? '0 0 0 2px var(--accent-glow)' : 'none',
          cursor: 'text',
          position: 'relative',
          transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s, border-radius 0.12s'
        }}
      >
        {showSuggestions && (
          <div style={{
            position: 'absolute',
            left: -1,
            right: -1,
            top: 'calc(100% + 1px)',
            background: 'var(--bg-0)',
            border: '1px solid var(--border-1)',
            borderTop: 'none',
            borderRadius: '0 0 14px 14px',
            boxShadow: 'var(--shadow-md)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'fadeIn 0.12s ease-out'
          }}>
            {suggestions.map((s, i) => (
              <div
                key={s.kind + ':' + s.url + ':' + i}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => { e.preventDefault(); navigate(s.url) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  background: highlight === i ? 'var(--bg-2)' : 'transparent',
                  fontSize: 13
                }}
              >
                <div style={{ width: 16, height: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
                  {s.kind === 'search' ? <SearchGlyph /> :
                   s.kind === 'history' ? <HistoryGlyph /> :
                   s.kind === 'bookmark' ? <StarEmptyIcon /> :
                   s.favicon ? <img src={s.favicon} width={16} height={16} style={{ borderRadius: 2 }} /> : <GlobeGlyph />}
                </div>
                <span style={{ color: 'var(--text-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.kind === 'search' ? `${s.title} — Search Google` : s.title}
                </span>
                {s.kind !== 'search' && (
                  <span style={{ marginLeft: 'auto', color: 'var(--text-2)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40%' }}>
                    {s.url.replace(/^https?:\/\//, '')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <div style={{
          color: isHttps ? 'var(--text-1)' : 'var(--text-2)',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          pointerEvents: 'none'
        }}>
          {isAboutPage ? <InfoIcon /> : (isHttps ? <LockIcon /> : <InfoIcon />)}
        </div>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { setFocused(true); setUrlBarFocused(true); setTimeout(() => inputRef.current?.select(), 0) }}
          onBlur={() => { setFocused(false); setUrlBarFocused(false) }}
          placeholder="Search Google or type a URL"
          spellCheck={false}
          style={{
            flex: 1,
            height: '100%',
            fontSize: 13,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
            color: 'var(--text-0)',
            userSelect: 'text',
            boxShadow: 'none'
          }}
        />
      </form>

      <BookmarkButton tab={activeTab} />
    </div>
  )
}

function RoundBtn({ onClick, disabled, title, children }: {
  onClick?: () => void; disabled?: boolean; title: string; children: React.ReactNode
}) {
  return (
    <button
      className="helios-navbtn"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        color: disabled ? 'var(--text-2)' : 'var(--text-1)'
      }}
    >
      {children}
    </button>
  )
}

function BookmarkButton({ tab }: { tab: any }) {
  const { bookmarks, setBookmarks } = useBrowserStore()
  const h = window.helios
  if (!tab || tab.url === 'about:newtab' || !tab.url) return null

  const isBookmarked = bookmarks.some((b: any) => b.url === tab.url)

  async function toggle() {
    if (isBookmarked) {
      const bk = bookmarks.find((b: any) => b.url === tab.url)
      if (bk) {
        await h.bookmarks.delete(bk.id)
        setBookmarks(bookmarks.filter((b: any) => b.id !== bk.id))
      }
    } else {
      await h.bookmarks.add({ url: tab.url, title: tab.title, favicon: tab.favicon })
      const all = await h.bookmarks.getAll()
      setBookmarks(all)
    }
  }

  return (
    <button
      onClick={toggle}
      style={{ width: 32, height: 32, borderRadius: '50%', color: isBookmarked ? 'var(--accent)' : 'var(--text-1)' }}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
    >
      {isBookmarked ? <StarFilledIcon /> : <StarEmptyIcon />}
    </button>
  )
}
