# CAPABILITIES.md — What Wade Can Actually Do
**Last verified:** 2026-03-20 by bahir
**Authority:** If TOOLS.md or skills claim something not listed here, it is aspirational, not real.

## Verified Tools (available in every session)

### 1. exec (shell)
Run any shell command on Brandon's Mac. This is your most powerful tool.
- Read files, query APIs, run scripts, check processes
- **Limitation:** Exit codes are not surfaced by OpenClaw. Parse STDOUT for errors.
- **Verification:** `exec: echo "alive"` → returns "alive"

### 2. web_search (Brave)
Search the web. Returns structured results.
- **Provider:** Brave Search API (key: `brave-api-key` in stash)
- **Verification:** Search for any term → returns results

### 3. web_fetch
Fetch any URL and extract content as markdown.
- **Verification:** Fetch any public URL → returns content

### 4. memory_search
Semantic search over wade_memories (866 rows, gemini-embedding-001).
- **Verification:** Search any term → returns relevant memories by embedding similarity

## Tools Available Via exec

### Mermaid Diagram Renderer (mmdc)
Render Mermaid diagrams to PNG images. **Never show raw Mermaid to Brandon — always render first.**
```bash
# Write Mermaid syntax to temp file
echo 'graph LR
    A["Step 1"] --> B["Step 2"] --> C["Result"]' > /tmp/wade-diagram.mmd

# Render to PNG (transparent background)
mmdc -i /tmp/wade-diagram.mmd -o /tmp/wade-diagram.png -b transparent

# Render with dark theme
mmdc -i /tmp/wade-diagram.mmd -o /tmp/wade-diagram.png -t dark -b transparent

# Render as SVG instead
mmdc -i /tmp/wade-diagram.mmd -o /tmp/wade-diagram.svg -b transparent
```
Supports: `graph`, `flowchart`, `sequenceDiagram`, `stateDiagram`, `gantt`, `pie`, `classDiagram`
Binary: `/Users/brandonpackard/.npm-global/bin/mmdc` (v11.12.0)

### Wade RAG CLI
```bash
~/.local/bin/wade-rag search "topic"
~/.local/bin/wade-rag --mentor "Naval" "leverage"
~/.local/bin/wade-rag --principles "compounding"
```

### Stash CLI
```bash
~/.local/bin/stash get <key>
~/.local/bin/stash list
```

### Supabase REST API (via curl)
```bash
ANON_KEY=$(security find-generic-password -a "brandonpackard" -s "stash.supabase-primary-anon" -w)
curl -s "https://rjcoeoropwvqzvinopze.supabase.co/rest/v1/TABLE?select=*&limit=5" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
```

### Ontological Probe (self-diagnostic)
```bash
bash ~/.openclaw/workspace/scripts/wade-probe.sh
```
Returns JSON: service health, table counts, registry status, memory health, stash availability.

### CDP Browser Bridge (manual workaround)
```bash
~/.openclaw/workspace/skills/wade-cdp-bridge/venv/bin/python3 \
  ~/.openclaw/workspace/skills/wade-cdp-bridge/cdp_relay_daemon.py --navigate "URL"
```
**Requires:** Chrome launched with `--remote-debugging-port=9222`. Not always available.

### Google Workspace (gog CLI) — ✅ AUTHENTICATED
```bash
# Gmail
gog gmail list --account brandonwadepackard@gmail.com       # List inbox
gog gmail read <messageId> -a brandonwadepackard@gmail.com  # Read email
gog send -a brandonwadepackard@gmail.com --to "..." --subject "..." --body "..."

# Calendar
gog calendar list -a brandonwadepackard@gmail.com           # List events
gog calendar create -a brandonwadepackard@gmail.com --summary "..." --start "..." --end "..."

# Drive
gog drive ls -a brandonwadepackard@gmail.com                # List files
gog drive search "query" -a brandonwadepackard@gmail.com    # Search Drive
gog drive download <fileId> -a brandonwadepackard@gmail.com # Download file
gog drive upload <path> -a brandonwadepackard@gmail.com     # Upload file

# Contacts
gog contacts list -a brandonwadepackard@gmail.com           # List contacts

# Tasks
gog tasks list -a brandonwadepackard@gmail.com              # List tasks
```
**Auth:** ✅ Completed 2026-03-20. Token in macOS Keychain (service: `gogcli`). Survives restarts.
**Backend:** macOS Keychain (no password prompts)
Binary: `/opt/homebrew/bin/gog` (v0.11.0)

### GitHub (gh CLI)
```bash
gh issue list                        # List issues
gh pr list                           # List PRs
gh repo list                         # List repos
gh api repos/OWNER/REPO/issues       # Raw API access
```
**Status:** ✅ Authenticated as `brandonwadepackard-cell`
Binary: `/opt/homebrew/bin/gh`

### Email (himalaya CLI)
```bash
himalaya envelope list               # List inbox
himalaya message read <id>           # Read message
himalaya message write               # Compose
```
Binary: `/opt/homebrew/bin/himalaya`

### Media Tools
```bash
ffmpeg -i input.mp4 output.gif       # Video/audio conversion
mmdc -i diagram.mmd -o output.png    # Mermaid rendering
```
Binaries: `/opt/homebrew/bin/ffmpeg`, `/Users/brandonpackard/.npm-global/bin/mmdc`

### System Tools (all via exec)
| Tool | Command | Purpose |
|------|---------|---------|
| **jq** | `jq '.key' file.json` | JSON processing |
| **curl** | `curl -s URL` | HTTP requests |
| **node** | `node -e "..."` | JavaScript execution |
| **python3** | `python3 -c "..."` | Python execution |
| **tmux** | `tmux ...` | Terminal multiplexing |

## What Does NOT Work

- **OpenClaw `browser` tool** — returns "tab not found." Broken. Use CDP bridge instead.
- **MCP servers** — `mcp-servers.json` is NOT loaded by OpenClaw. The 9 server definitions are decorative.
- **Autonomous loops** — disabled in HEARTBEAT.md. Wade cannot self-trigger actions.
- **Agent messaging (push)** — Wade can write to agent_messages via curl, but has no push notification. Must poll.
- **gog (Google)** — ✅ Fully operational. 13 scopes. Token in Keychain.

## Verification Commands

Quick checks Wade can run via exec to verify his world:

| Check | Command |
|-------|---------|
| Am I online? | `exec: curl -s http://127.0.0.1:18789` |
| Is RAG alive? | `exec: wade-rag --health` |
| My registry entry? | `exec: curl -s "https://rjcoeoropwvqzvinopze.supabase.co/rest/v1/agent_registry?agent_id=eq.wade&select=status,capabilities,last_heartbeat" -H "apikey: $(stash get supabase-primary-anon)"` |
| Pending messages? | `exec: curl -s "https://rjcoeoropwvqzvinopze.supabase.co/rest/v1/agent_messages?to_agent=eq.wade&read_at=is.null&select=from_agent,subject,created_at" -H "apikey: $(stash get supabase-primary-anon)"` |
| Full probe | `exec: bash ~/.openclaw/workspace/scripts/wade-probe.sh` |
