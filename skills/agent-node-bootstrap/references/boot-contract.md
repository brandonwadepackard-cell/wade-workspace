# Boot Contract

## Required checks on every boot

### 1. Memories
Read recent agent-specific memories first.
Purpose: identity + continuity.

### 2. Inbox
Query unread messages addressed to the agent.
Purpose: recover missed work while offline.

### 3. Queued tasks
Query bridge/task table for queued work assigned to the agent.
Purpose: recover assigned jobs that are not plain messages.

### 4. Registry status
Patch `agent_registry` with:
- `status = active`
- `last_heartbeat = <now>`

## Heartbeat contract
While session is active:
- patch heartbeat every 300 seconds
- keep status active
- log failures, do not silently stop

## Proof test
1. send one message while agent is offline
2. queue one task while agent is offline
3. boot the agent
4. verify both show up in boot summary
5. verify heartbeat updates within 5 minutes

## Architecture warning
If the shared DB already stores unread messages and queued tasks, a relay may be optional. Don’t build extra infrastructure until the boot path is proven insufficient.
