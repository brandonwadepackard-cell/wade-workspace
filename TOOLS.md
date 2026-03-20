# TOOLS.md — Wade's Complete Tool Inventory
**Last verified:** 2026-03-20 by bahir (full max-out pass)

## FULL INVENTORY (use all of these)

### Native Tools (no exec needed)
| Tool | Purpose |
|------|---------|
| `exec` | Run any shell command |
| `read` / `write` / `edit` | File operations |
| `web_search` | Brave Search API |
| `web_fetch` | Fetch URL as markdown |
| `memory_search` | Semantic search (wade_memories) |
| `image` | Analyze images with vision model |
| `pdf` | Analyze PDFs with LLM |
| `tts` | Text-to-speech → MP3 |
| `subagents` | Spawn parallel sub-agents |
| `cron` | Manage 8 scheduled jobs |
| `message` | Send, react, delete, edit, poll |
| `process` | Background process management |
| `session_status` | Current session info |

### CLI Tools (via exec)
| CLI | Purpose | Auth |
|-----|---------|------|
| `gog` | Gmail, Calendar, Drive, Tasks, Contacts | ✅ 13 scopes |
| `gh` | GitHub issues, PRs, repos | ✅ brandonwadepackard-cell |
| `himalaya` | Email client | ✅ |
| `mcporter` | MCP server access | ✅ |
| `obsidian-cli` | Obsidian vault automation | ✅ |
| `nano-pdf` | NL PDF editing | ✅ |
| `sag` | ElevenLabs TTS (needs env var) | ✅ |
| `mmdc` | Mermaid → PNG diagrams | ✅ |
| `ffmpeg` | Video/audio conversion | ✅ |
| `wade-rag` | Knowledge retrieval | ✅ |
| `stash` | Secret management | ✅ |
| `wade-probe` | Self-diagnostic probe | ✅ |

### Cron Jobs (8 active, all green)
| Job | Schedule |
|-----|----------|
| Workspace Pulse AM | 9:00 AM daily |
| Workspace Pulse PM | 6:00 PM daily |
| Daily Wins Journal | 9:30 PM daily |
| Agent Response Watchdog | Every 2h |
| Silent Agent Detector | Every 2h |
| MYTHOS Visibility Snapshot | Every 4h |
| Highlights Sync | Every 4h |
| Session Cleanup | Daily |

### Plugins
| Plugin | Purpose |
|--------|---------|
| Telegram | Messaging channel |
| img-to-open | Auto-opens rendered diagram PNGs in Preview |

---
## DETAILED CONFIGURATION

## Web Search & Fetch (Brave)

**Status: ACTIVE** — configured in `openclaw.json` under `tools.web`.

- **Provider:** Brave Search API
- **Tools available:** `web_search` (search the web) and `web_fetch` (fetch a URL's content)
- **Config location:** `tools.web.search` and `tools.web.fetch` in `~/.openclaw/openclaw.json`

Use these tools when Brandon asks you to look something up, research a topic, check a URL, or get current information. You have full web access.

**Schema note:** The correct config keys are `tools.web.search` and `tools.web.fetch` (nested under `web`). NOT `tools.web_search` / `tools.web_fetch` (underscore format is invalid and will break the config).

## Supabase

Two active projects. **Use the anon JWT key** for REST API calls — the `sb_publishable_` key does NOT work with the REST API.

### brandonwadepackard-cell (primary — memory/identity)
- **URL:** `https://rjcoeoropwvqzvinopze.supabase.co`
- **Anon key:** retrieve via `stash get supabase-primary-anon`
- See `skills/supabase/SKILL.md` for full curl examples

### make-a-million (game project)
- **URL:** `https://shfygoaslyinjcvmgels.supabase.co`
- **Anon key:** retrieve via `stash get supabase-make-a-million-anon`
- See `skills/supabase/SKILL.md` for full curl examples

### MCP Note
The file `~/.openclaw/mcp-servers.json` exists but OpenClaw does NOT load it. OpenClaw uses `mcporter` for MCP servers, which is separate. **Use the curl REST API approach above — it works.**

## Mountain America Credit Union (MACU) → Stripe Integration

**Status: READY FOR SETUP** — Scripts and documentation created.

- **Bank:** Mountain America Credit Union
- **Setup Script:** `connect_macu_to_stripe.sh`
- **Documentation:** `MACU_STRIPE_INTEGRATION.md`
- **Stripe Dashboard:** https://dashboard.stripe.com/settings/banking

### How to Connect
1. **Run setup script:** `./connect_macu_to_stripe.sh`
2. **Or manual:** Stripe Dashboard → Settings → Banking → Add bank account
3. **Verify:** Wait for micro-deposits (1-2 business days)

## Flexx Fiber Voice Agent (PRODUCTION READY)

**Status: READY FOR DEPLOYMENT** — All credentials verified and configured.

### Credential Access
All credentials stored in macOS Keychain via `stash`. Use:
- `stash get twilio-account-sid`
- `stash get twilio-api-key`
- `stash get anthropic-api-key`
- `stash get openai-api-key`

**NEVER hardcode credentials in this file.** Always retrieve from stash at runtime.

### Deployment
```bash
# Load credentials from vault
./credential_manager.sh load

# Test credentials work
./credential_manager.sh test
```

## Whisper AI MCP Integration

**Status: CONFIGURED** — Ready to use with Claude desktop app.

- **MCP Token:** retrieve via `stash get whisper-mcp-token` (if saved) or check `~/Library/Application Support/Claude/claude_desktop_config.json`

### How to Use
1. Open Claude desktop app
2. Upload audio/video files directly in chat
3. Paste social media links (YouTube, TikTok, Instagram, etc.)
4. Ask Claude to transcribe using Whisper AI

### Supported Formats
- Audio: mp3, wav, m4a, etc.
- Video: mp4, etc.
- Social media: YouTube, VK, Instagram, TikTok, RuTube links

## Google Workspace

**Status: FULLY OPERATIONAL** — 4 methods available.

### Method 1: gog CLI (PREFERRED for Gmail, Calendar, Tasks, Contacts)
**Authenticated:** brandonwadepackard@gmail.com — all 13 scopes (gmail, calendar, drive, contacts, tasks, sheets, docs, slides, chat, classroom, forms, people, appscript)
**Backend:** macOS Keychain (no password prompts)
```bash
# Gmail
gog gmail list "is:inbox" -a brandonwadepackard@gmail.com --plain
gog gmail read <messageId> -a brandonwadepackard@gmail.com
gog send -a brandonwadepackard@gmail.com --to "..." --subject "..." --body "..."

# Calendar
gog calendar list -a brandonwadepackard@gmail.com --plain
gog calendar create -a brandonwadepackard@gmail.com --summary "..." --start "..." --end "..."

# Drive
gog drive ls -a brandonwadepackard@gmail.com --plain
gog drive search "query" -a brandonwadepackard@gmail.com

# Tasks
gog tasks list -a brandonwadepackard@gmail.com --plain

# Contacts
gog contacts list -a brandonwadepackard@gmail.com --plain
```

### Method 2: Filesystem (for Drive file read/write)
Google Drive syncs to: `~/Library/CloudStorage/GoogleDrive-brandonwadepackard@gmail.com/My Drive/`
Read/write files directly. No API calls needed. Best for reading/writing docs and files.

### Method 3: rclone (for Drive bulk operations)
Remote name: `gdrive:`
```bash
rclone ls gdrive: --max-depth 1
rclone copy gdrive:"MYTHOS/COMMAND/STATUS.md" /tmp/
```

### Method 4: Python Google API
Auth helper: `~/.openclaw/workspace/google_api_auth.py`

## GitHub

**Status: ACTIVE** — Authenticated as `brandonwadepackard-cell`
```bash
gh issue list
gh pr list
gh repo list
gh api repos/OWNER/REPO/issues
```

## MCP Server Access (mcporter)

**Status: ACTIVE** — v0.7.3
```bash
mcporter list                              # List configured servers
mcporter call <server>.<method> [params]   # Call an MCP tool
```

## Obsidian Vault (obsidian-cli)

**Status: ACTIVE** — Vault at `~/Documents/THE TRUE MYTHOS/`
```bash
obsidian-cli search "query" --vault ~/Documents/THE\ TRUE\ MYTHOS/
obsidian-cli create "Note Title" --vault ~/Documents/THE\ TRUE\ MYTHOS/
```

## PDF Editing (nano-pdf)

**Status: ACTIVE** — NL PDF editing
```bash
nano-pdf edit document.pdf 1 "Change the title to 'New Title'"
```

## ElevenLabs TTS (sag)

**Status: ACTIVE** — Requires API key env var
```bash
ELEVENLABS_API_KEY=$(security find-generic-password -a brandonpackard -s stash.elevenlabs-api-key -w)
sag speak "Hello Brandon" --voice Roger
sag voices
```
