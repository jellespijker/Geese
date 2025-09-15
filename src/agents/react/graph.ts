import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

const model = new ChatGoogleGenerativeAI({ model: "gemini-2.5-flash" });

const client = new MultiServerMCPClient({
  throwOnLoadError: true,
  prefixToolNameWithServerName: true,
  additionalToolNamePrefix: "mcp",
  mcpServers: {
    time: {
      url: `${process.env.JASON_ENDPOINT}/v0/mcps/time/mcp`,
      transport: "http",
    },
  },
});

const tools = await client.getTools();

export const graph = createReactAgent({ llm: model, tools });
