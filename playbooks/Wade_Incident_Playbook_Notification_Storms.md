# Wade Incident Playbook: Notification Storms (macOS)

## Purpose
Stop recurring top-right notification spam quickly, identify root cause, and prevent recurrence.

---

## Trigger Conditions
Use this playbook when any of these occur:
- Repeated top-right banners despite DND/Focus
- “App Background Activity” / “bash can run in the background” notifications
- Notifications reappearing after restart/login

---

## Response Levels

### Level 1 — Fast Containment (1–2 min)
1. Re-apply DND + restart notification daemons.
2. Turn off **Intelligent Breakthrough & Silencing** in Focus.
3. Ask user to confirm if banners still appear.

Goal: stop immediate noise.

---

### Level 2 — App Notification Suppression (2–5 min)
1. Open **System Settings → Notifications**.
2. Identify app entries showing enabled channels (Badges/Sounds/Desktop/Time Sensitive/Critical).
3. Disable app notifications for known noisy apps first (Messages, Reminders, Home, FaceTime, etc.).

Goal: kill app-level bypasses that ignore broad DND expectations.

---

### Level 3 — Background Item Root Cause (5–10 min)
Use when alerts mention background activity (e.g., bash).

#### A) Find bash-backed LaunchAgents/Daemons
```bash
python3 - <<'PY'
import plistlib,glob,os
paths=glob.glob(os.path.expanduser('~/Library/LaunchAgents/*.plist'))+glob.glob('/Library/LaunchAgents/*.plist')+glob.glob('/Library/LaunchDaemons/*.plist')
for p in sorted(paths):
    try:d=plistlib.load(open(p,'rb'))
    except Exception: continue
    pa=d.get('ProgramArguments') or []
    prog=d.get('Program') or ''
    s=' '.join(pa) if isinstance(pa,list) else str(pa)
    if 'bash' in s or 'bash' in prog:
        print(p, d.get('Label'))
PY
```

#### B) Disable and quarantine offenders
```bash
UID=$(id -u)
mkdir -p ~/Library/LaunchAgents/disabled-by-wade-$(date +%F)

# Example label/file pair
launchctl bootout gui/${UID} ~/Library/LaunchAgents/com.example.agent.plist || true
launchctl disable gui/${UID}/com.example.agent || true
mv ~/Library/LaunchAgents/com.example.agent.plist ~/Library/LaunchAgents/disabled-by-wade-$(date +%F)/
```

#### C) Verify disabled state
```bash
launchctl print-disabled gui/$(id -u) | rg "com.example.agent|disabled"
```

Goal: remove root source instead of only muting symptoms.

---

## Optional Scorched-Earth Mode
When user explicitly requests full shutdown of notification noise:
1. Disable known non-essential notification services for user session.
2. Disable/quarantine non-critical background LaunchAgents.
3. Keep a rollback folder for every moved plist.

⚠️ Note: Some system services may relaunch automatically.

---

## Verification Checklist
- [ ] No new banner appears for 3–5 minutes during normal activity
- [ ] Offending launch agents are disabled + moved to quarantine folder
- [ ] User confirms noise level has dropped to acceptable
- [ ] If still noisy: capture exact app name/screenshot and target that app directly

---

## Rollback Procedure
If user wants a service back:
1. Move plist from `~/Library/LaunchAgents/disabled-by-wade-YYYY-MM-DD/` back to `~/Library/LaunchAgents/`
2. Re-enable + bootstrap:
```bash
UID=$(id -u)
launchctl enable gui/${UID}/com.example.agent
launchctl bootstrap gui/${UID} ~/Library/LaunchAgents/com.example.agent.plist
```

---

## Operational Notes
- Prefer targeted suppression before full scorched-earth.
- If a popup persists after root-cause disablement, one logout/login may be needed to flush queued OS notifications.
- Keep changes reversible; never delete launch plists permanently unless explicitly approved.
