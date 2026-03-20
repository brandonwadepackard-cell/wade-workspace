---
name: memory-distiller
description: Rewrites dense recent Wade execution-log memories into conversational diary-form so boot context stays human-readable without losing core facts. Also provides an on-demand Mythos status summarizer for system questions.
---

# Memory Distiller

## Purpose

This skill keeps Wade's boot-time memory usable by rewriting recent, highly technical execution-log memories into conversational prose.

It does not rewrite the whole memory corpus.
It targets recent rows that are likely to pollute startup context.

## Components

- `memory_distiller.py`
  - polls `wade_memories`
  - scores recent rows for execution-log density
  - rewrites qualifying rows with Gemini
  - patches them back through Supabase
  - writes a local backup before every mutation
- `read_mythos_status.py`
  - prints a compact summary of `~/command-center/STATUS.md`
  - use only when explicitly asked about systems
- `install_launch_agent.sh`
  - installs and starts the LaunchAgent

## Rules

- Do not run on the full historical corpus.
- Do not rewrite old evergreen identity or preference memories unless they become recent inputs again.
- Always back up the original row content before patching.
- Launch cadence belongs in `launchd`, not in a custom infinite loop.

## Verification

- `launchctl print gui/$(id -u)/com.wade.memory-distiller`
- `tail -n 20 ~/.openclaw/logs/memory-distiller.log`
- `python3 ~/.openclaw/workspace/skills/memory-distiller/read_mythos_status.py`

## Recovery

- back up originals live in `backups/YYYY-MM-DD.jsonl`
- state tracking lives in `state.json`
- reinstall the agent with `bash install_launch_agent.sh`
