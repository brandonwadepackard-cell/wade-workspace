#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"

scan() {
  echo "== Suspect processes =="
  pgrep -fal 'security dump-keychain|stash list|/.local/bin/stash|setup_google_auth.py|scratchpad/server.py' || true

  echo
  echo "== Suspect listeners =="
  for p in 19876 50098; do
    echo "-- :$p --"
    /usr/sbin/lsof -nP -iTCP:${p} -sTCP:LISTEN || echo "not listening"
  done

  echo
  echo "== LaunchAgent status =="
  UID_NUM=$(id -u)
  launchctl print-disabled "gui/${UID_NUM}" 2>/dev/null | grep -i 'mythos\.scratchpad' || echo "no disabled entry found"
}

fix() {
  echo "[1/4] Killing known offender commands..."
  pkill -f 'security dump-keychain' || true
  pkill -f 'stash list|/.local/bin/stash' || true
  pkill -f 'setup_google_auth.py' || true
  pkill -f '/Users/.*/\.local/share/scratchpad/server.py|\.local/share/scratchpad/server.py' || true

  echo "[2/4] Disabling scratchpad LaunchAgent if present..."
  PLIST="$HOME/Library/LaunchAgents/com.mythos.scratchpad.plist"
  UID_NUM=$(id -u)
  if [[ -f "$PLIST" ]]; then
    launchctl bootout "gui/${UID_NUM}" "$PLIST" 2>/dev/null || true
    launchctl disable "gui/${UID_NUM}/com.mythos.scratchpad" 2>/dev/null || true
  fi

  echo "[3/4] Dismissing SecurityAgent popup (Deny) if visible..."
  osascript -e 'tell application "System Events" to if exists process "SecurityAgent" then tell process "SecurityAgent" to try
    click button "Deny" of window 1
  end try' 2>/dev/null || true

  echo "[4/4] Post-fix listener check..."
  for p in 19876 50098; do
    echo "-- :$p --"
    /usr/sbin/lsof -nP -iTCP:${p} -sTCP:LISTEN || echo "not listening"
  done

  echo "Done."
}

verify() {
  echo "== Remaining offender processes =="
  pgrep -fal 'security dump-keychain|stash list|/.local/bin/stash|setup_google_auth.py|scratchpad/server.py' || echo "none"

  echo
  echo "== Remaining listeners =="
  for p in 19876 50098; do
    echo "-- :$p --"
    /usr/sbin/lsof -nP -iTCP:${p} -sTCP:LISTEN || echo "not listening"
  done
}

case "$MODE" in
  --scan) scan ;;
  --fix) fix ;;
  --verify) verify ;;
  *)
    echo "Usage: $0 [--scan|--fix|--verify]"
    exit 1
    ;;
esac
