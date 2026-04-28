import * as dotenv from 'dotenv'
dotenv.config()

import { app, BrowserWindow, BrowserView, ipcMain, session, shell } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import { Storage } from './storage'
import { GoogleAuthManager } from './auth'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let store: Storage
let authManager: GoogleAuthManager
const CHROME_HEIGHT = 112

// ── Tab management ────────────────────────────────────────────────────────
interface TabState {
  id: string
  view: BrowserView
  url: string
  title: string
  favicon: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
}

const tabs = new Map<string, TabState>()
let activeTabId: string | null = null
let mainWindow: BrowserWindow | null = null
let sidebarWidth = 0
let topInset = 0
let contentHidden = false

function getTabBounds() {
  const y = CHROME_HEIGHT + topInset
  if (!mainWindow) return { x: sidebarWidth, y, width: 800, height: 600 }
  const [w, h] = mainWindow.getContentSize()
  return {
    x: sidebarWidth,
    y,
    width: Math.max(1, w - sidebarWidth),
    height: Math.max(1, h - y)
  }
}

function applyActiveBounds() {
  if (!activeTabId) return
  const tab = tabs.get(activeTabId)
  if (tab) tab.view.setBounds(getTabBounds())
}

function broadcastTabUpdate(id: string) {
  const tab = tabs.get(id)
  if (!tab || !mainWindow) return
  mainWindow.webContents.send('tab-updated', {
    id: tab.id, url: tab.url, title: tab.title, favicon: tab.favicon,
    isLoading: tab.isLoading, canGoBack: tab.canGoBack, canGoForward: tab.canGoForward
  })
}

function makeTab(id: string, url?: string): TabState {
  const view = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })

  const tab: TabState = {
    id, view,
    url: url || 'about:newtab',
    title: 'New Tab',
    favicon: '',
    isLoading: false,
    canGoBack: false,
    canGoForward: false
  }

  const wc = view.webContents

  wc.on('page-title-updated', (_, title) => {
    tab.title = title
    broadcastTabUpdate(id)
  })

  wc.on('page-favicon-updated', (_, favicons) => {
    tab.favicon = favicons[0] || ''
    broadcastTabUpdate(id)
  })

  wc.on('did-start-loading', () => {
    tab.isLoading = true
    broadcastTabUpdate(id)
  })

  const isVirtual = () => tab.url.startsWith('about:')

  wc.on('did-stop-loading', () => {
    tab.isLoading = false
    if (!isVirtual()) {
      tab.url = wc.getURL()
      tab.canGoBack = wc.canGoBack()
      tab.canGoForward = wc.canGoForward()
      if (tab.url && !tab.url.startsWith('about:')) {
        store.addHistory(tab.url, tab.title, tab.favicon)
      }
    }
    broadcastTabUpdate(id)
  })

  wc.on('did-navigate', (_, url) => {
    if (isVirtual() && url === 'about:blank') return
    tab.url = url
    tab.canGoBack = wc.canGoBack()
    tab.canGoForward = wc.canGoForward()
    broadcastTabUpdate(id)
  })

  wc.on('did-navigate-in-page', (_, url) => {
    if (isVirtual()) return
    tab.url = url
    tab.canGoBack = wc.canGoBack()
    tab.canGoForward = wc.canGoForward()
    broadcastTabUpdate(id)
  })

  wc.setWindowOpenHandler(({ url }) => {
    const newId = openTab(url)
    switchTab(newId)
    return { action: 'deny' }
  })

  tabs.set(id, tab)
  return tab
}

function openTab(url?: string): string {
  const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const tab = makeTab(id, url)

  if (url && url !== 'about:newtab') {
    tab.view.webContents.loadURL(url).catch(() => {})
  }

  mainWindow?.webContents.send('tab-created', {
    id, url: tab.url, title: tab.title, favicon: tab.favicon,
    isLoading: tab.isLoading, canGoBack: false, canGoForward: false
  })
  return id
}

function switchTab(id: string) {
  if (!mainWindow) return
  const tab = tabs.get(id)
  if (!tab) return

  if (activeTabId && activeTabId !== id) {
    const prev = tabs.get(activeTabId)
    if (prev) mainWindow.removeBrowserView(prev.view)
  }

  if (!contentHidden) {
    mainWindow.addBrowserView(tab.view)
    tab.view.setBounds(getTabBounds())
    tab.view.setAutoResize({ width: true, height: true })
  }
  activeTabId = id
  broadcastTabUpdate(id)
  mainWindow.webContents.send('tab-switched', id)
}

function closeTab(id: string) {
  const tab = tabs.get(id)
  if (!tab) return

  if (mainWindow) mainWindow.removeBrowserView(tab.view)
  ;(tab.view.webContents as any).destroy()
  tabs.delete(id)

  if (activeTabId === id) {
    activeTabId = null
    const keys = Array.from(tabs.keys())
    if (keys.length > 0) switchTab(keys[keys.length - 1])
  }

  mainWindow?.webContents.send('tab-closed', id)

  // Chrome-style: close the window when the last tab is closed
  if (tabs.size === 0) {
    mainWindow?.close()
  }
}

function resolveURL(raw: string, _searchEngine: string): string {
  const s = raw.trim()
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('about:') || s.startsWith('file:')) return s
  if (s.includes('.') && !s.includes(' ') && !s.startsWith('localhost')) return 'https://' + s
  if (s === 'localhost' || s.startsWith('localhost:')) return 'http://' + s
  return 'about:search?q=' + encodeURIComponent(s)
}

import { search as heliosSearch, preconnect as searchPreconnect, configureLocal as configureSearchLocal, clearCache as clearSearchCache } from './search'
import { initHeadless as initSearchHeadless, disposeHeadless as disposeSearchHeadless } from './search/google-headless'

// ── Downloads ─────────────────────────────────────────────────────────────
function setupDownloads() {
  session.defaultSession.on('will-download', (_event, item) => {
    const id = `dl_${Date.now()}`
    const filename = item.getFilename()
    const savePath = join(store.getSettings().download_path, filename)
    item.setSavePath(savePath)

    const row = {
      id, url: item.getURL(), filename, save_path: savePath,
      mime_type: item.getMimeType(), total_bytes: item.getTotalBytes(),
      received_bytes: 0, state: 'progressing' as const, started_at: Date.now()
    }
    store.addDownload(row)
    mainWindow?.webContents.send('download-started', {
      ...row, savePath, mimeType: row.mime_type,
      totalBytes: row.total_bytes, startedAt: row.started_at
    })

    item.on('updated', (_e, state) => {
      const received = item.getReceivedBytes()
      store.updateDownload(id, { received_bytes: received, state: state as any })
      mainWindow?.webContents.send('download-progress', { id, receivedBytes: received, state })
    })

    item.once('done', (_e, state) => {
      const finalState = state === 'completed' ? 'completed' : 'failed'
      store.updateDownload(id, { state: finalState, completed_at: Date.now() })
      mainWindow?.webContents.send('download-done', { id, state: finalState, savePath })
    })
  })
}

// ── IPC ───────────────────────────────────────────────────────────────────
function setupIPC() {
  // Tabs
  ipcMain.handle('tab:create', (_, url?: string) => {
    const id = openTab(url)
    switchTab(id)
    return id
  })
  ipcMain.handle('tab:close', (_, id: string) => closeTab(id))
  ipcMain.handle('tab:switch', (_, id: string) => switchTab(id))
  ipcMain.handle('tab:navigate', (_, { id, url }: { id: string; url: string }) => {
    const tab = tabs.get(id)
    if (!tab) return
    const target = resolveURL(url, store.getSettings().search_engine)
    if (target === 'about:newtab' || target === 'about:blank') {
      tab.url = 'about:newtab'
      tab.title = 'New Tab'
      tab.favicon = ''
      tab.isLoading = false
      tab.canGoBack = tab.view.webContents.canGoBack()
      tab.canGoForward = tab.view.webContents.canGoForward()
      console.log('[helios] navigate → about:newtab')
      broadcastTabUpdate(id)
      return
    }
    if (target.startsWith('about:search')) {
      tab.url = target
      const q = decodeURIComponent(target.split('?q=')[1] || '')
      tab.title = q ? `${q} — Search` : 'Search'
      tab.favicon = ''
      tab.isLoading = false
      tab.canGoBack = tab.view.webContents.canGoBack()
      tab.canGoForward = tab.view.webContents.canGoForward()
      console.log(`[helios] navigate → search "${q}"`)
      broadcastTabUpdate(id)
      return
    }
    console.log(`[helios] navigate → ${target}`)
    tab.view.webContents.loadURL(target).catch((e) => console.error('[helios] loadURL failed:', target, e?.message || e))
  })
  ipcMain.handle('tab:back', (_, id: string) => {
    const t = tabs.get(id)
    if (t?.view.webContents.canGoBack()) t.view.webContents.goBack()
  })
  ipcMain.handle('tab:forward', (_, id: string) => {
    const t = tabs.get(id)
    if (t?.view.webContents.canGoForward()) t.view.webContents.goForward()
  })
  ipcMain.handle('tab:reload', (_, id: string) => tabs.get(id)?.view.webContents.reload())
  ipcMain.handle('tab:stop', (_, id: string) => tabs.get(id)?.view.webContents.stop())
  ipcMain.handle('tab:getAll', () =>
    Array.from(tabs.values()).map(t => ({
      id: t.id, url: t.url, title: t.title, favicon: t.favicon,
      isLoading: t.isLoading, canGoBack: t.canGoBack, canGoForward: t.canGoForward
    }))
  )
  ipcMain.handle('tab:getActive', () => activeTabId)

  // History
  ipcMain.handle('history:getAll', (_, opts?: { limit?: number; offset?: number }) =>
    store.getHistory(opts?.limit, opts?.offset)
  )
  ipcMain.handle('history:search', (_, q: string) => store.searchHistory(q))
  ipcMain.handle('history:delete', (_, id: number) => store.deleteHistory(id))
  ipcMain.handle('history:clear', () => store.clearHistory())

  // Bookmarks
  ipcMain.handle('bookmarks:getAll', () => store.getBookmarks())
  ipcMain.handle('bookmarks:add', (_, { url, title, favicon, folder }: any) =>
    store.addBookmark(url, title, favicon, folder)
  )
  ipcMain.handle('bookmarks:delete', (_, id: number) => store.deleteBookmark(id))
  ipcMain.handle('bookmarks:isBookmarked', (_, url: string) => store.isBookmarked(url))

  // Downloads
  ipcMain.handle('downloads:getAll', () => store.getDownloads())
  ipcMain.handle('downloads:openFile', (_, p: string) => shell.openPath(p))
  ipcMain.handle('downloads:showInFolder', (_, p: string) => shell.showItemInFolder(p))
  ipcMain.handle('downloads:clear', () => store.clearCompletedDownloads())

  // Settings
  ipcMain.handle('settings:getAll', () => store.getSettings())
  ipcMain.handle('settings:set', (_, { key, value }: { key: any; value: any }) =>
    store.setSetting(key, value)
  )

  // Updates
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  const sendUpdate = (event: string, data?: any) =>
    mainWindow?.webContents.send('update-status', { event, data })
  autoUpdater.on('checking-for-update', () => sendUpdate('checking'))
  autoUpdater.on('update-available', (info) => sendUpdate('available', { version: info.version }))
  autoUpdater.on('update-not-available', (info) => sendUpdate('not-available', { version: info.version }))
  autoUpdater.on('error', (err) => sendUpdate('error', { message: err?.message || String(err) }))
  autoUpdater.on('download-progress', (p) => sendUpdate('progress', { percent: Math.round(p.percent), bytesPerSecond: p.bytesPerSecond, transferred: p.transferred, total: p.total }))
  autoUpdater.on('update-downloaded', (info) => sendUpdate('downloaded', { version: info.version }))

  ipcMain.handle('update:check', async () => {
    if (!app.isPackaged) return { ok: false, reason: 'dev' }
    try { await autoUpdater.checkForUpdates(); return { ok: true } }
    catch (e: any) { return { ok: false, reason: e?.message || String(e) } }
  })
  ipcMain.handle('update:download', async () => {
    try { await autoUpdater.downloadUpdate(); return { ok: true } }
    catch (e: any) { return { ok: false, reason: e?.message || String(e) } }
  })
  ipcMain.handle('update:install', () => { autoUpdater.quitAndInstall() })
  ipcMain.handle('update:getVersion', () => app.getVersion())

  // Background check shortly after launch (only in packaged builds)
  if (app.isPackaged) {
    setTimeout(() => { autoUpdater.checkForUpdates().catch(() => {}) }, 8000)
  }

  // Assistant
  ipcMain.handle('assistant:getMessages', () => store.getAssistantMessages())
  ipcMain.handle('assistant:addMessage', (_, { role, text }: { role: 'user' | 'assistant'; text: string }) =>
    store.addAssistantMessage(role, text)
  )
  ipcMain.handle('assistant:clear', () => store.clearAssistantMessages())
  ipcMain.handle('assistant:closeAllTabs', () => {
    for (const id of Array.from(tabs.keys())) closeTab(id)
  })
  ipcMain.handle('assistant:openExternal', (_, url: string) => shell.openExternal(url))

  // Search
  const activeSearches = new Map<number, { cancel: () => void }>()
  ipcMain.handle('search:start', (_, args: { query: string; prefetch?: boolean; deepen?: boolean }) => {
    const handle = heliosSearch(String(args?.query || '').trim(), {
      prefetch: !!args?.prefetch,
      deepen: !!args?.deepen,
      onUpdate: (u) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('search:update', u)
        }
      }
    })
    activeSearches.set(handle.sessionId, { cancel: handle.cancel })
    handle.promise.finally(() => activeSearches.delete(handle.sessionId))
    return { sessionId: handle.sessionId }
  })
  ipcMain.handle('search:cancel', (_, sessionId: number) => {
    const h = activeSearches.get(sessionId)
    if (h) { h.cancel(); activeSearches.delete(sessionId) }
  })
  ipcMain.handle('search:preconnect', () => searchPreconnect())
  // Bench is dev-only. The handler is registered only in dev builds (the
  // surrounding `if (__DEV__)` is dead-code-eliminated in production by Vite),
  // so the channel literally does not exist in shipped builds.
  if (__DEV__) ipcMain.handle('search:bench', async (_, queries: string[]) => {
    if (!Array.isArray(queries) || queries.length === 0) return { ok: false, reason: 'empty' }
    // Wipe cache so cold runs are actually cold even if bench is re-run.
    clearSearchCache()
    const rows: Array<{
      query: string
      firstPaintMs: number | null
      finalMs: number
      cacheHitMs: number | null
      googleRan: boolean
      resultCount: number
      ok: boolean
      failedReason?: string
    }> = []
    for (const q of queries) {
      // Cold run.
      let firstPaintMs: number | null = null
      let googleRan = false
      const t0 = performance.now()
      const handle = heliosSearch(q, {
        forceRefresh: true,
        onUpdate: (u) => {
          if (firstPaintMs === null && u.envelope.ok && u.envelope.results.length > 0) {
            firstPaintMs = u.elapsedMs
          }
          if (u.envelope.ok && (u.envelope.sources || []).includes('google')) googleRan = true
        }
      })
      const env = await handle.promise
      const finalMs = Math.round(performance.now() - t0)

      // Repeat run — should be a cache hit.
      const t1 = performance.now()
      await heliosSearch(q, {}).promise
      const cacheHitMs = Math.round(performance.now() - t1)

      rows.push({
        query: q,
        firstPaintMs,
        finalMs,
        cacheHitMs,
        googleRan,
        resultCount: env.ok ? env.results.length : 0,
        ok: env.ok,
        ...(env.ok ? {} : { failedReason: env.reason })
      })
    }
    return { ok: true, rows }
  })
  // Compatibility shim — awaits final envelope.
  ipcMain.handle('search:web', async (_, q: string, _kind?: string) => {
    const handle = heliosSearch(String(q || '').trim(), {})
    return handle.promise
  })

  // Auth
  ipcMain.handle('auth:signIn', () => authManager.signIn())
  ipcMain.handle('auth:signOut', () => authManager.signOut())
  ipcMain.handle('auth:getUser', () => store.getUserProfile())

  // Chrome layout
  ipcMain.handle('chrome:setSidebarWidth', (_, width: number) => {
    sidebarWidth = Math.max(0, Math.round(width))
    applyActiveBounds()
  })
  ipcMain.handle('chrome:setTopInset', (_, inset: number) => {
    topInset = Math.max(0, Math.round(inset))
    applyActiveBounds()
  })
  ipcMain.handle('chrome:setContentVisible', (_, visible: boolean) => {
    if (!mainWindow || !activeTabId) return
    const tab = tabs.get(activeTabId)
    if (!tab) return
    if (visible && contentHidden) {
      mainWindow.addBrowserView(tab.view)
      tab.view.setBounds(getTabBounds())
      tab.view.setAutoResize({ width: true, height: true })
      contentHidden = false
    } else if (!visible && !contentHidden) {
      mainWindow.removeBrowserView(tab.view)
      contentHidden = true
    }
  })

  ipcMain.handle('settings:reset', () => store.resetSettings())
  ipcMain.handle('system:openDefaultAppsSettings', async () => {
    try {
      if (process.platform === 'win32') {
        await shell.openExternal('ms-settings:defaultapps')
      } else if (process.platform === 'darwin') {
        await shell.openExternal('x-apple.systempreferences:com.apple.preference.general')
      } else {
        await shell.openExternal('https://support.mozilla.org/kb/make-firefox-your-default-browser')
      }
      return true
    } catch {
      return false
    }
  })
  ipcMain.handle('data:clearBrowsing', async () => {
    const s = session.defaultSession
    await s.clearCache()
    await s.clearStorageData({
      storages: ['cookies', 'localstorage', 'indexdb', 'shadercache', 'websql', 'serviceworkers', 'cachestorage']
    })
    store.clearHistory()
  })

  // Window
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:maximize', () =>
    mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize()
  )
  ipcMain.handle('window:close', () => mainWindow?.close())
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)
}

// ── Window ────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    backgroundColor: '#0f0f0f',
    icon: join(__dirname, '../build/icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, 'preload.js'),
      sandbox: false
    },
    show: false
  })

  mainWindow.once('ready-to-show', () => mainWindow!.show())

  mainWindow.on('closed', () => {
    disposeSearchHeadless()
    if (process.platform !== 'darwin') app.quit()
  })

  mainWindow.on('resize', applyActiveBounds)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.once('did-finish-load', async () => {
    authManager.setWindow(mainWindow!)
    const user = await authManager.initialize()
    if (user) mainWindow!.webContents.send('auth-changed', user)

    const id = openTab('about:newtab')
    switchTab(id)
  })
}

// ── App lifecycle ─────────────────────────────────────────────────────────
app.whenReady().then(() => {
  store = new Storage(app.getPath('userData'), app.getPath('downloads'))
  authManager = new GoogleAuthManager(store)
  configureSearchLocal({
    history: () => store.getHistory(500, 0).map((h) => ({ url: h.url, title: h.title, favicon: h.favicon })),
    bookmarks: () => store.getBookmarks().map((b) => ({ url: b.url, title: b.title, favicon: b.favicon }))
  })
  setupDownloads()
  setupIPC()
  initSearchHeadless()
  searchPreconnect()
  createWindow()
})

app.on('before-quit', () => { disposeSearchHeadless() })

app.on('window-all-closed', () => {
  store?.flush()
  disposeSearchHeadless()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
