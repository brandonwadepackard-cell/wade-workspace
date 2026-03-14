import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const env = {
  mythosFlowUrl: process.env.MYTHOS_FLOW_URL,
  wadeAgentUrl: process.env.WADE_AGENT_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseCommandRelayRpc: process.env.SUPABASE_COMMAND_RELAY_RPC ?? "command_relay",
  perplexityApiKey: process.env.PERPLEXITY_API_KEY,
  perplexityModel: process.env.PERPLEXITY_MODEL ?? "sonar-pro",
};

const server = new McpServer({
  name: "mythos",
  version: "0.1.0",
});

function assertEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function postJson<TResponse>(url: string, payload: unknown, headers?: Record<string, string>): Promise<TResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(`POST ${url} failed (${res.status}): ${text}`);
  }

  return data as TResponse;
}

server.registerTool(
  "run_flow",
  {
    title: "Run Mythos Flow",
    description: "Run a Mythos / Mission Control LangGraph flow by flow_id.",
    inputSchema: {
      flow_id: z.string().describe("ID or slug of the LangGraph/Mission Control flow"),
      params: z.record(z.any()).optional().describe("Flow-specific parameters"),
    },
  },
  async ({ flow_id, params }) => {
    const base = assertEnv(env.mythosFlowUrl, "MYTHOS_FLOW_URL").replace(/\/$/, "");

    const result = await postJson<Record<string, unknown>>(
      `${base}/graphs/${encodeURIComponent(flow_id)}/invoke`,
      params ?? {},
    );

    return {
      content: [{ type: "text", text: JSON.stringify({ status: "ok", result }, null, 2) }],
      structuredContent: { status: "ok", result },
    };
  },
);

server.registerTool(
  "query_wade_agent",
  {
    title: "Query WADE Agent",
    description: "Query a WADE agent or KB endpoint.",
    inputSchema: {
      agent_id: z.string().describe("WADE agent or KB identifier"),
      query: z.string().describe("User query or instruction"),
      metadata: z.record(z.any()).optional().describe("Optional context like user id, session id"),
    },
  },
  async ({ agent_id, query, metadata }) => {
    const url = assertEnv(env.wadeAgentUrl, "WADE_AGENT_URL");

    const raw = await postJson<Record<string, unknown>>(url, {
      agent_id,
      query,
      metadata: metadata ?? {},
    });

    const answer =
      (typeof raw.answer === "string" && raw.answer) ||
      (typeof raw.result === "string" && raw.result) ||
      JSON.stringify(raw);

    return {
      content: [{ type: "text", text: answer }],
      structuredContent: { answer, raw },
    };
  },
);

server.registerTool(
  "relay_mac_command",
  {
    title: "Relay Mac Command",
    description: "Execute a command on the Mac via Supabase command relay RPC.",
    inputSchema: {
      command: z.string().describe("Shell or high-level command for Mac"),
      tags: z.array(z.string()).optional().describe("Optional tags for logging/routing"),
    },
  },
  async ({ command, tags }) => {
    const supabaseUrl = assertEnv(env.supabaseUrl, "SUPABASE_URL").replace(/\/$/, "");
    const supabaseAnonKey = assertEnv(env.supabaseAnonKey, "SUPABASE_ANON_KEY");

    const rpcPath = `/rest/v1/rpc/${env.supabaseCommandRelayRpc}`;
    const result = await postJson<Record<string, unknown>>(
      `${supabaseUrl}${rpcPath}`,
      { command, tags: tags ?? [] },
      {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    );

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
);

server.registerTool(
  "query_perplexity",
  {
    title: "Query Perplexity",
    description: "Ask Perplexity for web-augmented answers and citations.",
    inputSchema: {
      query: z.string().describe("Question for Perplexity"),
      system: z.string().optional().describe("Optional system prompt"),
      temperature: z.number().min(0).max(2).optional(),
      max_tokens: z.number().int().positive().optional(),
    },
  },
  async ({ query, system, temperature, max_tokens }) => {
    const apiKey = assertEnv(env.perplexityApiKey, "PERPLEXITY_API_KEY");

    const payload = {
      model: env.perplexityModel,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: query },
      ],
      ...(temperature !== undefined ? { temperature } : {}),
      ...(max_tokens !== undefined ? { max_tokens } : {}),
    };

    const raw = await postJson<Record<string, unknown>>(
      "https://api.perplexity.ai/chat/completions",
      payload,
      {
        Authorization: `Bearer ${apiKey}`,
      },
    );

    const answer =
      Array.isArray(raw.choices) &&
      raw.choices.length > 0 &&
      typeof raw.choices[0] === "object" &&
      raw.choices[0] !== null &&
      typeof (raw.choices[0] as { message?: { content?: string } }).message?.content === "string"
        ? (raw.choices[0] as { message: { content: string } }).message.content
        : JSON.stringify(raw);

    return {
      content: [{ type: "text", text: answer }],
      structuredContent: { answer, raw },
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("mythos-mcp fatal error:", err);
  process.exit(1);
});
