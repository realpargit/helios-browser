---
name: Local AI roadmap
description: Helios browser local AI plan — command bar shipped first, real local LLM is the agreed next step
type: project
---

User accepted a phased plan for the bundled local AI:

**Phase 1 (shipped 2026-04-25):** Pattern-matched command bar (Ctrl+K). No LLM. Parses commands like "open spotify", "close all tabs", "new tab youtube.com" and dispatches through existing IPC. Conversation history persisted in db.json under `assistant_messages`. Files: `src/features/assistant/`, IPC namespace `assistant:*`.

**Phase 2 (pending):** Real local LLM — agreed direction is Qwen2.5-0.5B-Instruct (~400MB) via `node-llama-cpp`, shipped via electron-builder `extraResources`. ~700MB RAM while answering, sleeps when idle. Native runtime required.

**Why:** User wants self-contained AI bundled with the installer, no cloud APIs, low resource cost. Original ask was "1% RAM/CPU" which is physically impossible for any useful LLM — Phase 1 satisfies the practical use case (open things on command) at 0% cost; Phase 2 adds real conversation when user accepts the resource tradeoff.

**How to apply:** When user next mentions the AI, ask whether to start Phase 2. Confirm with them again that the `CLAUDE.md` "no native modules" rule needs relaxing for Phase 2. Tool-call reliability on 0.5B is ~70% — set expectations.
