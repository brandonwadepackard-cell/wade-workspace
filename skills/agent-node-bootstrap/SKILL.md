---
name: agent-node-bootstrap
description: Turn an external or desktop agent from a cold-start visitor into a persistent node. Use when an agent needs boot-time context loading, unread inbox checks, queued task consumption, heartbeat automation, and reliable presence in a shared Supabase/agent ecosystem.
---

# Agent Node Bootstrap

Use this skill when an agent can act, but wakes up cold, misses queued work, or has no reliable liveness signal.

## Core rule
Solve **boot consumption + heartbeat** before building extra relay infrastructure.

## Workflow

### 1. Verify the real transport
Check what already works:
- direct agent API / webhook
- shared DB inbox (`agent_messages`)
- task bridge tables
- `agent_registry` row

Do not build a new relay first if the existing DB already stores unread work.

### 2. Implement boot sequence
On session start, the agent should:
1. load recent memories
2. load unread inbox messages
3. load queued assigned tasks
4. mark itself active in registry
5. print a compact boot summary

### 3. Implement heartbeat loop
- patch `agent_registry.last_heartbeat`
- keep `status=active`
- run every 5 minutes unless a different cadence is required

### 4. Prove node behavior
Test this exact pattern:
- queue work while agent is offline
- start the agent
- confirm boot sequence surfaces the queued work
- confirm heartbeat updates

## Tool integration
- Use `exec` to probe APIs, check health, verify registry rows, and run deployment commands.
- Use `sessions_spawn` with `runtime="acp"` when implementation must happen in another code environment or on a larger codebase.
- Use `message` or agent messaging channels to reassure collaborators and confirm deployment steps.
- Use `browser` only if the agent is blocked on an interactive login or web-only dashboard.

## Read next when needed
- `references/boot-contract.md` — required checks and test order
- `references/examples.md` — real examples, trigger phrases, and adjacent use cases
- `scripts/manus_session_boot.py` — deployable example implementation
