# mythos-mcp

Minimal production-ready MCP server for Mythos with Perplexity integration.

## Tools included

1. `run_flow`
   - Calls LangGraph flow invoke endpoint
   - Default target: `POST {MYTHOS_FLOW_URL}/graphs/{flow_id}/invoke`

2. `query_wade_agent`
   - Calls WADE agent/KB endpoint
   - Default target: `POST {WADE_AGENT_URL}`

3. `relay_mac_command`
   - Uses Supabase RPC command relay bridge
   - Default target: `POST {SUPABASE_URL}/rest/v1/rpc/{SUPABASE_COMMAND_RELAY_RPC}`

4. `query_perplexity`
   - Calls Perplexity Chat Completions API
   - Target: `POST https://api.perplexity.ai/chat/completions`

---

## Quick start

```bash
cd mythos-mcp
cp .env.example .env
# Fill in keys/endpoints in .env
npm install
npm run build
npm run dev
```

This server uses stdio transport for MCP clients.

---

## Required env

- `MYTHOS_FLOW_URL` (e.g. `http://127.0.0.1:8100`)
- `WADE_AGENT_URL` (your WADE query endpoint)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_COMMAND_RELAY_RPC` (default: `command_relay`)
- `PERPLEXITY_API_KEY`
- `PERPLEXITY_MODEL` (default: `sonar-pro`)

---

## OpenClaw / MCP config example

```json
{
  "mcpServers": {
    "mythos": {
      "command": "node",
      "args": ["/Users/brandonpackard/.openclaw/workspace/mythos-mcp/dist/index.js"],
      "env": {
        "MYTHOS_FLOW_URL": "http://127.0.0.1:8100",
        "WADE_AGENT_URL": "http://127.0.0.1:8787/query",
        "SUPABASE_URL": "https://rjcoeoropwvqzvinopze.supabase.co",
        "SUPABASE_ANON_KEY": "<key>",
        "SUPABASE_COMMAND_RELAY_RPC": "command_relay",
        "PERPLEXITY_API_KEY": "<key>",
        "PERPLEXITY_MODEL": "sonar-pro"
      }
    }
  }
}
```

---

## Notes

- If your flow endpoint is not `/graphs/{flow_id}/invoke`, adapt `run_flow` in `src/index.ts`.
- If your command relay RPC expects different payload fields, adapt `relay_mac_command` payload shape.
- Perplexity responses are returned as both text content and `structuredContent.raw`.
