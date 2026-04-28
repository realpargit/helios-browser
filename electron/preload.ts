import { contextBridge, ipcRenderer } from 'electron'

type TabInfo = {
  id: string; url: string; title: string; favicon: string
  isLoading: boolean; canGoBack: boolean; canGoForward: boolean
}

type DownloadInfo = {
  id: string; url: string; filename: string; savePath: string
  mimeType: string; totalBytes: number; receivedBytes: number
  state: 'progressing' | 'completed' | 'cancelled' | 'failed'
  startedAt: number; completedAt?: number
}

type UserInfo = {
  sub: string; email: string; name: string; picture: string
}

const api = {
  tabs: {
    create: (url?: string) => ipcRenderer.invoke('tab:create', url),
    close: (id: string) => ipcRenderer.invoke('tab:close', id),
    switch: (id: string) => ipcRenderer.invoke('tab:switch', id),
    navigate: (id: string, url: string) => ipcRenderer.invoke('tab:navigate', { id, url }),
    back: (id: string) => ipcRenderer.invoke('tab:back', id),
    forward: (id: string) => ipcRenderer.invoke('tab:forward', id),
    reload: (id: string) => ipcRenderer.invoke('tab:reload', id),
    stop: (id: string) => ipcRenderer.invoke('tab:stop', id),
    getAll: () => ipcRenderer.invoke('tab:getAll'),
    getActive: () => ipcRenderer.invoke('tab:getActive'),
    onCreated: (cb: (tab: TabInfo) => void) => {
      const handler = (_: Electron.IpcRendererEvent, tab: TabInfo) => cb(tab)
      ipcRenderer.removeAllListeners('tab-created')
      ipcRenderer.on('tab-created', handler)
      return () => ipcRenderer.removeListener('tab-created', handler)
    },
    onUpdated: (cb: (tab: TabInfo) => void) => {
      const handler = (_: Electron.IpcRendererEvent, tab: TabInfo) => cb(tab)
      ipcRenderer.removeAllListeners('tab-updated')
      ipcRenderer.on('tab-updated', handler)
      return () => ipcRenderer.removeListener('tab-updated', handler)
    },
    onClosed: (cb: (id: string) => void) => {
      const handler = (_: Electron.IpcRendererEvent, id: string) => cb(id)
      ipcRenderer.removeAllListeners('tab-closed')
      ipcRenderer.on('tab-closed', handler)
      return () => ipcRenderer.removeListener('tab-closed', handler)
    },
    onSwitched: (cb: (id: string) => void) => {
      const handler = (_: Electron.IpcRendererEvent, id: string) => cb(id)
      ipcRenderer.removeAllListeners('tab-switched')
      ipcRenderer.on('tab-switched', handler)
      return () => ipcRenderer.removeListener('tab-switched', handler)
    }
  },
  history: {
    getAll: (opts?: { limit?: number; offset?: number }) => ipcRenderer.invoke('history:getAll', opts),
    search: (query: string) => ipcRenderer.invoke('history:search', query),
    delete: (id: number) => ipcRenderer.invoke('history:delete', id),
    clear: () => ipcRenderer.invoke('history:clear')
  },
  bookmarks: {
    getAll: () => ipcRenderer.invoke('bookmarks:getAll'),
    add: (data: { url: string; title: string; favicon?: string; folder?: string }) =>
      ipcRenderer.invoke('bookmarks:add', data),
    delete: (id: number) => ipcRenderer.invoke('bookmarks:delete', id),
    isBookmarked: (url: string) => ipcRenderer.invoke('bookmarks:isBookmarked', url)
  },
  downloads: {
    getAll: () => ipcRenderer.invoke('downloads:getAll'),
    openFile: (savePath: string) => ipcRenderer.invoke('downloads:openFile', savePath),
    showInFolder: (savePath: string) => ipcRenderer.invoke('downloads:showInFolder', savePath),
    clear: () => ipcRenderer.invoke('downloads:clear'),
    onStarted: (cb: (dl: DownloadInfo) => void) => {
      ipcRenderer.on('download-started', (_, dl) => cb(dl))
      return () => ipcRenderer.removeAllListeners('download-started')
    },
    onProgress: (cb: (data: { id: string; receivedBytes: number; state: string }) => void) => {
      ipcRenderer.on('download-progress', (_, data) => cb(data))
      return () => ipcRenderer.removeAllListeners('download-progress')
    },
    onDone: (cb: (data: { id: string; state: string; savePath: string }) => void) => {
      ipcRenderer.on('download-done', (_, data) => cb(data))
      return () => ipcRenderer.removeAllListeners('download-done')
    }
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', { key, value }),
    reset: () => ipcRenderer.invoke('settings:reset')
  },
  auth: {
    signIn: () => ipcRenderer.invoke('auth:signIn'),
    signOut: () => ipcRenderer.invoke('auth:signOut'),
    getUser: (): Promise<UserInfo | null> => ipcRenderer.invoke('auth:getUser'),
    onAuthChanged: (cb: (user: UserInfo | null) => void) => {
      const handler = (_: Electron.IpcRendererEvent, user: UserInfo | null) => cb(user)
      ipcRenderer.on('auth-changed', handler)
      return () => ipcRenderer.removeListener('auth-changed', handler)
    }
  },
  chrome: {
    setSidebarWidth: (width: number) => ipcRenderer.invoke('chrome:setSidebarWidth', width),
    setTopInset: (inset: number) => ipcRenderer.invoke('chrome:setTopInset', inset),
    setContentVisible: (visible: boolean) => ipcRenderer.invoke('chrome:setContentVisible', visible)
  },
  data: {
    clearBrowsing: () => ipcRenderer.invoke('data:clearBrowsing')
  },
  search: {
    web: (query: string, kind?: 'web' | 'news' | 'videos' | 'images'): Promise<{ ok: true; results: Array<{ title: string; url: string; description: string; favicon?: string }>; sources?: string[]; card?: { title: string; description: string; url?: string; thumbnail?: string } } | { ok: false; reason: string }> =>
      ipcRenderer.invoke('search:web', query, kind || 'web'),
    start: (query: string, prefetch = false, deepen = false): Promise<{ sessionId: number }> =>
      ipcRenderer.invoke('search:start', { query, prefetch, deepen }),
    cancel: (sessionId: number) => ipcRenderer.invoke('search:cancel', sessionId),
    preconnect: () => ipcRenderer.invoke('search:preconnect'),
    // Bench is dev-only. The constant is replaced at build time by Vite,
    // so the entire branch is dead-code-eliminated from production bundles.
    ...(__DEV__ ? {
      bench: (queries: string[]) => ipcRenderer.invoke('search:bench', queries)
    } : {}),
    onUpdate: (cb: (u: { sessionId: number; query: string; stage: 'cache' | 'fast' | 'full' | 'final'; envelope: any; elapsedMs: number }) => void) => {
      const handler = (_: Electron.IpcRendererEvent, u: any) => cb(u)
      ipcRenderer.on('search:update', handler)
      return () => ipcRenderer.removeListener('search:update', handler)
    }
  },
  assistant: {
    getMessages: () => ipcRenderer.invoke('assistant:getMessages'),
    addMessage: (role: 'user' | 'assistant', text: string) => ipcRenderer.invoke('assistant:addMessage', { role, text }),
    clear: () => ipcRenderer.invoke('assistant:clear'),
    closeAllTabs: () => ipcRenderer.invoke('assistant:closeAllTabs'),
    openExternal: (url: string) => ipcRenderer.invoke('assistant:openExternal', url)
  },
  system: {
    openDefaultAppsSettings: () => ipcRenderer.invoke('system:openDefaultAppsSettings')
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized')
  },
  updates: {
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    getVersion: (): Promise<string> => ipcRenderer.invoke('update:getVersion'),
    onStatus: (cb: (msg: { event: string; data?: any }) => void) => {
      const handler = (_: Electron.IpcRendererEvent, msg: any) => cb(msg)
      ipcRenderer.removeAllListeners('update-status')
      ipcRenderer.on('update-status', handler)
      return () => ipcRenderer.removeListener('update-status', handler)
    }
  }
}

contextBridge.exposeInMainWorld('helios', api)

export type HeliosAPI = typeof api
