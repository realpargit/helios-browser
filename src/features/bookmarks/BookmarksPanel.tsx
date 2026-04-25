import { useState } from 'react'
import { useBrowserStore } from '../../store/browserStore'
import type { Bookmark } from '../../types'

export function BookmarksPanel() {
  const { bookmarks, setBookmarks, activeTabId } = useBrowserStore()
  const h = window.helios

  async function handleDelete(id: number) {
    await h.bookmarks.delete(id)
    setBookmarks(bookmarks.filter((b) => b.id !== id))
  }

  function navigate(url: string) {
    if (activeTabId) h.tabs.navigate(activeTabId, url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border-0)', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Bookmarks</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {bookmarks.map((bk) => (
          <BookmarkItem key={bk.id} bk={bk} onNavigate={navigate} onDelete={handleDelete} />
        ))}
        {bookmarks.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-2)', fontSize: 12 }}>No bookmarks yet</div>
        )}
      </div>
    </div>
  )
}

function BookmarkItem({ bk, onNavigate, onDelete }: { bk: Bookmark; onNavigate: (url: string) => void; onDelete: (id: number) => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onNavigate(bk.url)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        background: hovered ? 'var(--bg-2)' : 'transparent',
        transition: 'background var(--transition-fast)',
        cursor: 'pointer'
      }}
    >
      {bk.favicon ? (
        <img src={bk.favicon} width={14} height={14} style={{ flexShrink: 0, borderRadius: 2 }} />
      ) : (
        <div style={{ width: 14, height: 14, background: 'var(--bg-3)', borderRadius: 2, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 12, color: 'var(--text-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {bk.title || bk.url}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {bk.url}
        </div>
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(bk.id) }}
          style={{ width: 20, height: 20, fontSize: 14, color: 'var(--text-2)', flexShrink: 0, animation: 'fadeIn 0.1s ease both' }}
        >
          ×
        </button>
      )}
    </div>
  )
}
