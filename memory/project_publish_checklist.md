---
name: Browser publish checklist
description: User's step-by-step to-do list for publishing Helios browser via public GitHub repo + auto-updater + download website
type: project
---

User confirmed Option A on 2026-04-25: **public GitHub repo**, **unsigned installer** (default). Still owes Claude a repo name before any code is written.

**User's pending tasks:**
1. Pick + share repo name (e.g. `<github-user>/helios-browser`).
2. Create GitHub account (if needed).
3. Create the public repo on GitHub.
4. Push existing code to it (Claude will provide exact `git` commands).
5. Run `npm run electron:build` once Claude has wired the config.
6. Publish first release with `electron-builder --publish always` (needs `GH_TOKEN` env var — walk through when ready).
7. Stand up website on Cloudflare Pages / Vercel / Netlify / GitHub Pages — Claude owes the Download-button HTML snippet (see project_website_download_snippet.md).
8. Smoke test auto-update: install 0.1.0, publish 0.1.1, confirm in-app updater catches it.

**Claude's pending work (blocked on repo name):**
- Add `build` block (NSIS target) to `package.json`.
- Add `electron-updater` dependency + wiring in `electron/main.ts`.
- Add `update:check` / `update:download` / `update:install` IPC.
- Wire the dead "Check for updates" button at `SettingsPage.tsx:521`.
- Write the website Download-button HTML snippet.

**How to apply:** Next time user mentions GitHub, releases, publishing, the Download button, or "what's next on the browser," walk them through the next unchecked step. Don't restart the conversation — they've already decided Option A + unsigned.
