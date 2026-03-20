# TOOLS.md - Local Notes

> **See also: `CAPABILITIES.md`** — the verified, tested tool manifest.
> CAPABILITIES.md is the authoritative source for what works.
> This file contains additional configuration details.

Skills define _how_ tools work. This file is for _your_ specifics.

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

**Status: 3 METHODS AVAILABLE** — Use filesystem or rclone, NOT gog CLI.

### Method 1: Filesystem (FREE, PREFERRED)
Google Drive syncs to: `~/Library/CloudStorage/GoogleDrive-brandonwadepackard@gmail.com/My Drive/`
Read/write files directly. No API calls needed.

### Method 2: rclone
Remote name: `gdrive:`
```bash
rclone ls gdrive: --max-depth 1
rclone copy gdrive:"MYTHOS/COMMAND/STATUS.md" /tmp/
```

### Method 3: Python Google API
Auth helper: `~/.openclaw/workspace/google_api_auth.py`

### DEPRECATED: gog CLI
Do NOT use `gog` for Google operations. Use filesystem or rclone instead.
