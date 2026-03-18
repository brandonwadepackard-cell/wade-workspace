#!/bin/bash
set -euo pipefail

PLIST_SRC="/Users/brandonpackard/.openclaw/workspace/skills/memory-distiller/com.wade.memory-distiller.plist"
PLIST_DST="/Users/brandonpackard/Library/LaunchAgents/com.wade.memory-distiller.plist"
UID_VALUE="$(id -u)"

cp "$PLIST_SRC" "$PLIST_DST"
launchctl bootout "gui/${UID_VALUE}" com.wade.memory-distiller >/dev/null 2>&1 || true
launchctl bootstrap "gui/${UID_VALUE}" "$PLIST_DST"
launchctl kickstart -k "gui/${UID_VALUE}/com.wade.memory-distiller"
echo "Installed and started com.wade.memory-distiller"
