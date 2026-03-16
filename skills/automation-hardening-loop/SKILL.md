---
name: automation-hardening-loop
description: Harden an existing automation or ingestion pipeline without redesigning it. Use when a prototype already works but needs runtime stability, dependency isolation, provider fallback, self-ingestion/source-scope cleanup, scheduling, and proof-based validation.
---

# Automation Hardening Loop

Use this skill when the right move is **make the current tool reliable**, not redesign the architecture.

## Core rule
Start from the working prototype and harden in this order:
1. runtime stability
2. provider/dependency fallback
3. source-scope + self-ingestion protection
4. runner/scheduler wiring
5. proof-based validation

## Workflow

### 1. Lock scope
- Identify the existing tool/script/project that already works.
- Do **not** drift into rebuilding the whole system unless the current tool is fundamentally broken.

### 2. Stabilize runtime first
- Add or verify dependency manifest (`requirements.txt`, etc.).
- Add bootstrap/setup script for `.venv` or equivalent.
- Make the run path deterministic.

### 3. Make failures non-fatal
- Optional providers must degrade gracefully.
- Missing keys, missing modules, or exhausted credits should not kill the whole pipeline.
- Prefer degraded mode with explicit reporting over hard failure.

### 4. Stop self-poisoning
- Remove generated outputs, reports, archives, and handoff folders from default scan roots.
- Block self-generated path patterns explicitly.
- Reward real source paths, not output/documentation paths.

### 5. Wire the runner
- Add a wrapper script with logging and overlap protection.
- Add scheduler wiring only after the pipeline is clean enough to trust.
- Prefer launchd/cron over ad hoc manual triggering.

### 6. Validate with evidence
Use live proof, not assumptions:
- bootstrap/setup succeeds
- tests pass
- dry run produces sane candidates
- real run completes cleanly when safe
- logs + reports confirm behavior

## Tool integration
- Use `exec` for bootstrap, tests, dry-runs, logs, scheduler wiring, and live validation.
- Use `edit`/`write` for deterministic patches to runner scripts, config, and filters.
- Use `sessions_spawn` with `runtime="acp"` when the hardening requires broad multi-file work in an existing codebase.
- Use `browser` only when the automation depends on a real web UI flow that cannot be replaced with direct API/database access.

## Read next when needed
- `references/checklist.md` — exact hardening sequence
- `references/validation-pattern.md` — how to validate without lying to yourself
- `references/examples.md` — real examples and trigger phrases
