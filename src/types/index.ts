export interface Tab {
  id: string
  url: string
  title: string
  favicon: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
}

export interface HistoryEntry {
  id: number
  url: string
  title: string
  favicon: string
  visited_at: number
}

export interface Bookmark {
  id: number
  url: string
  title: string
  favicon: string
  folder: string
  created_at: number
}

export interface Download {
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

export type ThemeName =
  | 'google' | 'dark' | 'light' | 'midnight' | 'dracula' | 'nord'
  | 'sepia' | 'ocean' | 'forest' | 'rose' | 'high-contrast'
  | 'ember' | 'amber' | 'sunset' | 'crimson' | 'arctic' | 'monokai'

export interface Settings {
  // General
  search_engine: string
  new_tab_url: string
  restore_session: boolean
  startup_mode: 'newtab' | 'continue' | 'homepage'
  homepage_url: string
  default_browser: boolean
  language: string

  // Appearance
  theme: ThemeName
  accent_color: string
  font_family: string
  font_size: number
  tab_style: 'rounded' | 'square' | 'pill'
  compact_ui: boolean
  show_bookmarks_bar: boolean
  sidebar_autohide: boolean

  // Search
  search_suggestions: boolean
  address_bar_history: boolean
  autocomplete: boolean

  // Profile
  sync_enabled: boolean

  // Privacy & Security
  tracking_protection: 'standard' | 'strict' | 'off'
  block_third_party_cookies: boolean
  do_not_track: boolean
  https_only: boolean
  safe_browsing: boolean

  // Autofill & Passwords
  save_passwords: boolean
  autofill_payments: boolean
  autofill_addresses: boolean

  // Notifications
  notifications_enabled: boolean
  notification_sound: boolean

  // Site permissions (defaults)
  perm_camera: 'ask' | 'block'
  perm_microphone: 'ask' | 'block'
  perm_location: 'ask' | 'block'
  perm_popups: 'allow' | 'block'
  perm_ads: 'allow' | 'block'

  // Performance
  memory_saver: boolean
  hardware_acceleration: boolean
  background_apps: boolean
  preload_pages: boolean

  // Extensions
  extensions_enabled: boolean
  allow_extension_store: boolean

  // System / behavior
  mouse_gestures: boolean
  gaming_mode: boolean
  tab_close_behavior: 'last-active' | 'left' | 'right' | 'newtab'
  confirm_close_multiple: boolean
  smooth_scroll: boolean

  // Downloads
  download_path: string
  ask_download_location: boolean
  open_pdfs_externally: boolean

  // Advanced / developer
  experimental_features: boolean
  devtools_enabled: boolean
  flags_enabled: boolean
  user_agent_override: string
}

export type SidebarPanel = 'bookmarks' | 'history' | 'downloads' | null

export interface User {
  sub: string
  email: string
  name: string
  picture: string
}
