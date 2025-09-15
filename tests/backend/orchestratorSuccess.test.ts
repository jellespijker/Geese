import { describe, it, expect } from 'vitest';
import { runAgent } from '../../electron/agentExecutor.orchestrator';
import { registerAgent } from '../../electron/agents/agentRegistry';
import type { AgentDefinition } from '../../electron/core/types';

// Register a minimal deterministic test agent
const testAgent: AgentDefinition = {
  name: 'Test Echo Agent',
  description: 'Emits a final echo result',
  async createGraph() {
    return {
      async *stream() {
        // First event simulates an internal tool call (so orchestrator keeps streaming)
        yield { messages: [{ content: 'Working...', tool_calls: [{}] }] };
        // Second event final output (no tool_calls) triggers result emission
        yield { messages: [{ content: 'Echo: OK', tool_calls: [] }] };
      },
    } as any;
  },
};
registerAgent(testAgent);

async function collect(gen: AsyncGenerator<any>) {
  const out: any[] = [];
  for await (const ev of gen) out.push(ev);
  return out;
}

describe('orchestrator success path', () => {
  it('produces a final result event', async () => {
    const events = await collect(runAgent('r-success', 'Test Echo Agent', 'ignored prompt'));
    const result = events.find(e => e.type === 'result');
    expect(result).toBeTruthy();
    expect(result.data).toMatch(/Echo: OK/);
  });
});

