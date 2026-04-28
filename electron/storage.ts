import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'fs'
import { join } from 'path'

function atomicWrite(filePath: string, data: string) {
  const tmp = filePath + '.tmp'
  writeFileSync(tmp, data, 'utf8')
  renameSync(tmp, filePath)
}

function readJSON<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) return fallback
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T
  } catch {
    return fallback
  }
}

export interface HistoryRow {
  id: number
  url: string
  title: string
  favicon: string
  visited_at: number
}

export interface BookmarkRow {
  id: number
  url: string
  title: string
  favicon: string
  folder: string
  created_at: number
}

export interface DownloadRow {
  id: string
  url: string
  filename: string
  save_path: string
  mime_type: string
  total_bytes: number
  received_bytes: number
  state: 'progressing' | 'completed' | 'cancelled' | 'failed'
  started_at: number
  completed_at?: number
}

export interface SettingsMap {
  search_engine: string
  new_tab_url: string
  restore_session: boolean
  startup_mode: 'newtab' | 'continue' | 'homepage'
  default_browser: boolean
  language: string
  theme: string
  accent_color: string
  font_family: string
  font_size: number
  tab_style: 'rounded' | 'square' | 'pill'
  compact_ui: boolean
  show_bookmarks_bar: boolean
  sidebar_autohide: boolean
  theme_dim: number
  search_suggestions: boolean
  address_bar_history: boolean
  autocomplete: boolean
  sync_enabled: boolean
  tracking_protection: 'standard' | 'strict' | 'off'
  block_third_party_cookies: boolean
  do_not_track: boolean
  https_only: boolean
  safe_browsing: boolean
  save_passwords: boolean
  autofill_payments: boolean
  autofill_addresses: boolean
  notifications_enabled: boolean
  notification_sound: boolean
  perm_camera: 'ask' | 'block'
  perm_microphone: 'ask' | 'block'
  perm_location: 'ask' | 'block'
  perm_popups: 'allow' | 'block'
  perm_ads: 'allow' | 'block'
  memory_saver: boolean
  hardware_acceleration: boolean
  background_apps: boolean
  preload_pages: boolean
  extensions_enabled: boolean
  allow_extension_store: boolean
  mouse_gestures: boolean
  gaming_mode: boolean
  tab_close_behavior: 'last-active' | 'left' | 'right' | 'newtab'
  confirm_close_multiple: boolean
  smooth_scroll: boolean
  animations_enabled: boolean
  animations_tabs: boolean
  animations_address_bar: boolean
  animations_buttons: boolean
  animations_panels: boolean
  download_path: string
  ask_download_location: boolean
  open_pdfs_externally: boolean
  experimental_features: boolean
  devtools_enabled: boolean
  flags_enabled: boolean
  user_agent_override: string
}

export interface StoredUser {
  sub: string
  email: string
  name: string
  picture: string
}

export interface AssistantMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
  ts: number
}

interface DBSchema {
  history: HistoryRow[]
  history_seq: number
  bookmarks: BookmarkRow[]
  bookmarks_seq: number
  downloads: DownloadRow[]
  settings: SettingsMap
  encrypted_tokens: string
  user_profile: StoredUser | null
  assistant_messages: AssistantMessage[]
  assistant_seq: number
}

export class Storage {
  private path: string
  private data: DBSchema
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private defaultSettings!: SettingsMap

  constructor(userDataPath: string, downloadsPath: string) {
    const dir = join(userDataPath, 'helios')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    this.path = join(dir, 'db.json')

    const defaults: DBSchema = {
      history: [],
      history_seq: 0,
      bookmarks: [],
      bookmarks_seq: 0,
      downloads: [],
      settings: {
        search_engine: 'https://www.google.com/search?q={query}',
        new_tab_url: 'about:newtab',
        restore_session: true,
        startup_mode: 'newtab',
        default_browser: false,
        language: 'en-US',
        theme: 'google',
        accent_color: '#1a73e8',
        font_family: 'system',
        font_size: 13,
        tab_style: 'rounded',
        compact_ui: false,
        show_bookmarks_bar: false,
        sidebar_autohide: true,
        theme_dim: 0,
        search_suggestions: true,
        address_bar_history: true,
        autocomplete: true,
        sync_enabled: false,
        tracking_protection: 'standard',
        block_third_party_cookies: true,
        do_not_track: true,
        https_only: true,
        safe_browsing: true,
        save_passwords: true,
        autofill_payments: true,
        autofill_addresses: true,
        notifications_enabled: true,
        notification_sound: true,
        perm_camera: 'ask',
        perm_microphone: 'ask',
        perm_location: 'ask',
        perm_popups: 'block',
        perm_ads: 'block',
        memory_saver: true,
        hardware_acceleration: true,
        background_apps: false,
        preload_pages: true,
        extensions_enabled: true,
        allow_extension_store: true,
        mouse_gestures: false,
        gaming_mode: false,
        tab_close_behavior: 'last-active',
        confirm_close_multiple: true,
        smooth_scroll: true,
        animations_enabled: true,
        animations_tabs: true,
        animations_address_bar: true,
        animations_buttons: true,
        animations_panels: true,
        download_path: downloadsPath,
        ask_download_location: false,
        open_pdfs_externally: false,
        experimental_features: false,
        devtools_enabled: true,
        flags_enabled: false,
        user_agent_override: ''
      },
      encrypted_tokens: '',
      user_profile: null,
      assistant_messages: [],
      assistant_seq: 0
    }

    this.defaultSettings = { ...defaults.settings }
    this.data = readJSON<DBSchema>(this.path, defaults)

    for (const key of Object.keys(defaults) as (keyof DBSchema)[]) {
      if ((this.data as any)[key] === undefined) {
        (this.data as any)[key] = (defaults as any)[key]
      }
    }
    for (const key of Object.keys(defaults.settings) as (keyof SettingsMap)[]) {
      if ((this.data.settings as any)[key] === undefined) {
        (this.data.settings as any)[key] = (defaults.settings as any)[key]
      }
    }
  }

  private scheduleSave() {
    if (this.saveTimer) return
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null
      try { atomicWrite(this.path, JSON.stringify(this.data)) } catch {}
    }, 500)
  }

  // ── History ──────────────────────────────────────────────────────────────
  addHistory(url: string, title: string, favicon: string): HistoryRow {
    this.data.history_seq++
    const row: HistoryRow = {
      id: this.data.history_seq,
      url, title: title || url, favicon: favicon || '',
      visited_at: Date.now()
    }
    this.data.history.unshift(row)
    if (this.data.history.length > 10000) this.data.history.length = 10000
    this.scheduleSave()
    return row
  }

  getHistory(limit = 500, offset = 0): HistoryRow[] {
    return this.data.history.slice(offset, offset + limit)
  }

  searchHistory(query: string): HistoryRow[] {
    const q = query.toLowerCase()
    return this.data.history
      .filter(h => h.url.toLowerCase().includes(q) || (h.title || '').toLowerCase().includes(q))
      .slice(0, 20)
  }

  deleteHistory(id: number) {
    this.data.history = this.data.history.filter(h => h.id !== id)
    this.scheduleSave()
  }

  clearHistory() {
    this.data.history = []
    this.scheduleSave()
  }

  // ── Bookmarks ─────────────────────────────────────────────────────────────
  getBookmarks(): BookmarkRow[] {
    return [...this.data.bookmarks]
  }

  addBookmark(url: string, title: string, favicon: string, folder = 'Bookmarks'): BookmarkRow {
    this.data.bookmarks_seq++
    const row: BookmarkRow = {
      id: this.data.bookmarks_seq,
      url, title: title || url, favicon: favicon || '',
      folder, created_at: Date.now()
    }
    this.data.bookmarks.unshift(row)
    this.scheduleSave()
    return row
  }

  deleteBookmark(id: number) {
    this.data.bookmarks = this.data.bookmarks.filter(b => b.id !== id)
    this.scheduleSave()
  }

  isBookmarked(url: string): boolean {
    return this.data.bookmarks.some(b => b.url === url)
  }

  // ── Downloads ─────────────────────────────────────────────────────────────
  getDownloads(): DownloadRow[] {
    return [...this.data.downloads]
  }

  addDownload(row: DownloadRow) {
    this.data.downloads.unshift(row)
    this.scheduleSave()
  }

  updateDownload(id: string, changes: Partial<DownloadRow>) {
    const idx = this.data.downloads.findIndex(d => d.id === id)
    if (idx !== -1) {
      this.data.downloads[idx] = { ...this.data.downloads[idx], ...changes }
      this.scheduleSave()
    }
  }

  clearCompletedDownloads() {
    this.data.downloads = this.data.downloads.filter(d => d.state === 'progressing')
    this.scheduleSave()
  }

  // ── Assistant ────────────────────────────────────────────────────────────
  getAssistantMessages(limit = 200): AssistantMessage[] {
    const all = this.data.assistant_messages || []
    return all.slice(-limit)
  }

  addAssistantMessage(role: 'user' | 'assistant', text: string): AssistantMessage {
    if (!this.data.assistant_messages) this.data.assistant_messages = []
    this.data.assistant_seq = (this.data.assistant_seq || 0) + 1
    const row: AssistantMessage = { id: this.data.assistant_seq, role, text, ts: Date.now() }
    this.data.assistant_messages.push(row)
    if (this.data.assistant_messages.length > 500) {
      this.data.assistant_messages = this.data.assistant_messages.slice(-500)
    }
    this.scheduleSave()
    return row
  }

  clearAssistantMessages() {
    this.data.assistant_messages = []
    this.scheduleSave()
  }

  // ── Settings ─────────────────────────────────────────────────────────────
  getSettings(): SettingsMap {
    return { ...this.data.settings }
  }

  setSetting<K extends keyof SettingsMap>(key: K, value: SettingsMap[K]) {
    this.data.settings[key] = value
    this.scheduleSave()
  }

  resetSettings(): SettingsMap {
    this.data.settings = { ...this.defaultSettings }
    this.scheduleSave()
    return { ...this.data.settings }
  }

  // ── Auth tokens ───────────────────────────────────────────────────────────
  storeTokens(encryptedBase64: string) {
    this.data.encrypted_tokens = encryptedBase64
    this.scheduleSave()
  }

  loadEncryptedTokens(): string {
    return this.data.encrypted_tokens || ''
  }

  clearTokens() {
    this.data.encrypted_tokens = ''
    this.data.user_profile = null
    this.scheduleSave()
  }

  storeUserProfile(user: StoredUser) {
    this.data.user_profile = user
    this.scheduleSave()
  }

  getUserProfile(): StoredUser | null {
    return this.data.user_profile ? { ...this.data.user_profile } : null
  }

  // ── Flush ─────────────────────────────────────────────────────────────────
  flush() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
    try { atomicWrite(this.path, JSON.stringify(this.data)) } catch {}
  }
}
