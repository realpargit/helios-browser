import { useState, useEffect, useRef } from 'react'
import { useBrowserStore } from '../../store/browserStore'

type Favorite = { url: string; title: string }

const MAX_FAVORITES = 10

function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10.3" y1="10.3" x2="14" y2="14"/></svg>
}

function faviconFor(url: string): string {
  try {
    const host = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`
  } catch { return '' }
}

function normalizeUrl(input: string): string {
  const v = input.trim()
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  return 'https://' + v
}

function FavoriteCard({ fav, index, onClick, onRemove }: { fav: Favorite; index: number; onClick: () => void; onRemove: () => void }) {
  const [hovered, setHovered] = useState(false)
  let hostname = fav.url
  try { hostname = new URL(fav.url).hostname } catch {}
  const label = (fav.title || hostname).replace(/^www\./, '')
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative' }}
    >
      <button
        onClick={onClick}
        style={{
          flexDirection: 'column',
          gap: 8,
          width: 80,
          height: 88,
          padding: '14px 8px 10px',
          background: hovered ? 'var(--bg-3)' : 'var(--bg-2)',
          border: `1px solid ${hovered ? 'var(--border-2)' : 'var(--border-0)'}`,
          borderRadius: 10,
          overflow: 'hidden',
          transition: 'background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered ? 'var(--shadow-md)' : 'none',
          animation: `slideUp 0.3s ${0.18 + index * 0.035}s cubic-bezier(0,0,0.2,1) both`
        }}
      >
        <img
          src={faviconFor(fav.url)}
          width={24}
          height={24}
          style={{ borderRadius: 4, flexShrink: 0 }}
          onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
        />
        <span style={{
          fontSize: 11,
          color: 'var(--text-1)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
          textAlign: 'center'
        }}>
          {label}
        </span>
      </button>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          title="Remove"
          style={{
            position: 'absolute', top: 2, right: 2,
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--bg-4)', color: 'var(--text-1)',
            border: '1px solid var(--border-2)',
            fontSize: 12, lineHeight: 1, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >×</button>
      )}
    </div>
  )
}

function AddCard({ index, onClick }: { index: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Add favorite"
      style={{
        flexDirection: 'column',
        gap: 8,
        width: 80,
        height: 88,
        padding: '14px 8px 10px',
        background: hovered ? 'var(--bg-3)' : 'var(--bg-2)',
        border: `1px dashed ${hovered ? 'var(--border-2)' : 'var(--border-1)'}`,
        borderRadius: 10,
        color: 'var(--text-2)',
        transition: 'background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        animation: `slideUp 0.3s ${0.18 + index * 0.035}s cubic-bezier(0,0,0.2,1) both`
      }}
    >
      <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 300, lineHeight: 1 }}>+</div>
      <span style={{ fontSize: 11 }}>Add</span>
    </button>
  )
}

function AddDialog({ onSave, onClose }: { onSave: (f: Favorite) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  useEffect(() => { setTimeout(() => nameRef.current?.focus(), 30) }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const u = normalizeUrl(url)
    if (!u) return
    onSave({ url: u, title: name.trim() })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          background: 'var(--bg-1)',
          border: '1px solid var(--border-1)',
          borderRadius: 12,
          padding: 24,
          width: 360,
          boxShadow: 'var(--shadow-md)',
          display: 'flex', flexDirection: 'column', gap: 14
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-0)' }}>Add shortcut</div>
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          style={{
            height: 38, padding: '0 12px', borderRadius: 8,
            background: 'var(--bg-2)', border: '1px solid var(--border-1)',
            fontSize: 13, color: 'var(--text-0)'
          }}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL"
          style={{
            height: 38, padding: '0 12px', borderRadius: 8,
            background: 'var(--bg-2)', border: '1px solid var(--border-1)',
            fontSize: 13, color: 'var(--text-0)'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" onClick={onClose} style={{ height: 32, padding: '0 14px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border-1)', color: 'var(--text-1)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" style={{ height: 32, padding: '0 14px', borderRadius: 6, background: 'var(--accent, #ff4500)', border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer' }}>Done</button>
        </div>
      </form>
    </div>
  )
}

export function NewTab() {
  const h = window.helios
  const [search, setSearch] = useState('')
  const [time, setTime] = useState(() => new Date())
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    h.settings.getAll().then((s: any) => {
      const list = Array.isArray(s?.favorites) ? s.favorites.filter((f: any) => f && typeof f.url === 'string') : []
      setFavorites(list)
    }).catch(() => {})
  }, [])

  function persist(next: Favorite[]) {
    setFavorites(next)
    h.settings.set('favorites', next).catch(() => {})
  }

  function addFavorite(f: Favorite) {
    if (favorites.some((x) => x.url === f.url)) { setAdding(false); return }
    persist([...favorites, f].slice(0, MAX_FAVORITES))
    setAdding(false)
  }

  function removeFavorite(url: string) {
    persist(favorites.filter((f) => f.url !== url))
  }

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
    // Warm DNS/TLS to search providers so first query has no handshake cost.
    h.search?.preconnect?.()
  }, [])

  // Debounced search-ahead: lets Enter reuse the inflight search.
  useEffect(() => {
    const v = search.trim()
    if (!v) return
    const t = window.setTimeout(() => {
      h.search?.start?.(v, true).catch(() => {})
    }, 150)
    return () => window.clearTimeout(t)
  }, [search])

  const hours = time.getHours()
  const greeting = hours < 5 ? 'Good night' : hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!search.trim()) return
    const { activeTabId } = useBrowserStore.getState()
    if (activeTabId) h.tabs.navigate(activeTabId, search.trim())
  }

  function navigate(url: string) {
    const { activeTabId } = useBrowserStore.getState()
    if (activeTabId) h.tabs.navigate(activeTabId, url)
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-0)',
      padding: '32px 48px',
      gap: 0
    }}>
      {/* Clock */}
      <div style={{
        fontSize: 60,
        fontWeight: 300,
        letterSpacing: '-0.03em',
        color: 'var(--text-0)',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        animation: 'slideUp 0.4s cubic-bezier(0,0,0.2,1) both'
      }}>
        {timeStr}
      </div>

      {/* Greeting */}
      <div style={{
        fontSize: 15,
        color: 'var(--text-2)',
        marginTop: 10,
        marginBottom: 36,
        fontWeight: 400,
        letterSpacing: '0.01em',
        animation: 'slideUp 0.4s 0.06s cubic-bezier(0,0,0.2,1) both'
      }}>
        {greeting}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: 540, position: 'relative', marginBottom: 40, animation: 'slideUp 0.4s 0.1s cubic-bezier(0,0,0.2,1) both' }}>
        <div style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-2)',
          pointerEvents: 'none',
          display: 'flex',
          transition: 'color var(--transition-fast)'
        }}>
          <SearchIcon />
        </div>
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search or enter address…"
          style={{
            width: '100%',
            height: 48,
            borderRadius: 24,
            padding: '0 20px 0 46px',
            fontSize: 14,
            background: 'var(--bg-2)',
            border: '1px solid var(--border-1)',
            userSelect: 'text',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast)'
          }}
        />
      </form>

      {/* Favorites */}
      <div style={{ width: '100%', maxWidth: 560, animation: 'slideUp 0.4s 0.15s cubic-bezier(0,0,0.2,1) both' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 10
        }}>
          {favorites.map((fav, i) => (
            <FavoriteCard
              key={fav.url}
              fav={fav}
              index={i}
              onClick={() => navigate(fav.url)}
              onRemove={() => removeFavorite(fav.url)}
            />
          ))}
          {favorites.length < MAX_FAVORITES && (
            <AddCard index={favorites.length} onClick={() => setAdding(true)} />
          )}
        </div>
      </div>

      {adding && <AddDialog onSave={addFavorite} onClose={() => setAdding(false)} />}
    </div>
  )
}
