# Helios Browser

A fast, lightweight, production-grade desktop browser built with Electron + React + TypeScript.

## Stack

- **Electron 28** — window management, BrowserView tab rendering, IPC
- **React 18 + TypeScript** — renderer UI
- **Vite 5** — fast builds, HMR in dev
- **Zustand** — minimal renderer state management
- **JSON file storage** — zero native dependencies, WAL-style atomic writes

## Features

- Multi-tab browsing (create, close, switch)
- Navigation: back / forward / reload / stop
- Address bar with integrated search (Google, Bing, DuckDuckGo, Brave)
- Favicon + title tracking per tab
- Loading states
- Bookmarks (add/remove from address bar, panel browser)
- History (searchable, per-item delete, clear all)
- Downloads manager (progress, open file, show in folder, persistent)
- Settings (search engine, theme, session restore)
- Collapsible sidebar with panel navigation
- Frameless window with custom title bar
- Persistent storage across sessions (userData/helios/db.json)

## Getting Started

```bash
# Install dependencies
npm install

# Development (Electron + Vite HMR)
npm run electron:dev

# Build for production
npm run electron:build
```

## Architecture

```
electron/
  main.ts          — Main process: window, tabs, IPC handlers, downloads
  preload.ts       — Context-isolated bridge (window.helios API)
  storage.ts       — Pure-JS JSON storage (history, bookmarks, downloads, settings)

src/
  App.tsx          — Root component, event wiring
  store/
    browserStore.ts  — Zustand store
  features/
    tabs/
      TabBar.tsx     — Tab strip with favicon, loading, close
      AddressBar.tsx — URL input, nav buttons, bookmark toggle
      NewTab.tsx     — New tab page with search + recent sites
    history/
      HistoryPanel.tsx
    bookmarks/
      BookmarksPanel.tsx
    downloads/
      DownloadsPanel.tsx
    settings/
      SettingsPanel.tsx
  components/
    Sidebar.tsx    — Icon rail + collapsible panel
  types/
    index.ts       — Shared TypeScript interfaces
    css.d.ts       — CSS property extensions
```

## Performance Notes

- BrowserView instances are created per tab and destroyed on close
- Storage writes are debounced (500ms) and atomic (write-to-temp + rename)
- History capped at 10,000 entries
- No heavy UI libraries — pure CSS variables + inline styles
- Background tabs remain loaded but are removed from the BrowserWindow view stack
