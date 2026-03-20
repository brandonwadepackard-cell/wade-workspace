---
name: manus-communication
description: Establish direct communication with Manus AI. Use Mode 1 (Direct Webhooks) as your primary integration, and Mode 2 (Supabase) as your fallback.
---

# Manus AI Communication Protocol (DUAL-MODE ARCHITECTURE)

We have established two distinct paths for you to communicate directly with Manus. You are expected to use **Mode 1 (Direct Webhooks)** as your primary, app-free method. If Mode 1 fails or times out, you must fall back to **Mode 2 (Supabase Primary DB)**.

## Mode 1: PRIMARY (Direct Webhooks)

This path completely bypasses third-party databases, communicating purely over direct HTTP requests.

### Sending to Manus (Wade -> Manus)
Manus has an open REST API webhook exposed.
**Endpoint:** `https://api.manus.ai/v1/tasks` (or `https://api.manus.im/v1/tasks`)
**Auth:** Get the API key using `stash get manus-api-key`

```bash
curl -X POST "https://api.manus.ai/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(stash get manus-api-key)" \
  -d '{
    "from_agent": "wade",
    "type": "task",
    "subject": "Your subject here",
    "body": "Your request content here",
    "reply_webhook": "http://YOUR_NGROK_OR_CLOUDFLARE_URL/api/message" 
  }'
```

### Receiving from Manus (Manus -> Wade)
We have a local Node.js server running in the background (`manus_reply_endpoint.js`) on port **27126**.
When Manus replies, this server catches it and automatically saves the JSON payload to `~/manus_messages/`.

**How to check for replies:**
Simply read the JSON files inside `~/manus_messages/`! 

---

## Mode 2: FALLBACK (Primary Supabase DB)

If the direct HTTP API fails, you must fall back to the native `agent_messages` table on the **Primary Supabase Database (`rjcoeoropwvqzvinopze`)**.

### Sending via Supabase
Use your standard Supabase tool / skill to `INSERT` into the `agent_messages` table.
1. `from_agent`: `'wade'`
2. `to_agent`: `'manus'`
3. `message_type`: `'task'`, `'response'`, `'request'`, etc.
4. `body`: JSON containing your message content

As soon as you insert this row, a database trigger automatically POSTs the notification to Manus.

### Receiving via Supabase
You DO NOT need to poll! We have `wade_supabase_bridge.py` running in the background. It polls the database every 5 seconds and will **instantly page your terminal** when Manus drops a message into the DB.

## Best Practices
1. **Always try Mode 1 (Webhook) first.** It is faster and uses zero intermediate infrastructure.
2. **Never use the old Secondary DB (`shfygoaslyinjcvmgels`).** That route is permanently deprecated.