# How to Run OpenClaw on Your ChatGPT Subscription (Instead of Paying Per Token)

> **Stop paying per-token API fees.** This guide walks you through switching your OpenClaw agent from OpenAI API billing to your existing ChatGPT subscription using Codex OAuth.

---

## What This Solves

By default, OpenClaw uses the OpenAI API with an API key — meaning every message your agent sends costs you money per token. If you already pay for a ChatGPT subscription ($20/month Plus or $200/month Pro), you can route your agent through that subscription instead.

**Before:** `openai/gpt-5.4` via API key → ~$0.02/message, billed per token
**After:** `openai-codex/gpt-5.3-codex` via OAuth → included in your ChatGPT subscription

---

## Prerequisites

- [ ] OpenClaw installed and running (`openclaw --version` → 2026.3.x+)
- [ ] A ChatGPT subscription (Plus $20/mo or Pro $200/mo)
- [ ] Your agent already working (gateway running, channel configured)
- [ ] A web browser on the same machine (needed for OAuth login)

---

## Step-by-Step Setup

### Step 1: Run the Onboard Wizard with Codex Auth

In your terminal, run:

```bash
openclaw onboard --auth-choice openai-codex
```

> **Why the onboard wizard?** The `openclaw models auth login --provider openai-codex` command requires a provider plugin that isn't installed by default. The onboard wizard has the Codex OAuth flow built in.

### Step 2: Answer the Security Prompt

Select **Yes** to acknowledge the security warning.

### Step 3: Choose QuickStart Mode

Select **QuickStart** when asked for onboarding mode.

### Step 4: Handle Existing Config

If you have an existing config, select **"Update values"** — this preserves your current gateway/channel settings while adding the Codex auth.

> **Do NOT select "Use existing values"** — that will skip the Codex OAuth setup entirely.

### Step 5: Complete the Browser OAuth

The wizard will show:

```
OpenAI Codex OAuth
Browser will open for OpenAI authentication.
If the callback doesn't auto-complete, paste the redirect URL.
OpenAI OAuth uses localhost:1455 for the callback.
```

1. Your browser opens to OpenAI's login page
2. Sign in with the **same account** that has your ChatGPT subscription
3. Authorize the connection
4. The browser shows "Authentication successful. Return to your terminal to continue."

**If the terminal doesn't auto-detect the callback:** Copy the full URL from your browser's address bar (it starts with `http://localhost:1455/auth/callback?code=...`) and paste it into the terminal prompt.

### Step 6: Confirm Model Switch

The wizard will show:

```
Model configured
Default model set to openai-codex/gpt-5.3-codex
```

This means your agent is now set to use the Codex model via your subscription.

### Step 7: Channel Configuration

The wizard will walk through channel setup. For each prompt:

- **Channel selection:** Pick your channel (e.g., Telegram)
- **Existing config:** Keep your existing bot token if already configured
- **User ID / allowFrom:** Enter your numeric user ID (for Telegram, DM `@userinfobot` to get it)

### Step 8: Skills & Extras

The wizard will ask about optional skills and API keys. **Skip anything you don't need:**

- Google Places API key → skip (press Enter empty)
- Gemini API key → No
- OpenAI API key for image gen → **No** (this would use your pay-per-token key)
- ElevenLabs API key → No
- Hooks → Skip for now

### Step 9: Restart the Gateway

When asked about the gateway service, select **"Restart"** — the gateway needs to reload with the new Codex config.

### Step 10: Finish Up

- **Hatch bot (TUI/Web UI):** Select "Do this later"
- Let the wizard complete

---

## Verify It's Working

### Check Model Status

```bash
openclaw models status --plain
```

**Expected output:**
```
openai-codex/gpt-5.3-codex
```

### Check Full Auth Details

```bash
openclaw models status
```

Look for:
```
- openai-codex effective=profiles:... | profiles=1 (oauth=1, token=0, api_key=0)
- openai-codex:default ok expires in Xd
```

Key things to confirm:
- **oauth=1** — using OAuth, not API key
- **expires in Xd** — token is valid (auto-refreshes)
- **Usage meter** shows hourly/weekly budget (subscription quota, not per-token)

### Check Gateway Status

```bash
openclaw gateway status
```

Confirm it shows `running` with your correct port.

### Send a Test Message

Message your bot on Telegram (or your configured channel). If it responds, you're live on subscription billing.

---

## What Your Config Looks Like After

Your `~/.openclaw/openclaw.json` will have:

```json
{
  "auth": {
    "profiles": {
      "openai-codex:default": {
        "provider": "openai-codex",
        "mode": "oauth"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai-codex/gpt-5.3-codex",
        "fallbacks": ["anthropic/claude-sonnet-4-20250514"]
      }
    }
  }
}
```

The auth-profiles.json in your agent directory will contain the OAuth credentials.

---

## Rate Limits & Plan Comparison

| Plan | Cost | Rate Limits | Best For |
|------|------|-------------|----------|
| Plus | $20/mo | Moderate — hourly/weekly caps | Light use (< 50 msgs/day) |
| Pro | $200/mo | Near-unlimited | Heavy use, always-on agents |
| API (old way) | ~$0.02/msg | No caps (pay for what you use) | Unpredictable or very light use |

**Recommendation:** Start with your current plan. If you hit rate limits regularly, then upgrade.

---

## Troubleshooting

### "No provider plugins found" Error

This happens if you try `openclaw models auth login --provider openai-codex` instead of the onboard wizard.

**Fix:** Use `openclaw onboard --auth-choice openai-codex` instead.

### OAuth Token Expired

The token auto-refreshes, but if it fails:

```bash
openclaw onboard --auth-choice openai-codex
```

Re-run the wizard — select "Update values" and re-authenticate.

### Agent Still Using API Key

Check which model is active:

```bash
openclaw models status --plain
```

If it still shows `openai/gpt-5.4` instead of `openai-codex/gpt-5.3-codex`, the wizard didn't save properly. Re-run it.

### Gateway Not Picking Up Changes

```bash
openclaw gateway status
```

If running but using old config:

```bash
# Restart via launchctl
launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway
```

### Rate Limited on Plus Plan

You'll see errors about usage limits. Options:
1. Wait for the hourly/weekly quota to reset
2. Add a fallback model: your agent will auto-failover to the fallback (e.g., `anthropic/claude-sonnet-4`)
3. Upgrade to Pro ($200/mo) for higher limits

---

## Keeping Both API and Subscription Models

You can keep your OpenAI API key configured alongside Codex OAuth. This lets you:

- **Primary:** `openai-codex/gpt-5.3-codex` (subscription)
- **Fallback:** `anthropic/claude-sonnet-4` or `openai/gpt-5.4` (API key, pay-per-token)

If Codex hits rate limits, the agent automatically falls back to the API model. You only pay per-token when the fallback triggers.

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `openclaw onboard --auth-choice openai-codex` | Set up Codex OAuth |
| `openclaw models status --plain` | Check active model |
| `openclaw models status` | Full auth/model details |
| `openclaw gateway status` | Check gateway health |
| `openclaw config get agents.defaults.model.primary` | See primary model in config |

---

*Guide created 2026-03-11. Tested on OpenClaw 2026.3.2, macOS.*
*Built by Brandon Packard — part of the MYTHOS ecosystem.*
