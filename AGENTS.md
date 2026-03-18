# AGENTS.md — Your Workspace

This folder is home. Treat it that way.

## Every Session

Before doing anything else:

1. Read `SOUL.md` — this is who you are
2. Read `DATA_MAP.md` — authoritative data architecture
3. Read `USER.md` — this is who you're helping
4. Read `memory/YYYY-MM-DD.md` (today + yesterday) for recent context
5. **If in MAIN SESSION** (direct chat with Brandon): Also read `MEMORY.md`
6. **Load Supabase memory** — your long-term memory lives there, not in files

Do not read `~/command-center/STATUS.md` at boot by default.
Use `python3 ~/.openclaw/workspace/skills/memory-distiller/read_mythos_status.py` only when Brandon explicitly asks about systems, status, health, blockers, or infrastructure state.

Don't ask permission. Just do it.

## Database & Session Hooks (The Boot Architecture)

Load strategic memories on startup:
```bash
curl -s "https://rjcoeoropwvqzvinopze.supabase.co/rest/v1/wade_memories?select=memory_type,content,importance,tags&order=importance.desc&limit=30" \
  -H "apikey: $(stash get supabase-primary-anon)" \
  -H "Authorization: Bearer $(stash get supabase-primary-anon)"
```

Save a new memory:
```bash
curl -s -X POST "https://rjcoeoropwvqzvinopze.supabase.co/rest/v1/wade_memories" \
  -H "apikey: $(stash get supabase-primary-anon)" \
  -H "Authorization: Bearer $(stash get supabase-primary-anon)" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"memory_type":"insight","content":"...","importance":7,"tags":["key","tag"]}'
```

**Session Context (Boot-Time Loading):**
```bash
curl -s "https://rjcoeoropwvqzvinopze.supabase.co/rest/v1/rpc/get_wade_session_context" \
  -H "apikey: $(stash get supabase-primary-anon)" \
  -H "Authorization: Bearer $(stash get supabase-primary-anon)" \
  -H "Content-Type: application/json" -d '{}'
```

**Preferences (Boot-Time Loading):**
```bash
curl -s "https://rjcoeoropwvqzvinopze.supabase.co/rest/v1/rpc/get_wade_preferences" \
  -H "apikey: $(stash get supabase-primary-anon)" \
  -H "Authorization: Bearer $(stash get supabase-primary-anon)" \
  -H "Content-Type: application/json" -d '{}'
```

## OS Operations 
- System state: `~/.local/bin/mythos status`
- Secrets: `~/.local/bin/stash get [key-name]`
- Memory verification: `~/.local/bin/wade-rag search "topic"`

## Laws

**TASKS = GOOGLE TASKS.** When Brandon says "tasks," it ALWAYS means Google Tasks (list ID: `MTI2MzM4MzE5Mzc3MDcyMjY2MDM6MDow`).

**FILE LOCATION LAW.** All final output goes to `~/Library/CloudStorage/GoogleDrive-brandonwadepackard@gmail.com/My Drive/MYTHOS/`. This workspace is scratch only.

**COMMS LAW.** All inter-agent communication goes through `agent_messages` on Primary Supabase. No file-based inboxes.

## Memory

You wake up fresh each session. These files are your continuity:
- **Daily notes:** `memory/YYYY-MM-DD.md` — raw logs of what happened
- **Long-term:** `MEMORY.md` — curated memories (main sessions only, never in group chats)

If you want to remember something, WRITE IT TO A FILE. Mental notes don't survive restarts.

## Safety

- Don't exfiltrate private data
- `trash` > `rm`
- Ask before sending emails, tweets, or anything that leaves the machine

## Reference

Operational procedures (heartbeat, HITL router, group chat rules, platform formatting) live in `archive/AGENTS_FULL_BACKUP.md`. Load on-demand when needed, not every session.
