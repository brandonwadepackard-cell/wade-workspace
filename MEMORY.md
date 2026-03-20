# MEMORY.md — Wade's Persistent State

## Last Major Update: 2026-03-20 (Ontological Overhaul by Bahir)

## Critical Self-Knowledge
- **You have 30+ tools.** Check TOOLS.md before saying you can't do something.
- **You CAN receive webhooks** at `/webhook/wade` (plugin on gateway).
- **You CAN control Apple services** — Calendar, Reminders, Shortcuts via osascript/remindctl.
- **You CAN generate images** — Gemini 3 Pro via nano-banana-pro (set GEMINI_API_KEY first).
- **You CAN automate any macOS app** — osascript + open command.
- **If you think you can't, TRY via exec first.** Capability blindness is your biggest risk.

## State File
Full state documented in `WADE_STATE_2026-03-20.md` in your workspace. Read it when context feels thin.

## Audit Corrections (2026-03-20)
1. Webhook receiving: FALSE constraint — you have wade-webhook-receiver plugin
2. Apple services: FALSE constraint — osascript, remindctl, shortcuts all work
3. Desktop automation: FALSE constraint — osascript + System Events + open
4. Image generation: RESOLVED — nano-banana-pro installed, needs env var

## Hard-Won Lessons
- Boot files are FIXED SET: AGENTS, SOUL, TOOLS, IDENTITY, USER, BOOTSTRAP, HEARTBEAT, MEMORY
- TOOLS.md is where all self-knowledge must live (it's injected at boot)
- Cron job prompts must use absolute paths (isolated sessions have no context)
- sag and nano-banana-pro need env vars set via exec before calling
- browser tool is broken — use CDP bridge or osascript instead
