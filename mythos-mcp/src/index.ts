import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { z } from "zod";

const env = {
  // Transport
  mcpTransport: (process.env.MCP_TRANSPORT ?? "http").toLowerCase(), // http | stdio
  mcpHost: process.env.MCP_HOST ?? "127.0.0.1",
  mcpPort: Number(process.env.MCP_PORT ?? 7777),

  // Mythos / flows
  mythosFlowUrl: process.env.MYTHOS_FLOW_URL,
  mythosApiKey: process.env.MYTHOS_API_KEY,

  // Wade endpoint compatibility
  wadeAgentUrl: process.env.WADE_AGENT_URL ?? process.env.WADE_URL,
  wadeApiKey: process.env.WADE_API_KEY,

  // Supabase relay compatibility
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  supabaseCommandRelayRpc: process.env.SUPABASE_COMMAND_RELAY_RPC ?? "command_relay",
  supabaseRelayUrl: process.env.SUPABASE_RELAY_URL,

  // Perplexity
  perplexityApiKey: process.env.PERPLEXITY_API_KEY,
  perplexityModel: process.env.PERPLEXITY_MODEL ?? "sonar-pro",
};

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

function buildServer(): McpServer {
  const server = new McpServer({
    name: "mythos",
    version: "0.2.0",
  });

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
        env.mythosApiKey
          ? {
              "X-API-Key": env.mythosApiKey,
              Authorization: `Bearer ${env.mythosApiKey}`,
            }
          : undefined,
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
      const url = assertEnv(env.wadeAgentUrl, "WADE_AGENT_URL (or WADE_URL)");

      const raw = await postJson<Record<string, unknown>>(
        url,
        { agent_id, query, metadata: metadata ?? {} },
        env.wadeApiKey ? { Authorization: `Bearer ${env.wadeApiKey}` } : undefined,
      );

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
      description: "Execute a command on the Mac via Supabase relay endpoint or RPC.",
      inputSchema: {
        command: z.string().describe("Shell or high-level command for Mac"),
        tags: z.array(z.string()).optional().describe("Optional tags for logging/routing"),
      },
    },
    async ({ command, tags }) => {
      const payload = { command, tags: tags ?? [] };

      // 1) Direct relay URL mode (matches your snippet)
      if (env.supabaseRelayUrl) {
        const key = env.supabaseServiceKey ?? env.supabaseAnonKey;
        const result = await postJson<Record<string, unknown>>(
          env.supabaseRelayUrl,
          payload,
          key ? { apikey: key, Authorization: `Bearer ${key}` } : undefined,
        );

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: {
            status: (result.status as string) ?? "submitted",
            stdout: (result.stdout as string) ?? "",
            stderr: (result.stderr as string) ?? "",
            raw: result,
          },
        };
      }

      // 2) Supabase RPC mode
      const supabaseUrl = assertEnv(env.supabaseUrl, "SUPABASE_URL").replace(/\/$/, "");
      const key = env.supabaseServiceKey ?? env.supabaseAnonKey;
      const supabaseKey = assertEnv(key, "SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY");

      const rpcPath = `/rest/v1/rpc/${env.supabaseCommandRelayRpc}`;
      const result = await postJson<Record<string, unknown>>(
        `${supabaseUrl}${rpcPath}`,
        payload,
        {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
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

  return server;
}

async function startStdio() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function startHttp() {
  const app = createMcpExpressApp();

  const handleMcp = async (req: Parameters<typeof app.post>[1] extends (path: any, ...handlers: infer H) => any ? any : any, res: any) => {
    const server = buildServer();

    try {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);

      res.on("close", () => {
        transport.close();
        server.close();
      });
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  };

  // Support both base URL and /mcp URL for connector flexibility
  app.post("/", handleMcp);
  app.post("/mcp", handleMcp);

  app.get("/health", (_req: any, res: any) => {
    res.json({
      status: "ok",
      name: "mythos",
      transport: "http",
      port: env.mcpPort,
      tools: ["run_flow", "query_wade_agent", "relay_mac_command", "query_perplexity"],
    });
  });

  app.listen(env.mcpPort, env.mcpHost, () => {
    // eslint-disable-next-line no-console
    console.log(`mythos-mcp HTTP listening on http://${env.mcpHost}:${env.mcpPort}`);
    // eslint-disable-next-line no-console
    console.log(`MCP endpoints: POST / and POST /mcp`);
  });
}

async function main() {
  if (env.mcpTransport === "stdio") return startStdio();
  return startHttp();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("mythos-mcp fatal error:", err);
  process.exit(1);
});
