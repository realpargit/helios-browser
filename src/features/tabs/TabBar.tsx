import { useState } from 'react'
import { useBrowserStore } from '../../store/browserStore'
import type { Tab } from '../../types'

const MAX_TAB_WIDTH = 220
const MIN_TAB_WIDTH = 80

// Window SVG controls
function MinimizeIcon() {
  return <svg width="10" height="2" viewBox="0 0 10 2"><line x1="0" y1="1" x2="10" y2="1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}
function MaximizeIcon() {
  return <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.65" y="0.65" width="8.7" height="8.7" rx="1.2" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>
}
function CloseIcon({ size = 10 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 10 10"><line x1="0.5" y1="0.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="9.5" y1="0.5" x2="0.5" y2="9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function PlusIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12"><line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}

export function TabBar() {
  const { tabs, activeTabId } = useBrowserStore()
  const h = window.helios
  const tabWidth = Math.max(MIN_TAB_WIDTH, Math.min(MAX_TAB_WIDTH, Math.floor((window.innerWidth - 200) / Math.max(tabs.length, 1))))

  return (
    <div style={{
      height: 38,
      display: 'flex',
      alignItems: 'flex-end',
      paddingLeft: 8,
      WebkitAppRegion: 'drag' as any,
      overflow: 'hidden',
      flexShrink: 0
    }}>
      {/* Tab list + new-tab button (grouped on the left, like Chrome) */}
      <div style={{ display: 'flex', alignItems: 'flex-end', minWidth: 0, overflow: 'hidden', gap: 1 }}>
        {tabs.map((tab) => (
          <TabItem key={tab.id} tab={tab} isActive={tab.id === activeTabId} width={tabWidth} />
        ))}
        <button
          onClick={() => h.tabs.create()}
          title="New tab  (Ctrl+T)"
          style={{
            width: 28,
            height: 28,
            marginBottom: 4,
            marginLeft: 4,
            flexShrink: 0,
            color: 'var(--text-2)',
            borderRadius: '50%',
            WebkitAppRegion: 'no-drag' as any
          }}
        >
          <PlusIcon />
        </button>
      </div>

      {/* Drag spacer */}
      <div style={{ flex: 1, height: '100%' }} />

      <WindowControls />
    </div>
  )
}

function TabItem({ tab, isActive, width }: { tab: Tab; isActive: boolean; width: number }) {
  const h = window.helios
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => h.tabs.switch(tab.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width,
        minWidth: MIN_TAB_WIDTH,
        maxWidth: MAX_TAB_WIDTH,
        height: 34,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 8px',
        cursor: 'pointer',
        borderRadius: '4px 4px 0 0',
        background: isActive ? 'var(--bg-0)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        boxShadow: isActive ? 'inset 0 -2px 0 var(--accent)' : 'none',
        WebkitAppRegion: 'no-drag' as any,
        position: 'relative',
        flexShrink: 0,
        transition: 'background var(--transition-fast), box-shadow var(--transition-fast), width var(--transition-mid)',
        animation: 'tabIn 0.26s cubic-bezier(0.22, 1, 0.36, 1) both',
        transformOrigin: 'bottom left'
      }}
    >
      {/* favicon */}
      <div style={{ width: 14, height: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {tab.isLoading ? (
          <div style={{
            width: 12,
            height: 12,
            border: '1.5px solid var(--border-2)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite'
          }} />
        ) : tab.favicon ? (
          <img src={tab.favicon} width={14} height={14} style={{ borderRadius: 2, display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect width="13" height="13" rx="2" fill="var(--border-2)" />
            <circle cx="6.5" cy="6.5" r="2.8" stroke="var(--text-2)" strokeWidth="1.2" />
          </svg>
        )}
      </div>

      {/* title */}
      <span style={{
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: 12,
        fontWeight: isActive ? 500 : 400,
        color: isActive ? 'var(--text-0)' : 'var(--text-1)'
      }}>
        {tab.title || tab.url || 'New Tab'}
      </span>

      {/* close */}
      <button
        onClick={(e) => { e.stopPropagation(); h.tabs.close(tab.id) }}
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          color: 'var(--text-2)',
          opacity: hovered || isActive ? 1 : 0,
          borderRadius: 3,
          padding: 0,
          transition: 'opacity 0.15s, background var(--transition-fast), color var(--transition-fast)'
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
      >
        <CloseIcon size={8} />
      </button>
    </div>
  )
}

function WindowControls() {
  const h = window.helios
  const [closeHover, setCloseHover] = useState(false)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      padding: '0 8px',
      marginBottom: 4,
      flexShrink: 0,
      WebkitAppRegion: 'no-drag' as any
    }}>
      <button
        onClick={() => h.window.minimize()}
        title="Minimize"
        style={{ width: 30, height: 28, color: 'var(--text-2)' }}
      >
        <MinimizeIcon />
      </button>
      <button
        onClick={() => h.window.maximize()}
        title="Maximize"
        style={{ width: 30, height: 28, color: 'var(--text-2)' }}
      >
        <MaximizeIcon />
      </button>
      <button
        onClick={() => h.window.close()}
        title="Close"
        onMouseEnter={() => setCloseHover(true)}
        onMouseLeave={() => setCloseHover(false)}
        style={{
          width: 30,
          height: 28,
          color: closeHover ? '#fff' : 'var(--text-2)',
          background: closeHover ? 'var(--danger)' : 'transparent',
          transition: 'background var(--transition-fast), color var(--transition-fast)'
        }}
      >
        <CloseIcon />
      </button>
    </div>
  )
}
