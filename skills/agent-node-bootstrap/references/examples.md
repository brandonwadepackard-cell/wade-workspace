# Examples

## Real example from 2026-03-16
### Manus presence recovery
**Problem:** Manus woke up cold, had no reliable node behavior, and was over-indexing on relay architecture.

**Bootstrap moves:**
1. Verified the real direct API transport and auth pattern
2. Confirmed existing DB/registry storage already existed
3. Prioritized boot consumption + heartbeat over relay-first architecture
4. Built `manus_session_boot.py` to load memories, unread inbox, queued tasks, and heartbeat
5. Delivered implementation + reassurance via multiple channels

**Outcome:** deploy-ready path from cold visitor to persistent node.

## Trigger phrases
- "this agent starts cold every session"
- "it has no inbox"
- "messages sit forever until someone opens it"
- "make this agent a real node"
- "we need heartbeat / presence / queued task recovery"

## Adjacent use cases
- Codex desktop agent connecting into MYTHOS
- Claude/Cursor side agents that need inbox + registry behavior
- assistant daemons that need to recover missed work after restarts
- any external agent with DB-backed memory + task queues
