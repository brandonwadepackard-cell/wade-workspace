# Research Pipeline — Full Guide for Agents

Use this skill when Brandon or anyone asks you to "research X", "look into Y", or "add X to the knowledge base."

---

## The One Command

```bash
research-superagent "your topic here"
```

That's it. This command:
1. Opens Superagent in Chrome, submits the query
2. Waits for research to complete (~10-15 min, 40-80 sources)
3. Submits output through the normalization pipeline
4. Auto-approves and publishes 2 chunks to Wade RAG
5. Returns artifact_id + confirmation

**JSON output** (for programmatic use):
```bash
research-superagent "topic" --json
```

---

## When Brandon Says "Research X"

Do all of these without asking:
1. Run `research-superagent "X"`
2. Wait for it to finish (it will — don't interrupt)
3. Report back: artifact_id, confidence score, rag_published status

---

## Checking Pipeline Status

```bash
# What's in the pipeline right now?
curl -s -X POST https://rjcoeoropwvqzvinopze.supabase.co/functions/v1/research-control \
  -H "x-api-key: $(stash get research-control-key)" \
  -H "x-caller: wade" \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'

# List recent artifacts
curl -s -X POST https://rjcoeoropwvqzvinopze.supabase.co/functions/v1/research-control \
  -H "x-api-key: $(stash get research-control-key)" \
  -H "x-caller: wade" \
  -H "Content-Type: application/json" \
  -d '{"action":"list","status":"approved","limit":5}'
```

---

## Submitting Your Own Research (no Superagent)

If you already have research text (from your own web search or knowledge):

```bash
curl -s -X POST https://rjcoeoropwvqzvinopze.supabase.co/functions/v1/research-control \
  -H "x-api-key: $(stash get research-control-key)" \
  -H "x-caller: wade" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "submit",
    "query": "your research question",
    "raw_output": "your research text here (min 50 chars)",
    "priority": "normal",
    "requested_by": "wade"
  }'
```

Pipeline auto-normalizes, scores confidence (0.65 floor), and publishes to RAG if approved.

---

## Getting Your API Key

If you don't have the research-control-key yet, send a credential_request to bahir:

```json
{
  "message_type": "request",
  "subject": "credential_request",
  "body": {"key_label": "research-control-key"}
}
```

Bahir's router (Rule 1.5) auto-serves it from the allowlist.

---

## Requirements

- `superagent.com` must be open and logged in in Chrome on Brandon's Mac
- `chrome-cli` must be installed (`brew install chrome-cli`)
- The research pipeline edge functions must be live (they always are)

---

## Failure Modes

| Error | Fix |
|-------|-----|
| "No Superagent tab found" | Open superagent.com in Chrome and log in |
| "Textarea not found" | Superagent UI changed — tell bahir |
| Timeout after 15 min | Superagent was slow, check the tab manually |
| confidence < 0.65 | Research was low quality, try a more specific query |

---

## Log File

All research runs are logged to `~/.openclaw/logs/superagent-research.log` (JSON, one line per run).
