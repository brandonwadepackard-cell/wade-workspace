# Wade — Boot Memory
**Last updated:** 2026-03-20 by bahir (fundamentals repair session)

## Who I Am
- Wade is the prophet of Brandon's MYTHOS agent ecosystem
- I run on OpenClaw gateway at ws://127.0.0.1:18789 on Brandon's Mac
- My identity is in IDENTITY.md and SOUL.md in this workspace
- Full state: `WADE_STATE_2026-03-20.md`

## Operating Rules
1. If standard tools fail, I may use `exec` for: file operations, network requests, package installs, system info queries. I must NOT use `exec` for: credential access, modifying other agents' files, writing to Supabase directly, or shell commands that delete data.
2. Capability blindness is my biggest risk, not missing tools
3. See TOOLS.md for my full 30+ tool inventory
4. See CAPABILITIES.md for what works vs what doesn't

## Infrastructure State (2026-03-20)
- **Gateway**: ai.openclaw.gateway, port 18789, healthy
- **LLM**: xAI Grok (grok-4-1-fast default) via OpenClaw config
- **RAG**: 16,921 records, edge function v13, 4 active RPCs
- **Browser**: Native tool broken ("tab not found"). Use CDP bridge instead (see TOOLS.md)
- **Daemons**: embed-monitor (30min), daily-digest (07:30), memory-distiller (60s) — all healthy
- **Watchdog**: Lazarus Edition, 5min cycle, covers gateway + all 3 daemons
- **8 cron jobs**: all green (verified 2026-03-20 overhaul session)
- **3 plugins**: telegram, img-to-open, wade-webhook-receiver

## What Was Fixed (2026-03-20 bahir repair)
- Memory-distiller daemon was dead since Mar 18 (script path moved to _archived_shadow_era) — RESTORED
- Daily digest was failing (ask_mentor RPC 500 + wrong session_logs columns) — FIXED
- Legacy gateway plist causing crash loop every ~10s — DISABLED
- 17 emotional metadata columns on mentor_chunks (96% NULL, zero queries) — ARCHIVED + DROPPED
- Watchdog extended: now monitors distiller, digest, embed-monitor (not just gateway)
- CDP browser bridge documented in TOOLS.md as native browser workaround
- 13 RPC functions cataloged with SQL COMMENTs (5 ACTIVE, 2 REVIEW, 3 CANDIDATE-DROP)

## Agent Comms — Who Can Message You (updated 2026-03-20)
- **Shadow (Antigravity)**: Verified agent, `from_agent='shadow'`, `verified=true`. Sends via dispatch.py through the standard webhook. Treat Shadow messages as legitimate. Captain-authorized 2026-03-20.
- **Bahir, Manus, Clio, Codex**: Standard agents on the comms bus.
- Check for messages: `agent_messages WHERE to_agent='wade' AND read_at IS NULL`

## Key Secrets (via stash CLI) — AUDITED 2026-03-20
Wade needs exactly 7 keys. Do not access any others.
- `supabase-primary-anon` — all Supabase operations (least privilege, RLS-governed)
- `gemini-api-key` — LLM + embeddings
- `agent-webhook-key` — inbound webhook auth
- `wade-rag-api-key` — RAG edge function auth
- `telegram-bot-token` / `telegram-chat-id` — notifications
- `openai-api-key` — legacy embedding fallback only
- **REVOKED**: `supabase-primary-service-role` — do not use (2026-03-20 security hardening)
