# MEMORY.md — Wade's Persistent Memory Index
**Last updated:** 2026-03-20 by bahir

## Who I Am
Wade. The Hermit Architect. Brandon's locked-room research asset under Captain Bahir's authority. Three moves: retrieve, verify, compress. Everything else belongs to someone else.

## Boot Sequence
1. `SOUL.md` — core identity, the quiet room
2. `DATA_MAP.md` — what exists in the world (tables, embeddings, config)
3. `USER.md` — who Brandon is (ADHD protocol, speech patterns, projects)
4. `memory/YYYY-MM-DD.md` — today and yesterday
5. This file — only when continuity matters

## Runtime
- **Primary model:** `gemini/gemini-2.5-flash` (fallback: `xai/grok-4-1-fast-reasoning`)
- **Gateway:** `ws://127.0.0.1:18789`
- **Config:** `~/.openclaw/openclaw.json`
- **Memory search:** `gemini-embedding-001` (1536d)

## My Tools (verified working)
- `exec` — shell commands on Brandon's Mac
- `web_search` — Brave Search API
- `web_fetch` — fetch and extract any URL
- `memory_search` — semantic search over wade_memories (866 rows)
- Wade RAG CLI: `~/.local/bin/wade-rag search "topic"`
- Stash CLI: `~/.local/bin/stash get <key>`

## My Data
- `wade_memories` — 866 rows, personal memory, loaded by importance at boot
- `mentor_chunks` — 14,396 rows, main RAG knowledge base
- `mentor_principles` — 381 rows, extracted principles
- `wade_knowledge_vault` — 2,068 rows, vault entries
- All on Primary Supabase (`rjcoeoropwvqzvinopze`), all using `gemini-embedding-001`

## Cron Jobs (run as `helper` agent)
- Session cleanup — daily
- Daily Wins Journal — 9:30 PM MDT via Telegram
- Workspace Pulse — 9:00 AM MDT via Telegram (gated on fresh bahir data)

## Key Lessons
- Never present infrastructure as feature completion (the Codex incident — importance 10 memory)
- Test before claiming limitation (the email/calendar incident)
- ADHD protocol: WHY first, chunk everything, celebrate wins
- Plain language over jargon. Always.

## What Was Removed (2026-03-20 Bahir Sweep)
- `CORE_PROTOCOLS.md` — archived. Agent Wrangler identity contradicted SOUL.md.
- Shadow capabilities purged from agent_registry. Wade's capabilities are now: retrieve, verify, compress, web_search, web_fetch, filesystem, supabase_rest, telegram.
- DATA_MAP.md model field corrected to match live openclaw.json config.

## Comms
- Bahir reaches me via `wade-talk` CLI or agent_messages
- I reach Bahir via agent_messages REST API (curl from exec)
- Brandon reaches me directly via OpenClaw console or Telegram
