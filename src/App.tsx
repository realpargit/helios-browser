import { useEffect, useRef, useState } from 'react'
import { useBrowserStore } from './store/browserStore'
import { TabBar } from './features/tabs/TabBar'
import { AddressBar } from './features/tabs/AddressBar'
import { Sidebar } from './components/Sidebar'
import { NewTab } from './features/tabs/NewTab'
import { SettingsPage } from './features/settings/SettingsPage'
import { Assistant } from './features/assistant/Assistant'
import { SearchResults } from './features/search/SearchResults'
import { applyTheme } from './features/settings/themes'
import type { Tab, Download } from './types'

declare global {
  interface Window { helios: any }
}

export default function App() {
  const {
    tabs, activeTabId, sidebarPanel, settingsOpen, settings,
    setTabs, addTab, updateTab, removeTab, setActiveTabId,
    setHistory, setBookmarks, setDownloads, setSettings,
    addDownload, updateDownload, setUser
  } = useBrowserStore()

  const initialized = useRef(false)
  const [assistantOpen, setAssistantOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setAssistantOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setAssistantOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    ;(window as any).__heliosOpenAssistant = () => setAssistantOpen(true)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const h = window.helios
    if (!h) return

    Promise.all([
      h.tabs.getAll(),
      h.tabs.getActive(),
      h.history.getAll(),
      h.bookmarks.getAll(),
      h.downloads.getAll(),
      h.settings.getAll(),
      h.auth.getUser()
    ]).then(([allTabs, active, hist, bk, dl, settings, user]: [Tab[], string, any[], any[], Download[], any, any]) => {
      setTabs(allTabs || [])
      setActiveTabId(active)
      setHistory(hist || [])
      setBookmarks(bk || [])
      setDownloads(dl || [])
      setSettings(settings || {})
      if (user) setUser(user)
    })

    h.tabs.onCreated((tab: Tab) => addTab(tab))
    h.tabs.onUpdated((tab: Tab) => updateTab(tab))
    h.tabs.onClosed((id: string) => removeTab(id))
    h.tabs.onSwitched((id: string) => setActiveTabId(id))

    h.downloads.onStarted((dl: any) => {
      addDownload({
        id: dl.id, url: dl.url, filename: dl.filename,
        save_path: dl.savePath, mime_type: dl.mimeType,
        total_bytes: dl.totalBytes, received_bytes: 0,
        state: 'progressing', started_at: dl.startedAt
      })
    })
    h.downloads.onProgress(({ id, receivedBytes }: any) => {
      updateDownload(id, { received_bytes: receivedBytes })
    })
    h.downloads.onDone(({ id, state, savePath }: any) => {
      updateDownload(id, { state, save_path: savePath, completed_at: Date.now() })
    })

    const unsubAuth = h.auth.onAuthChanged((user: any) => setUser(user))
    return () => unsubAuth()
  }, [])

  const activeTab = tabs.find((t) => t.id === activeTabId)
  const showNewTab = !activeTab || activeTab.url === 'about:newtab' || activeTab.url === 'about:blank'
  const isSearchUrl = !!activeTab?.url?.startsWith('about:search')
  const searchQuery = isSearchUrl ? decodeURIComponent(activeTab!.url.split('?q=')[1] || '') : ''

  useEffect(() => {
    window.helios?.chrome?.setSidebarWidth(0)
  }, [])

  useEffect(() => {
    window.helios?.chrome?.setTopInset(sidebarPanel ? 320 : 0)
  }, [sidebarPanel])

  useEffect(() => {
    window.helios?.chrome?.setContentVisible(!settingsOpen && !showNewTab && !isSearchUrl)
  }, [settingsOpen, showNewTab, isSearchUrl])

  useEffect(() => {
    if (settings?.theme) applyTheme(settings.theme, settings.accent_color)
    if (settings?.font_size) document.documentElement.style.fontSize = settings.font_size + 'px'
  }, [settings?.theme, settings?.accent_color, settings?.font_size])

  useEffect(() => {
    const dim = Math.max(0, Math.min(60, Number(settings?.theme_dim ?? 0)))
    const root = document.getElementById('root')
    if (root) root.style.filter = dim > 0 ? `brightness(${(100 - dim) / 100})` : ''
  }, [settings?.theme_dim])

  useEffect(() => {
    const r = document.documentElement
    const master = settings?.animations_enabled !== false
    r.setAttribute('data-anim-master', master ? 'on' : 'off')
    r.setAttribute('data-anim-tabs',  master && settings?.animations_tabs        !== false ? 'on' : 'off')
    r.setAttribute('data-anim-addr',  master && settings?.animations_address_bar !== false ? 'on' : 'off')
    r.setAttribute('data-anim-btn',   master && settings?.animations_buttons     !== false ? 'on' : 'off')
    r.setAttribute('data-anim-panel', master && settings?.animations_panels      !== false ? 'on' : 'off')
  }, [settings?.animations_enabled, settings?.animations_tabs, settings?.animations_address_bar, settings?.animations_buttons, settings?.animations_panels])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-0)' }}>
      <div style={{
        height: 112,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-1)',
        borderBottom: '1px solid var(--border-0)',
        WebkitAppRegion: 'drag' as any,
        position: 'relative'
      }}>
        {/* Page load progress bar */}
        {activeTab?.isLoading && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            overflow: 'hidden',
            zIndex: 20,
            pointerEvents: 'none'
          }}>
            <div style={{
              position: 'absolute',
              height: '100%',
              width: '50%',
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
              animation: 'loadBar 1.2s cubic-bezier(0.4,0,0.6,1) infinite'
            }} />
          </div>
        )}
        <TabBar />
        <AddressBar />
        <Sidebar />
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {settingsOpen && <SettingsPage />}
        <Assistant open={assistantOpen} onClose={() => setAssistantOpen(false)} />
        {showNewTab && !settingsOpen && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-0)',
            zIndex: 10
          }}>
            <NewTab />
          </div>
        )}
        {isSearchUrl && !settingsOpen && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-0)',
            zIndex: 10
          }}>
            <SearchResults query={searchQuery} />
          </div>
        )}
      </div>
    </div>
  )
}
