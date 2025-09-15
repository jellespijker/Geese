/**
 * MCP Client Tool
 * Generic LangChain DynamicTool that invokes a prompt against a remote MCP server.
 *
 * Input JSON shape:
 *   { "serverUrl": string; "prompt": string }
 * - serverUrl: Base URL of the MCP server (tool adds /invoke suffix currently)
 * - prompt: Natural language or structured input for remote tool context
 *
 * Current Assumption (Phase 3): MCP server exposes a POST <serverUrl>/invoke { prompt }
 * Future Enhancements: dynamic tool enumeration + selection, caching, auth headers.
 *
 * Error Modes:
 * - Invalid JSON -> Error('Invalid JSON ...')
 * - Missing fields -> Error('Missing serverUrl or prompt')
 * - Non-2xx response -> Error('MCP server error (status): body')
 */
import { DynamicTool } from 'langchain/tools';

export function createMCPClientTool() {
  return new DynamicTool({
    name: 'mcp_generic_invoke',
    description: 'Invoke a remote MCP server. Input JSON: { "serverUrl": string, "prompt": string }',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async call(input: string): Promise<any> {
      let parsed: { serverUrl: string; prompt: string };
      try { parsed = JSON.parse(input); } catch { throw new Error('Invalid JSON for mcp_generic_invoke tool'); }
      if (!parsed.serverUrl || !parsed.prompt) throw new Error('Missing serverUrl or prompt');
      const target = parsed.serverUrl.replace(/\/$/, '') + '/invoke';
      const resp = await fetch(target, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: parsed.prompt }) });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`MCP server error (${resp.status}): ${text}`);
      }
      return await resp.text();
    },
  });
}
