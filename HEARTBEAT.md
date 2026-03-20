# HEARTBEAT.md

# Add tasks below when you want the agent to check something periodically.

This file is intentionally minimal.
Wade is no longer running autonomous communication or ecosystem polling loops by default.

## Allowed Heartbeat

- verify the local OpenClaw gateway is healthy when asked
- verify the local Wade REST bridge is healthy when asked
- verify the Glass Brain log file is writable when asked

## Disallowed by Default

- polling `agent_messages`
- sending heartbeats to other agents
- proactive coordination loops
- autonomous project scanning
