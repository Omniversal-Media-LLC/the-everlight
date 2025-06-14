import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
	});

        async init() {
		// Simple addition tool
		this.server.tool(
			"add",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => ({
				content: [{ type: "text", text: String(a + b) }],
			})
		);

		// Calculator tool with multiple operations
                this.server.tool(
                        "calculate",
                        {
                                operation: z.enum(["add", "subtract", "multiply", "divide"]),
                                a: z.number(),
                                b: z.number(),
                        },
                        async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
                                return { content: [{ type: "text", text: String(result) }] };
                        }
                );

                // Retrieve a text file from Cloudflare R2
                this.server.tool(
                        "r2_get",
                        { key: z.string() },
                        async ({ key }) => {
                                const obj = await this.env.BUCKET.get(key);
                                if (!obj) return { content: [{ type: "text", text: "Not found" }] };
                                const text = await obj.text();
                                return { content: [{ type: "text", text }] };
                        }
                );

                // Execute a SQL query against Cloudflare D1
                this.server.tool(
                        "db_query",
                        { sql: z.string() },
                        async ({ sql }) => {
                                const result = await this.env.DB.prepare(sql).all();
                                return { content: [{ type: "json", json: result }] };
                        }
                );

                // Search embeddings via Cloudflare Vectorize
                this.server.tool(
                        "vector_search",
                        { query: z.string(), topK: z.number().optional() },
                        async ({ query, topK = 3 }) => {
                                const matches = await this.env.VECTORIZE.query(query, {
                                        topK,
                                });
                                return { content: [{ type: "json", json: matches }] };
                        }
                );
        }
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			// @ts-ignore
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			// @ts-ignore
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
