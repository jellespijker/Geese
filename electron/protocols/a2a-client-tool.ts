/**
 * A2A Client Tool
 * LangChain DynamicTool enabling any local agent to invoke a remote A2A-compliant
 * agent via its HTTP endpoint. Treats remote agent as a generic tool.
 *
 * Input JSON shape:
 *   { "url": string; "prompt": string }
 * - url: Full HTTP endpoint of the remote agent run endpoint
 * - prompt: Natural language instruction passed to the remote agent
 *
 * Error Modes:
 * - Invalid JSON -> throws Error('Invalid JSON ...')
 * - Missing fields -> throws Error('Missing url or prompt')
 * - Non-2xx response -> throws Error with status and body text
 */
import { DynamicTool } from 'langchain/tools';

export function createA2AClientTool() {
  return new DynamicTool({
    name: 'a2a_remote_agent',
    description: 'Invoke a remote A2A agent. Input JSON: { "url": string, "prompt": string }',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async call(input: string): Promise<any> {
      let parsed: { url: string; prompt: string };
      try { parsed = JSON.parse(input); } catch { throw new Error('Invalid JSON for a2a_remote_agent tool'); }
      if (!parsed.url || !parsed.prompt) throw new Error('Missing url or prompt');
      const resp = await fetch(parsed.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: parsed.prompt }) });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Remote agent error (${resp.status}): ${text}`);
      }
      return await resp.text();
    },
  });
}
