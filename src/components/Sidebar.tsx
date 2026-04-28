import { useEffect, useRef } from 'react'
import { useBrowserStore } from '../store/browserStore'
import type { SidebarPanel } from '../types'
import { HistoryPanel } from '../features/history/HistoryPanel'
import { BookmarksPanel } from '../features/bookmarks/BookmarksPanel'
import { DownloadsPanel } from '../features/downloads/DownloadsPanel'
import { UserMenu } from '../features/auth/UserMenu'

const PANEL_HEIGHT = 320

function BookmarkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2h10a1 1 0 0 1 1 1v11l-6-3.5L2 14V3a1 1 0 0 1 1-1z" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <polyline points="8,4.5 8,8 10.5,9.5" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v8M5 7l3 3 3-3" />
      <path d="M2 12h12" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.6 5.5L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.5L12 2zM19 14l.8 2.7L22 17.5l-2.2.7L19 21l-.8-2.7L16 17.5l2.2-.8L19 14z"/>
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85" />
    </svg>
  )
}

const PANELS: { id: Exclude<NonNullable<SidebarPanel>, 'settings'>; icon: React.ReactNode; label: string }[] = [
  { id: 'bookmarks', icon: <BookmarkIcon />, label: 'Bookmarks' },
  { id: 'history',   icon: <HistoryIcon />,  label: 'History' },
  { id: 'downloads', icon: <DownloadIcon />, label: 'Downloads' }
]

const PANEL_COMPONENTS: Record<Exclude<NonNullable<SidebarPanel>, 'settings'>, React.ReactNode> = {
  bookmarks: <BookmarksPanel />,
  history:   <HistoryPanel />,
  downloads: <DownloadsPanel />
}

export function Sidebar() {
  const { sidebarPanel, toggleSidebar, setSettingsOpen } = useBrowserStore()
  const panelRef = useRef<HTMLDivElement | null>(null)

  // Close on outside click
  useEffect(() => {
    if (!sidebarPanel) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (panelRef.current && !panelRef.current.contains(target)) {
        // Don't close when clicking on the topbar buttons themselves — they handle their own toggle
        const topbar = document.getElementById('helios-topbar')
        if (topbar && topbar.contains(target)) return
        toggleSidebar(sidebarPanel)
      }
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [sidebarPanel, toggleSidebar])

  return (
    <>
      {/* Horizontal nav row — transparent, sits in the chrome below the AddressBar */}
      <div
        id="helios-topbar"
        style={{
          height: 36,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '0 8px',
          background: 'transparent',
          WebkitAppRegion: 'no-drag' as any
        }}
      >
        {PANELS.map(({ id, icon, label }) => (
          <NavButton
            key={id}
            icon={icon}
            label={label}
            isActive={sidebarPanel === id}
            onClick={() => toggleSidebar(id)}
          />
        ))}
        <div style={{ flex: 1 }} />
        <NavButton
          icon={<SparkIcon />}
          label="Assistant (Ctrl+K)"
          isActive={false}
          onClick={() => (window as any).__heliosOpenAssistant?.()}
        />
        <NavButton
          icon={<GearIcon />}
          label="Settings"
          isActive={false}
          onClick={() => setSettingsOpen(true)}
        />
        <UserMenu />
      </div>

      {/* Floating dropdown panel — overlays the page (BrowserView is pushed down via chrome.setTopInset) */}
      <div
        ref={panelRef}
        data-anim-target="panel"
        style={{
          position: 'fixed',
          top: 112,
          left: 0,
          right: 0,
          height: PANEL_HEIGHT,
          background: 'var(--bg-1)',
          borderBottom: '1px solid var(--border-0)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          zIndex: 40,
          transform: sidebarPanel ? 'translateY(0)' : `translateY(-${PANEL_HEIGHT + 8}px)`,
          opacity: sidebarPanel ? 1 : 0,
          pointerEvents: sidebarPanel ? 'auto' : 'none',
          transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease'
        }}
      >
        {PANELS.map(({ id }) => (
          <div
            key={id}
            style={{
              position: 'absolute',
              inset: 0,
              display: sidebarPanel === id ? 'flex' : 'none',
              flexDirection: 'column'
            }}
          >
            {PANEL_COMPONENTS[id]}
          </div>
        ))}
      </div>
    </>
  )
}

function NavButton({ icon, label, isActive, onClick }: {
  icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        height: 28,
        minWidth: 32,
        padding: '0 8px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        color: isActive ? 'var(--accent)' : 'var(--text-2)',
        background: isActive ? 'var(--accent-dim)' : 'transparent',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        WebkitAppRegion: 'no-drag' as any,
        transition: 'color var(--transition-fast), background var(--transition-fast)'
      }}
    >
      {icon}
    </button>
  )
}
