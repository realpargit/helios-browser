import { useState } from 'react'
import { useBrowserStore } from '../../store/browserStore'
import type { HistoryEntry } from '../../types'

export function HistoryPanel() {
  const { history, setHistory, activeTabId } = useBrowserStore()
  const h = window.helios
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<HistoryEntry[] | null>(null)

  async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setSearch(q)
    if (q.trim()) {
      const res = await h.history.search(q.trim())
      setResults(res)
    } else {
      setResults(null)
    }
  }

  async function handleDelete(id: number) {
    await h.history.delete(id)
    setHistory(history.filter((entry) => entry.id !== id))
    if (results) setResults(results.filter((r) => r.id !== id))
  }

  async function handleClear() {
    await h.history.clear()
    setHistory([])
    setResults(null)
  }

  const displayed = results ?? history

  function navigate(url: string) {
    if (activeTabId) h.tabs.navigate(activeTabId, url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border-0)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>History</span>
          <button onClick={handleClear} style={{ fontSize: 11, color: 'var(--danger)', padding: '2px 6px', borderRadius: 3 }}>Clear</button>
        </div>
        <input
          value={search}
          onChange={handleSearch}
          placeholder="Search history..."
          style={{ width: '100%', height: 28, fontSize: 12 }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {displayed.map((entry) => (
          <HistoryItem key={entry.id} entry={entry} onNavigate={navigate} onDelete={handleDelete} />
        ))}
        {displayed.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-2)', fontSize: 12 }}>No history yet</div>
        )}
      </div>
    </div>
  )
}

function HistoryItem({ entry, onNavigate, onDelete }: { entry: HistoryEntry; onNavigate: (url: string) => void; onDelete: (id: number) => void }) {
  const [hovered, setHovered] = useState(false)
  const date = new Date(entry.visited_at)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        background: hovered ? 'var(--bg-2)' : 'transparent',
        transition: 'background var(--transition-fast)',
        cursor: 'pointer'
      }}
      onClick={() => onNavigate(entry.url)}
    >
      {entry.favicon ? (
        <img src={entry.favicon} width={14} height={14} style={{ flexShrink: 0, borderRadius: 2 }} />
      ) : (
        <div style={{ width: 14, height: 14, background: 'var(--bg-3)', borderRadius: 2, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 12, color: 'var(--text-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.title || entry.url}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {timeStr} · {entry.url}
        </div>
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }}
          style={{ width: 20, height: 20, fontSize: 14, color: 'var(--text-2)', flexShrink: 0, animation: 'fadeIn 0.1s ease both' }}
        >
          ×
        </button>
      )}
    </div>
  )
}
