import { useState } from 'react'
import { useBrowserStore } from '../store/browserStore'
import type { SidebarPanel } from '../types'
import { HistoryPanel } from '../features/history/HistoryPanel'
import { BookmarksPanel } from '../features/bookmarks/BookmarksPanel'
import { DownloadsPanel } from '../features/downloads/DownloadsPanel'
import { UserMenu } from '../features/auth/UserMenu'

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
  const { sidebarPanel, toggleSidebar, setSettingsOpen, settings } = useBrowserStore()
  const autohide = !!settings?.sidebar_autohide
  const [hovered, setHovered] = useState(false)
  const visible = !autohide || hovered || !!sidebarPanel

  return (
    <>
      {/* Edge hover trigger (only in auto-hide mode) */}
      {autohide && (
        <div
          onMouseEnter={() => setHovered(true)}
          style={{
            position: 'absolute',
            top: 76,
            left: 0,
            width: 8,
            bottom: 0,
            zIndex: 25,
            background: 'transparent'
          }}
        />
      )}
      <div
        onMouseEnter={() => autohide && setHovered(true)}
        onMouseLeave={() => autohide && setHovered(false)}
        style={{
          display: 'flex',
          height: '100%',
          flexShrink: 0,
          position: autohide ? 'absolute' : 'relative',
          top: autohide ? 76 : undefined,
          left: 0,
          bottom: autohide ? 0 : undefined,
          zIndex: autohide ? 30 : 'auto',
          transform: autohide ? `translateX(${visible ? '0' : '-100%'})` : 'none',
          transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: autohide && visible ? 'var(--shadow-md)' : 'none',
          willChange: 'transform'
        }}
      >
      {/* Icon rail */}
      <div style={{
        width: 48,
        height: '100%',
        background: 'var(--bg-1)',
        borderRight: '1px solid var(--border-0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 6,
        gap: 2,
        flexShrink: 0
      }}>
        {PANELS.map(({ id, icon, label }) => (
          <SidebarButton
            key={id}
            icon={icon}
            label={label}
            isActive={sidebarPanel === id}
            onClick={() => toggleSidebar(id)}
          />
        ))}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 10, gap: 2 }}>
          <SidebarButton
            icon={<SparkIcon />}
            label="Assistant (Ctrl+K)"
            isActive={false}
            onClick={() => (window as any).__heliosOpenAssistant?.()}
          />
          <SidebarButton
            icon={<GearIcon />}
            label="Settings"
            isActive={false}
            onClick={() => setSettingsOpen(true)}
          />
          <UserMenu />
        </div>
      </div>

      {/* Animated panel */}
      <div style={{
        width: sidebarPanel ? 280 : 0,
        height: '100%',
        background: 'var(--bg-1)',
        borderRight: sidebarPanel ? '1px solid var(--border-0)' : 'none',
        overflow: 'hidden',
        transition: 'width var(--transition-mid), border-color var(--transition-mid)',
        flexShrink: 0,
        position: 'relative'
      }}>
        {PANELS.map(({ id }) => (
          <div
            key={id}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              width: 280,
              opacity: sidebarPanel === id ? 1 : 0,
              visibility: sidebarPanel === id ? 'visible' : 'hidden',
              transform: sidebarPanel === id ? 'translateX(0)' : 'translateX(6px)',
              transition: 'opacity 0.18s cubic-bezier(0,0,0.2,1), transform 0.18s cubic-bezier(0,0,0.2,1)',
              pointerEvents: sidebarPanel === id ? 'auto' : 'none'
            }}
          >
            {PANEL_COMPONENTS[id]}
          </div>
        ))}
      </div>
      </div>
    </>
  )
}

function SidebarButton({ icon, label, isActive, onClick }: {
  icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void
}) {
  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 2,
        height: isActive ? 18 : 0,
        background: 'var(--accent)',
        borderRadius: '0 2px 2px 0',
        transition: 'height 0.18s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease',
        opacity: isActive ? 1 : 0
      }} />
      <button
        onClick={onClick}
        title={label}
        style={{
          width: 36,
          height: 36,
          color: isActive ? 'var(--accent)' : 'var(--text-2)',
          background: isActive ? 'var(--accent-dim)' : 'transparent',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          transition: 'color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast)'
        }}
      >
        {icon}
      </button>
    </div>
  )
}
