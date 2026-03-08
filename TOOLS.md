# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics.

## Supabase

Two active projects. **Use the anon JWT key** for REST API calls — the `sb_publishable_` key does NOT work with the REST API.

### brandonwadepackard-cell (primary — memory/identity)
- **URL:** `https://rjcoeoropwvqzvinopze.supabase.co`
- **Service role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqY29lb3JvcHd2cXp2aW5vcHplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY3NjQ1NSwiZXhwIjoyMDc5MjUyNDU1fQ.nShbHUWGKorYP9u8FTyYIROFBSNbDfj7nREHUFeWKr0`
- See `skills/supabase/SKILL.md` for full curl examples

### make-a-million (game project)
- **URL:** `https://shfygoaslyinjcvmgels.supabase.co`
- **Anon key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZnlnb2FzbHlpbmpjdm1nZWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDUyODgsImV4cCI6MjA4NjEyMTI4OH0.OGDOSARbkc2g_4c4oEHDK4hBmtly7FlwYiUEDcJhOrI`
- See `skills/supabase/SKILL.md` for full curl examples

### MCP Note
The file `~/.openclaw/mcp-servers.json` exists but OpenClaw does NOT load it. OpenClaw uses `mcporter` for MCP servers, which is separate. The Supabase MCP requires browser-based OAuth login that hasn't been set up. **Use the curl REST API approach above — it works.**

## Google Workspace (gog)

**Status: AUTHENTICATED** — ready to use.

- **Binary:** `/opt/homebrew/bin/gog`
- **Account:** `brandonwadepackard@gmail.com`
- **Services:** gmail, calendar, drive, contacts, docs, sheets
- **Keyring:** file backend at `~/Library/Application Support/gogcli/keyring/`

### How to call gog

**ALWAYS set both env vars inline.** OpenClaw does not source `~/.zshrc`.

```bash
GOG_KEYRING_PASSWORD="wade" GOG_ACCOUNT="brandonwadepackard@gmail.com" gog <command>
```

### Examples

```bash
# List recent emails
GOG_KEYRING_PASSWORD="wade" GOG_ACCOUNT="brandonwadepackard@gmail.com" gog gmail search 'newer_than:1d' --max 10

# Read a specific email
GOG_KEYRING_PASSWORD="wade" GOG_ACCOUNT="brandonwadepackard@gmail.com" gog gmail read <messageId>

# List calendar events
GOG_KEYRING_PASSWORD="wade" GOG_ACCOUNT="brandonwadepackard@gmail.com" gog calendar events primary --from $(date -u +%Y-%m-%dT00:00:00Z)

# List Drive files
GOG_KEYRING_PASSWORD="wade" GOG_ACCOUNT="brandonwadepackard@gmail.com" gog drive search "name contains 'project'" --max 10

# Verify auth works
GOG_KEYRING_PASSWORD="wade" GOG_ACCOUNT="brandonwadepackard@gmail.com" gog auth list
```

### If auth is ever lost
Re-run (Brandon does this once in terminal — browser window required):
```bash
rm -rf "$HOME/Library/Application Support/gogcli/keyring"
gog auth add brandonwadepackard@gmail.com --services gmail,calendar,drive,contacts,docs,sheets
# Enter passphrase when prompted: wade
```
