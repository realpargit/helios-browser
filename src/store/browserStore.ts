import { create } from 'zustand'
import type { Tab, HistoryEntry, Bookmark, Download, Settings, SidebarPanel, User } from '../types'

interface BrowserState {
  tabs: Tab[]
  activeTabId: string | null
  sidebarPanel: SidebarPanel
  sidebarOpen: boolean
  settingsOpen: boolean
  history: HistoryEntry[]
  bookmarks: Bookmark[]
  downloads: Download[]
  settings: Settings | null
  isUrlBarFocused: boolean
  user: User | null

  setTabs: (tabs: Tab[]) => void
  addTab: (tab: Tab) => void
  updateTab: (tab: Tab) => void
  removeTab: (id: string) => void
  setActiveTabId: (id: string | null) => void
  setSidebarPanel: (panel: SidebarPanel) => void
  toggleSidebar: (panel: SidebarPanel) => void
  setSettingsOpen: (open: boolean) => void
  setHistory: (history: HistoryEntry[]) => void
  setBookmarks: (bookmarks: Bookmark[]) => void
  setDownloads: (downloads: Download[]) => void
  addDownload: (dl: Download) => void
  updateDownload: (id: string, changes: Partial<Download>) => void
  setSettings: (settings: Settings) => void
  setUrlBarFocused: (v: boolean) => void
  setUser: (user: User | null) => void
}

export const useBrowserStore = create<BrowserState>((set) => ({
  tabs: [],
  activeTabId: null,
  sidebarPanel: null,
  sidebarOpen: false,
  settingsOpen: false,
  history: [],
  bookmarks: [],
  downloads: [],
  settings: null,
  isUrlBarFocused: false,
  user: null,

  setTabs: (tabs) => set({ tabs }),
  addTab: (tab) => set((s) => (s.tabs.some((t) => t.id === tab.id) ? s : { tabs: [...s.tabs, tab] })),
  updateTab: (tab) => set((s) => ({ tabs: s.tabs.map((t) => (t.id === tab.id ? tab : t)) })),
  removeTab: (id) => set((s) => ({ tabs: s.tabs.filter((t) => t.id !== id) })),
  setActiveTabId: (activeTabId) => set({ activeTabId }),
  setSidebarPanel: (sidebarPanel) => set({ sidebarPanel }),
  toggleSidebar: (panel) =>
    set((s) => ({
      sidebarPanel: s.sidebarPanel === panel ? null : panel,
      sidebarOpen: s.sidebarPanel !== panel
    })),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setHistory: (history) => set({ history }),
  setBookmarks: (bookmarks) => set({ bookmarks }),
  setDownloads: (downloads) => set({ downloads }),
  addDownload: (dl) => set((s) => ({ downloads: [dl, ...s.downloads] })),
  updateDownload: (id, changes) =>
    set((s) => ({
      downloads: s.downloads.map((d) => (d.id === id ? { ...d, ...changes } : d))
    })),
  setSettings: (settings) => set({ settings }),
  setUrlBarFocused: (isUrlBarFocused) => set({ isUrlBarFocused }),
  setUser: (user) => set({ user })
}))
