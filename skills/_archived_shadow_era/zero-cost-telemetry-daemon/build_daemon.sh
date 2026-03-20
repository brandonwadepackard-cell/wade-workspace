#!/bin/bash
cd /Users/brandonpackard/.openclaw/workspace/skills/zero-cost-telemetry-daemon

echo "Compiling Pure AppleScript to application bundle (No Python Containerizing)..."
osacompile -o SwarmTelemetry.app screencapture.applescript

echo "Injecting LSUIElement=true into Info.plist for stealth execution..."
plutil -insert LSUIElement -bool true SwarmTelemetry.app/Contents/Info.plist

echo "Re-signing SwarmTelemetry.app immutably..."
codesign -f -s - SwarmTelemetry.app

echo "SwarmTelemetry.app build complete. TCC Attribution is now exclusively bound to this immutable wrapper."
