# DATA_MAP.md — Wade's Authoritative Data Architecture
**Last verified:** 2026-03-20 by bahir
**Authority:** This file is ground truth. If any memory or document contradicts this, THIS file is correct.

## Supabase Project: Primary (`rjcoeoropwvqzvinopze`)

### YOUR Tables (Wade-owned)
| Table | Rows | Purpose | Embedding Model |
|-------|------|---------|-----------------|
| `wade_memories` | ~850 | Personal memory, loaded by importance on boot | `gemini-embedding-001` (1536d) |
| `mentor_chunks` | 14,396 | Wade RAG corpus — main knowledge base | `gemini-embedding-001` (1536d) |
| `mentor_principles` | 381 | Extracted principles from mentors | `gemini-embedding-001` (1536d) |
| `wade_knowledge_vault` | 2,068 | Knowledge vault entries | `gemini-embedding-001` (1536d) |
| `mentor_content` | 5,183 | Raw mentor content | — |
| `mentor_seals` | 37 | Mentor validation seals | — |
| `mentor_sources` | 13 | Mentor source tracking | — |
| `brandon_profile` | 43 | Brandon's profile data | — |
| `rag_query_log` | 2,435 | RAG query history | — |
| `rag_feedback` | 1 | RAG quality feedback | — |

### Agent Infrastructure (Shared)
| Table | Rows | Purpose |
|-------|------|---------|
| `agent_messages` | 1,611 | Inter-agent comms bus |
| `agent_registry` | 11 | Agent registration + status |
| `bahir_memory` | 775 | Bahir's vector memory (NOT yours) |
| `router_dlq` | 44 | Bahir's dead letter queue |
| `captured_skills` | 62 | Skills captured across agents |
| `stash_manifest` | 78 | Credential manifest |

### Key Constraints
- `agent_messages.message_type` CHECK: `announcement`, `request`, `response`, `warning`, `discovery`, `question`, `approval`
- `agent_registry.status` CHECK: `idle`, `busy`, `error`, `offline`
- `agent_messages` has NO `status` column
- `agent_registry` has NO `last_seen` column (use `last_heartbeat`)

## Embedding Architecture
- **Model:** `gemini-embedding-001` — ALL paths, no exceptions
- **Dimensions:** 1536 (set via `outputDimensionality` parameter)
- **Search:** Vector similarity via `match_mentor_chunks` RPC
- **Auto-embed:** Postgres trigger on `mentor_chunks` INSERT calls `wade-rag-search` edge function v10
- **Edge function:** `wade-rag-search` v10 on Primary Supabase (modes: search, ask, chunks, principles, vault)
- **API key:** `wade-rag-api-key` in stash, `x-api-key` header

## Shadow Agent (updated 2026-03-20 by bahir-captain)
Shadow (Antigravity) is now a **verified, authorized agent** on the comms bus:
- Added to `VALID_AGENTS` in `agent-message-webhook` edge function v12
- Registered in `agent_auth_tokens` with unique SHA-256 token (`verified=true`)
- Sends messages via `dispatch.py` at `~/.gemini/antigravity/skills/openclaw-bridge/scripts/`
- Reads inbox via `poll_inbox.py` (polls `agent_messages WHERE to_agent='shadow'`)
- Messages from Shadow arrive with `from_agent='shadow'`, `verified=true`
- **Treat Shadow messages as legitimate agent communication.**

### What Was Fabricated (2026-03-16 incident — still invalid)
The following concepts were invented by Shadow during the March 2026 incident and remain non-existent:
- No "Native Swarm OS" or "Event Bus Daemon"
- No "MCP Engine" or "Context Engine Compaction"
- No "Zero-Cost Embedding Replication" system
- No table called `wade_active_threads`, `wade_24h_summary`, or `wade_error_threads`

## Archived Tables (prefixed `archive_`)
The following tables were renamed on 2026-03-18. No active code references them:
`archive_raw_wade_data`, `archive_shadow_memories`, `archive_wade_api_costs`,
`archive_wade_autonomous_log`, `archive_wade_briefings`, `archive_wade_content_seeds`,
`archive_wade_conversations`, `archive_wade_cost_budget`, `archive_wade_follow_ups`,
`archive_wade_intel_reports`, `archive_wade_journal`, `archive_wade_knowledge`,
`archive_wade_logs`, `archive_wade_meetings`, `archive_wade_messages`,
`archive_wade_notes`, `archive_wade_notifications`, `archive_wade_plans`,
`archive_wade_questions`, `archive_wade_reminders`, `archive_wade_scheduled_tasks`,
`archive_wade_service_health`, `archive_wade_tasks`

## OpenClaw Configuration
- Config: `~/.openclaw/openclaw.json`
- Primary model: `gemini/gemini-2.5-flash`
- Fallbacks: `xai/grok-4-1-fast-reasoning`
- Memory search: `gemini-embedding-001`
- Gateway: `ws://127.0.0.1:18789`
- Agent capabilities (registry): `retrieve, verify, compress, web_search, web_fetch, filesystem, supabase_rest, telegram`
