---
name: security-popup-killer
description: Stop recurring macOS SecurityAgent username/password popups and browser localhost auth loops. Use when prompts like “security wants to make changes” or repeated credential dialogs keep reappearing, especially from commands such as `security dump-keychain`, local auth helpers, or localhost tabs.
---

# Security Popup Killer

## Overview
Use this skill to quickly identify and stop the process causing repeated auth popups, dismiss the active popup, and prevent immediate recurrence.

## Workflow

### 1) Scan for likely offenders
Run:

```bash
scripts/kill_security_popups.sh --scan
```

Look for:
- `security dump-keychain -d`
- `stash list` / `~/.local/bin/stash`
- `setup_google_auth.py`
- `scratchpad/server.py`
- listeners on suspicious localhost ports (e.g., 19876, 50098)

### 2) Kill active popup sources + dismiss dialog
Run:

```bash
scripts/kill_security_popups.sh --fix
```

This will:
- kill known offender processes
- disable/bootout `com.mythos.scratchpad` LaunchAgent if present
- click **Deny** on active SecurityAgent popup (if visible)
- report remaining listener state for 19876 and 50098

### 3) Verify
Run:

```bash
scripts/kill_security_popups.sh --verify
```

Success criteria:
- no offender process remains
- no listener on 19876/50098
- popup no longer reappears

## Notes
- Prefer targeted kills over broad process termination.
- Do not enter primary account credentials into unknown auth prompts.
- If popup persists, capture a screenshot and inspect the exact command/app behind the dialog before further action.
