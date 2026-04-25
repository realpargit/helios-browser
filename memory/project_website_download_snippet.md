---
name: Website download snippet pending
description: User asked for an HTML/link snippet they can drop into their download website so visitors can download the browser
type: project
---

User is going to publish the Helios browser to a GitHub repo and stand up a public website with a "Download" button. They asked to be reminded to provide the actual snippet (HTML link, button code, redirect URL) they can paste into the site.

**Why:** They want the website to feel native — visitors click Download and get the installer, with no visible mention of GitHub.

**How to apply:** Once they've decided repo visibility (public vs private + proxy) and have a repo name, give them a copy-pasteable snippet. Two flavors depending on visibility:

- **Public repo:** direct anchor pointing at `https://github.com/<owner>/<repo>/releases/latest/download/<asset-name>.exe` plus optional OS-detection JS that swaps the asset for Mac/Linux. No backend needed.
- **Private repo:** anchor pointing at their own proxy URL (e.g. `https://yourdomain.com/download`) — also need to give them the proxy code (Cloudflare Worker / Vercel function / Netlify function) that uses a `GITHUB_TOKEN` env var to fetch the private release asset and stream it back.

Also remind them about: code-signing (SmartScreen warnings without it), `latest.yml` for auto-updates, and that the asset filename must be stable across releases for the link to keep working.

Status as of 2026-04-25: blocked on user picking repo visibility (Option A public vs B private+proxy).
