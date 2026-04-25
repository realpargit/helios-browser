import { useState, useEffect, useRef } from 'react'
import { useBrowserStore } from '../../store/browserStore'
import type { HistoryEntry } from '../../types'

function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10.3" y1="10.3" x2="14" y2="14"/></svg>
}

function SiteCard({ entry, hostname, index, onClick }: { entry: HistoryEntry; hostname: string; index: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
      {entry.favicon ? (
        <img src={entry.favicon} width={24} height={24} style={{ borderRadius: 4, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--bg-4)' }} />
      )}
      <span style={{
        fontSize: 11,
        color: 'var(--text-1)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: '100%',
        textAlign: 'center'
      }}>
        {hostname.replace('www.', '')}
      </span>
    </button>
  )
}

export function NewTab() {
  const { history, bookmarks } = useBrowserStore()
  const h = window.helios
  const [search, setSearch] = useState('')
  const [time, setTime] = useState(() => new Date())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

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

  // Top 8 unique recent history entries
  const seen = new Set<string>()
  const topSites = history.filter(e => {
    if (seen.has(e.url)) return false
    seen.add(e.url)
    return true
  }).slice(0, 8)

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

      {/* Recent sites */}
      {topSites.length > 0 && (
        <div style={{ width: '100%', maxWidth: 560, animation: 'slideUp 0.4s 0.15s cubic-bezier(0,0,0.2,1) both' }}>
          <p style={{
            fontSize: 10,
            color: 'var(--text-2)',
            marginBottom: 14,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textAlign: 'center',
            fontWeight: 500
          }}>
            Recent
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 10
          }}>
            {topSites.map((entry, i) => {
              let hostname = entry.url
              try { hostname = new URL(entry.url).hostname } catch {}
              return (
                <SiteCard
                  key={entry.id}
                  entry={entry}
                  hostname={hostname}
                  index={i}
                  onClick={() => navigate(entry.url)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
