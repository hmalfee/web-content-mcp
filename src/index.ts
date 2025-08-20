#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { WebSearchArgsSchema, FetchWebpageArgsSchema } from "./types";
import { WebSearch, FetchWebpage } from "./tools";

function createServer(): Server {
  const server = new Server(
    { name: "web-content-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  const webSearchInstance = new WebSearch();
  const fetchWebpageInstance = new FetchWebpage();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [WebSearch.getToolDescription(), FetchWebpage.getToolDescription()],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;

    try {
      if (name === "web_search") {
        const args = WebSearchArgsSchema.parse(request.params.arguments);
        const results = await webSearchInstance.execute(args);
        return { content: [{ type: "text", text: results }] };
      }

      if (name === "fetch_webpage") {
        const args = FetchWebpageArgsSchema.parse(request.params.arguments);
        const results = await fetchWebpageInstance.execute(args);
        return { content: [{ type: "text", text: results }] };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

async function start(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Web Content MCP Server running on stdio");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
