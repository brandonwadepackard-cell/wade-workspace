#!/usr/bin/env bash
# wade-probe.sh — Live JSON diagnostic snapshot for Wade
# Outputs a single JSON object to stdout. Errors go to stderr.
set -o pipefail

SUPABASE_URL="https://rjcoeoropwvqzvinopze.supabase.co"
TIMEOUT=5

# --- Helpers ---

get_anon_key() {
  security find-generic-password -a "brandonpackard" -s "stash.supabase-primary-anon" -w 2>/dev/null
}

check_stash_key() {
  security find-generic-password -a "brandonpackard" -s "stash.$1" -w >/dev/null 2>&1
  if [ $? -eq 0 ]; then echo "true"; else echo "false"; fi
}

supabase_count() {
  local table="$1"
  local key="$2"
  local result
  result=$(curl -s --max-time "$TIMEOUT" \
    -H "apikey: ${key}" \
    -H "Authorization: Bearer ${key}" \
    -H "Prefer: count=exact" \
    -H "Range: 0-0" \
    "${SUPABASE_URL}/rest/v1/${table}?select=id" \
    -o /dev/null -w '%{http_code}:%header{content-range}' 2>/dev/null)

  local http_code="${result%%:*}"
  local range="${result#*:}"

  if [ "$http_code" = "200" ] || [ "$http_code" = "206" ]; then
    # content-range looks like: 0-0/1234 or */0
    local count="${range##*/}"
    if [ -n "$count" ] && [ "$count" != "" ]; then
      echo "$count"
    else
      echo "error:parse_failed"
    fi
  else
    echo "error:http_${http_code}"
  fi
}

# --- Gather data ---

ANON_KEY=$(get_anon_key)
if [ -z "$ANON_KEY" ]; then
  echo '{"error":"Failed to retrieve supabase-primary-anon key from keychain"}' >&2
  ANON_KEY="MISSING"
fi

# 1. Services
gateway_status=$(curl -s -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" http://127.0.0.1:18789 2>/dev/null || echo "unreachable")
rag_status=$(curl -s -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "${SUPABASE_URL}/functions/v1/wade-rag-search" 2>/dev/null || echo "unreachable")

# 2. Table counts
wade_memories_count=$(supabase_count "wade_memories" "$ANON_KEY")
mentor_chunks_count=$(supabase_count "mentor_chunks" "$ANON_KEY")
mentor_principles_count=$(supabase_count "mentor_principles" "$ANON_KEY")
wade_knowledge_vault_count=$(supabase_count "wade_knowledge_vault" "$ANON_KEY")
agent_messages_count=$(supabase_count "agent_messages" "$ANON_KEY")

# 3. Registry — wade's entry
registry_raw=$(curl -s --max-time "$TIMEOUT" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  "${SUPABASE_URL}/rest/v1/agent_registry?agent_id=eq.wade&select=status,last_heartbeat,capabilities" 2>/dev/null)

if echo "$registry_raw" | jq -e '.[0]' >/dev/null 2>&1; then
  registry_json=$(echo "$registry_raw" | jq '.[0]')
else
  registry_json=$(jq -n --arg err "query_failed: ${registry_raw}" '{"error": $err}')
fi

# 4. Memory health — null embeddings
null_embed_raw=$(curl -s --max-time "$TIMEOUT" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Prefer: count=exact" \
  -H "Range: 0-0" \
  "${SUPABASE_URL}/rest/v1/wade_memories?select=id&embedding=is.null" \
  -o /dev/null -w '%{http_code}:%header{content-range}' 2>/dev/null)

null_http="${null_embed_raw%%:*}"
null_range="${null_embed_raw#*:}"
if [ "$null_http" = "200" ] || [ "$null_http" = "206" ]; then
  null_embedding_count="${null_range##*/}"
else
  null_embedding_count="error:http_${null_http}"
fi

# 5. Stash key existence
stash_anon=$(check_stash_key "supabase-primary-anon")
stash_gemini=$(check_stash_key "gemini-api-key")
stash_xai=$(check_stash_key "xai-api-key")
stash_brave=$(check_stash_key "brave-api-key")
stash_wade_rag=$(check_stash_key "wade-rag-api-key")

# 6. Timestamp
ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# --- Build JSON ---

jq -n \
  --arg gw "$gateway_status" \
  --arg rag "$rag_status" \
  --arg wm "$wade_memories_count" \
  --arg mc "$mentor_chunks_count" \
  --arg mp "$mentor_principles_count" \
  --arg wkv "$wade_knowledge_vault_count" \
  --arg am "$agent_messages_count" \
  --argjson reg "$registry_json" \
  --arg nullemb "$null_embedding_count" \
  --argjson s_anon "$stash_anon" \
  --argjson s_gemini "$stash_gemini" \
  --argjson s_xai "$stash_xai" \
  --argjson s_brave "$stash_brave" \
  --argjson s_rag "$stash_wade_rag" \
  --arg ts "$ts" \
'{
  "services": {
    "openclaw_gateway": {"url": "http://127.0.0.1:18789", "http_status": $gw},
    "wade_rag_edge_fn": {"url": "https://rjcoeoropwvqzvinopze.supabase.co/functions/v1/wade-rag-search", "http_status": $rag}
  },
  "tables": {
    "wade_memories": $wm,
    "mentor_chunks": $mc,
    "mentor_principles": $mp,
    "wade_knowledge_vault": $wkv,
    "agent_messages": $am
  },
  "registry": $reg,
  "memory_health": {
    "null_embeddings": $nullemb
  },
  "stash": {
    "supabase-primary-anon": $s_anon,
    "gemini-api-key": $s_gemini,
    "xai-api-key": $s_xai,
    "brave-api-key": $s_brave,
    "wade-rag-api-key": $s_rag
  },
  "timestamp": $ts
}'
