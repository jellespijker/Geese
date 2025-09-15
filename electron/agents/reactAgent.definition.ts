/**
 * React MCP Agent Definition
 * Demonstrates combining MCP-provided tools and generic protocol tools
 * (A2A + MCP client tools) inside a LangGraph React agent graph.
 */
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { LLMStrategy } from '../llm/llmStrategy';
import { AgentDefinition } from '../core/types';
import { createA2AClientTool } from '../protocols/a2a-client-tool';
import { createMCPClientTool } from '../protocols/mcp-client-tool';

export const agent: AgentDefinition = {
  name: 'React MCP Agent',
  description: 'General-purpose agent with MCP tools + generic A2A & MCP protocol tools.',
  capabilities: ['general', 'mcp', 'a2a-proxy'],
  async createGraph(llm: LLMStrategy) {
    const base = process.env.JASON_ENDPOINT?.replace(/\/$/, '') || '';
    const client = new MultiServerMCPClient({
      throwOnLoadError: true,
      prefixToolNameWithServerName: true,
      additionalToolNamePrefix: 'mcp',
      mcpServers: base ? {
        time: { url: `${base}/v0/mcps/time/mcp`, transport: 'http' },
      } : {},
    });

    const mcpTools = await client.getTools();

    // Generic protocol tools
    const protocolTools = [
      createA2AClientTool(),
      createMCPClientTool(),
    ];

    return createReactAgent({ llm, tools: [...mcpTools, ...protocolTools] });
  },
};

export default agent;
