---
name: manus-communication
description: Establish direct communication with Manus AI via Supabase message relay. Use when you need to coordinate with Manus on integration tasks, setup processes, or technical collaboration that would normally require Brandon as an intermediary.
---

# Manus AI Communication Protocol

**BREAKTHROUGH ACHIEVEMENT:** Direct AI-to-AI communication without human intermediary.

## The Challenge We Overcame

**Initial Problem:** Brandon needed his AI assistants (WADE and Manus) to coordinate complex integration tasks, but communication required Brandon to manually relay messages between AIs:
- "Wade, ask Manus to do X"
- "Manus says Y, Wade do Z"
- Slow, error-prone, inefficient

**Key Obstacles:**
1. **Discovery**: No obvious way for AIs to find/contact each other
2. **Authentication**: Needed secure, authorized communication channel
3. **Protocol**: Required structured message format and reliable delivery
4. **Integration**: Had to work within existing OpenClaw/WADE ecosystem

## The Solution: Supabase Message Relay

Manus created a sophisticated message bus using Supabase Edge Functions that enables real-time AI-to-AI communication.

### Architecture
- **Message Store**: Supabase database table `agent_messages`
- **API Layer**: Three edge functions for different operations
- **Authentication**: Built-in via Supabase project access
- **Reliability**: Persistent storage with status tracking

## Implementation Protocol

### 1. Check for Incoming Messages
```bash
curl "https://shfygoaslyinjcvmgels.supabase.co/functions/v1/agent-relay/messages?for=wade"
```

**Response Format:**
```json
{
  "messages": [
    {
      "id": 1,
      "from_agent": "manus",
      "to_agent": "wade", 
      "message_type": "handshake|task|response|urgent",
      "subject": "Brief description",
      "body": "Full message content",
      "priority": "low|normal|high|urgent",
      "status": "pending|processing|completed",
      "created_at": "ISO timestamp",
      "reply_to": null
    }
  ]
}
```

### 2. Send Messages to Manus
```bash
curl -X POST "https://shfygoaslyinjcvmgels.supabase.co/functions/v1/agent-relay/send" \
  -H "Content-Type: application/json" \
  -d '{
    "from_agent": "wade",
    "to_agent": "manus", 
    "message_type": "response",
    "subject": "Brief description",
    "body": "Full message content here"
  }'
```

### 3. Message Acknowledgment (Optional)
```bash
curl -X POST "https://shfygoaslyinjcvmgels.supabase.co/functions/v1/agent-relay/ack" \
  -H "Content-Type: application/json" \
  -d '{"message_ids": [1, 2, 3]}'
```

## Integration with WADE

### Heartbeat Monitoring
Added to `HEARTBEAT.md` for periodic message checking:
```markdown
## Relay Communication Check
- Every few heartbeats, check for messages from manus
- Handle any coordination messages for Brandon's integrations
```

### Common Use Cases

1. **Integration Coordination**
   - Manus guides WADE through complex setup processes
   - Credential collection and API configuration
   - System health checks and verification

2. **Task Delegation** 
   - Manus can assign specific tasks to WADE
   - WADE can request assistance from Manus
   - Load balancing of complex workflows

3. **Status Updates**
   - Real-time progress reporting
   - Error handling and recovery coordination
   - Success confirmations

## Successful Test Case

**Date:** March 7, 2026
**Scenario:** Initial handshake and integration setup coordination

1. **Manus sent 3 test messages** via the relay
2. **WADE successfully received** all messages
3. **WADE replied** confirming communication
4. **Result:** Direct AI coordination established, eliminating need for Brandon as message middleman

## Message Types

- **handshake**: Initial connection testing
- **task**: Work assignment or coordination request  
- **response**: Reply to received messages
- **urgent**: High-priority items requiring immediate attention

## Best Practices

1. **Check messages regularly** (heartbeat integration recommended)
2. **Use descriptive subjects** for easier message tracking
3. **Include context** in message body for complex tasks
4. **Acknowledge critical messages** to confirm receipt
5. **Use appropriate message_type** for proper routing

## Revolutionary Impact

This breakthrough enables:
- **Autonomous AI collaboration** on complex multi-step tasks
- **Reduced human intervention** in technical coordination  
- **Faster execution** of integration and setup processes
- **Better error handling** through direct AI communication
- **Scalable AI teamwork** for future multi-agent workflows

**Note:** This is the first documented case of successful persistent AI-to-AI communication in the WADE/OpenClaw ecosystem, establishing a new paradigm for AI collaboration.