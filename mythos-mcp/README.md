# mythos-mcp

Mythos MCP server with Perplexity integration and 4 tools:

- `run_flow`
- `query_wade_agent`
- `relay_mac_command`
- `query_perplexity`

It supports both:
- **HTTP MCP mode** (best for Perplexity connector): `MCP_TRANSPORT=http`
- **stdio mode** for classic local MCP clients: `MCP_TRANSPORT=stdio`

---

## Install

```bash
cd /Users/brandonpackard/.openclaw/workspace/mythos-mcp
cp .env.example .env
# fill .env
npm install
npm run build
```

---

## Run (HTTP mode for Perplexity)

```bash
MCP_TRANSPORT=http npm run start
# health
curl http://127.0.0.1:7777/health
```

MCP endpoints are available at:
- `POST /`
- `POST /mcp`

---

## Perplexity connector manifest example

```json
{
  "name": "Mythos",
  "description": "Control Mythos / Mission Control via tools.",
  "server": {
    "type": "http",
    "url": "http://127.0.0.1:7777/mcp"
  }
}
```

If Perplexity expects base URL only, use `http://127.0.0.1:7777` (both `/` and `/mcp` are supported).

---

## Env vars

### Transport
- `MCP_TRANSPORT` = `http` or `stdio`
- `MCP_HOST` (default `127.0.0.1`)
- `MCP_PORT` (default `7777`)

### run_flow
- `MYTHOS_FLOW_URL` (e.g. `http://127.0.0.1:8100`)
- `MYTHOS_API_KEY` (optional bearer auth)

### query_wade_agent
- `WADE_AGENT_URL` (or `WADE_URL`)
- `WADE_API_KEY` (optional bearer auth)

### relay_mac_command
Two modes:
1) Direct relay URL:
   - `SUPABASE_RELAY_URL`
   - `SUPABASE_SERVICE_KEY` or `SUPABASE_ANON_KEY`

2) Supabase RPC:
   - `SUPABASE_URL`
   - `SUPABASE_COMMAND_RELAY_RPC` (default `command_relay`)
   - `SUPABASE_SERVICE_KEY` or `SUPABASE_ANON_KEY`

### query_perplexity
- `PERPLEXITY_API_KEY`
- `PERPLEXITY_MODEL` (default `sonar-pro`)

---

## Tool behavior summary

### run_flow
`POST {MYTHOS_FLOW_URL}/graphs/{flow_id}/invoke`

### query_wade_agent
`POST {WADE_AGENT_URL}` with body:
```json
{ "agent_id": "...", "query": "...", "metadata": {} }
```

### relay_mac_command
If `SUPABASE_RELAY_URL` set:
`POST {SUPABASE_RELAY_URL}`

Else:
`POST {SUPABASE_URL}/rest/v1/rpc/{SUPABASE_COMMAND_RELAY_RPC}`

### query_perplexity
`POST https://api.perplexity.ai/chat/completions`

---

## Example prompts (from Perplexity chat)

- “Run the `daily_content_pipeline` flow with today’s date.”
- “Ask the `sales_researcher` agent for 10 leads in Utah in solar.”
- “Run `brew update` on the Mac Studio via Mythos.”
