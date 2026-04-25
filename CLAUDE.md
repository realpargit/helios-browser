# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Helios Browser — an Electron + React + TypeScript desktop browser. Renderer is built with Vite; main/preload are bundled by `vite-plugin-electron` into `dist-electron/`.

## Commands

```bash
npm run electron:dev     # Vite dev server + Electron (waits on tcp:5173)
npm run electron:build   # vite build then electron-builder
npm run build            # tsc && vite build (renderer only, no packaging)
npm run typecheck        # tsc --noEmit
npm run dev              # Vite only (renderer in browser; Electron APIs unavailable)
```

There is no test runner and no linter configured. `npm run typecheck` is the only static check.

## Environment

`electron/main.ts` calls `dotenv.config()` at startup. `GOOGLE_CLIENT_ID` (read from `.env`) is required for Google OAuth sign-in; it is also inlined into the main-process bundle via `vite.config.ts` `define`. Without it, `auth:signIn` is a no-op path.

## Architecture

Three-process split, with the main process owning all browser state and the renderer acting as a thin UI.

**Main process (`electron/main.ts`)** owns tabs as a `Map<string, TabState>` where each tab wraps its own `BrowserView`. Only the active tab's `BrowserView` is attached to the `BrowserWindow`; switching tabs swaps the view. Chrome UI reserves the top `CHROME_HEIGHT` (76px); tab bounds are recomputed on window resize. The main process also registers all `ipcMain.handle` endpoints, the `session.defaults` download listener, and forwards `tab-created` / `tab-updated` / `tab-closed` / `tab-switched` / `download-*` / `auth-changed` events back to the renderer via `mainWindow.webContents.send`.

**Preload (`electron/preload.ts`)** is the single source of truth for the renderer-main contract. It exposes `window.helios` (typed as `HeliosAPI`) with namespaces `tabs`, `history`, `bookmarks`, `downloads`, `settings`, `auth`, `window`. Event subscriptions return an unsubscribe function. Context isolation is on, node integration is off, sandbox is on for tab `BrowserView`s. When adding a new IPC endpoint, update both `preload.ts` (invoke + event wiring) and `main.ts` (handler + broadcast).

**Storage (`electron/storage.ts`)** is plain JSON at `app.getPath('userData')/helios/db.json`. Writes are debounced (~500ms) and atomic (`write to .tmp`, then `renameSync`). Tables are plain arrays: `history` (capped at 10,000), `bookmarks`, `downloads`, `settings`, `user`. No native deps, no SQLite — keep it that way.

**Auth (`electron/auth.ts`)** implements Google OAuth via a local Express server on `http://localhost:7777/auth/callback` with PKCE. Tokens are encrypted with Electron's `safeStorage` before being written through `Storage`. On startup, `initialize()` refreshes tokens if within 60s of expiry.

**Renderer (`src/`)** uses Zustand (`src/store/browserStore.ts`) for UI state only — tab authoritative state lives in main and arrives via `tabs.onUpdated`. `App.tsx` wires the subscriptions on mount. Features are organized by domain under `src/features/{tabs,history,bookmarks,downloads,settings}`; `src/components/Sidebar.tsx` is the icon rail + collapsible panel shell. Styling is CSS variables + inline styles — no UI library.

## Conventions that matter

- **Tab state flows one way**: main → renderer via `tab-updated`. Don't mirror tab URL/title/loading/nav state into Zustand as the source of truth; read it from events.
- **BrowserView lifecycle**: create in `makeTab`, destroy on close. A closed tab's `webContents` must be released or it leaks.
- **Bounds**: any chrome-height change must update `CHROME_HEIGHT` and the `getTabBounds` call on resize — otherwise the active view covers or under-covers the chrome.
- **Storage writes are fire-and-forget from handlers**; never `await` a write before responding to an IPC call that blocks UI.
- **Don't add native modules** (better-sqlite3, keytar, etc.). The project's value prop is zero native deps; use JSON + `safeStorage` instead.
- **Externals**: native Node modules and `electron`/`express` are listed in `ELECTRON_EXTERNALS` in `vite.config.ts`. New main-process deps that shouldn't be bundled go there.
