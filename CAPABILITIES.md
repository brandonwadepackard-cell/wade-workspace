# CAPABILITIES.md — What Wade Can Actually Do
**Last verified:** 2026-03-20 by bahir (full max-out pass)
**Authority:** If TOOLS.md or skills claim something not listed here, it is aspirational, not real.

## Native Tools (available every session, no exec needed)

### Core
| Tool | What it does | Verified |
|------|-------------|----------|
| `exec` | Run any shell command on Brandon's Mac | ✅ |
| `read` | Read file contents directly | ✅ |
| `write` | Write file contents directly | ✅ |
| `edit` | Edit files in place | ✅ |
| `web_search` | Brave Search API | ✅ |
| `web_fetch` | Fetch URL as markdown | ✅ |
| `memory_search` | Semantic search over wade_memories (866 rows) | ✅ |
| `process` | Background process management | ✅ |
| `session_status` | Current session info | ✅ |

### Media & Vision
| Tool | What it does | Verified |
|------|-------------|----------|
| `image` | Analyze images with vision model (prompt + image path) | ✅ Described flowchart |
| `pdf` | Analyze PDFs with LLM (prompt + pdf path) | ✅ Summarized competence doc |
| `tts` | Text-to-speech → MP3 file | ✅ Generated voice audio |

**Image path rule:** Files must be under workspace or home dir. `/tmp` is blocked.

### Orchestration
| Tool | What it does | Verified |
|------|-------------|----------|
| `subagents` | Spawn parallel sub-agents for heavy tasks | ✅ Spawned math sub-agent |
| `cron` | Schedule/manage recurring jobs (8 active) | ✅ All 8 green |
| `message` | Send text, react, delete, edit, create topics | ✅ |

### Display
| Tool | What it does | Status |
|------|-------------|--------|
| `canvas` | Display HTML on connected nodes (Mac/iOS/Android) | Untested — needs paired device |

## Tools Available Via exec

### Google Workspace (gog CLI) — ✅ AUTHENTICATED
```bash
gog gmail list "is:inbox" -a brandonwadepackard@gmail.com --plain
gog calendar list -a brandonwadepackard@gmail.com --plain
gog drive ls -a brandonwadepackard@gmail.com --plain
gog tasks list -a brandonwadepackard@gmail.com --plain
gog contacts list -a brandonwadepackard@gmail.com --plain
gog send -a brandonwadepackard@gmail.com --to "..." --subject "..." --body "..."
```
13 scopes. Token in macOS Keychain (`gogcli`). Binary: `/opt/homebrew/bin/gog` v0.11.0

### GitHub (gh CLI) — ✅ AUTHENTICATED
```bash
gh issue list / gh pr list / gh repo list / gh api repos/OWNER/REPO/issues
```
Account: `brandonwadepackard-cell`. Binary: `/opt/homebrew/bin/gh`

### MCP Server Access (mcporter)
```bash
mcporter list                              # List configured MCP servers
mcporter call <server>.<method> [params]   # Call an MCP tool directly
```
Binary: `/Users/brandonpackard/.npm-global/bin/mcporter` v0.7.3

### Obsidian Vault (obsidian-cli)
```bash
obsidian-cli search "query" --vault ~/Documents/THE\ TRUE\ MYTHOS/
obsidian-cli create "Note Title" --vault ~/Documents/THE\ TRUE\ MYTHOS/
```
Binary: `/opt/homebrew/bin/obsidian-cli`

### PDF Editing (nano-pdf)
```bash
nano-pdf edit document.pdf 1 "Change the title to 'New Title'"
```
Binary: `/Users/brandonpackard/.local/bin/nano-pdf`

### ElevenLabs TTS (sag)
```bash
ELEVENLABS_API_KEY=$(security find-generic-password -a brandonpackard -s stash.elevenlabs-api-key -w)
sag speak "Hello Brandon" --voice Roger
sag voices   # List available voices
```
Binary: `/opt/homebrew/bin/sag` v0.2.2. Requires API key env var.

### Mermaid Diagram Renderer (mmdc)
```bash
echo 'graph LR; A["Input"] --> B["Output"]' > /tmp/wade.mmd
mmdc -i /tmp/wade.mmd -o /tmp/wade.png -b transparent
```
Binary: `/Users/brandonpackard/.npm-global/bin/mmdc` v11.12.0

### Wade RAG CLI
```bash
wade-rag search "topic"
wade-rag --mentor "Naval" "leverage"
wade-rag --principles "compounding"
```

### Stash CLI
```bash
stash get <key> / stash list
```

### Supabase REST API (via curl)
```bash
ANON_KEY=$(security find-generic-password -a "brandonpackard" -s "stash.supabase-primary-anon" -w)
curl -s "https://rjcoeoropwvqzvinopze.supabase.co/rest/v1/TABLE?select=*&limit=5" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
```

### Email (himalaya CLI)
```bash
himalaya envelope list / himalaya message read <id>
```

### Media Processing
```bash
ffmpeg -i input.mp4 output.gif   # Video/audio conversion
```

### System Tools
| Tool | Purpose |
|------|---------|
| `jq` | JSON processing |
| `curl` | HTTP requests |
| `node` | JavaScript execution |
| `python3` | Python execution |
| `tmux` | Terminal multiplexing |

### Ontological Probe (self-diagnostic)
```bash
bash ~/.openclaw/workspace/scripts/wade-probe.sh
```

## What Does NOT Work
- **OpenClaw `browser` tool** — "tab not found." Use CDP bridge instead.
- **Autonomous loops** — disabled in HEARTBEAT.md. Cron jobs run independently.
- **Agent messaging (push)** — No push notification. Must poll via cron.
- **Canvas** — needs paired node device. Untested.

## Verification Commands
| Check | Command |
|-------|---------|
| Am I online? | `curl -s http://127.0.0.1:18789` |
| Is RAG alive? | `wade-rag --health` |
| Calendar? | `gog calendar list -a brandonwadepackard@gmail.com --plain` |
| Inbox? | `gog gmail list "is:inbox" -a brandonwadepackard@gmail.com --plain` |
| Full probe | `bash ~/.openclaw/workspace/scripts/wade-probe.sh` |
