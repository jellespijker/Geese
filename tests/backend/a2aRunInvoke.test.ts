import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { startA2AServer } from '../../electron/protocols/a2a-server';
import { registerAgent } from '../../electron/agents/agentRegistry';
import type { AgentDefinition } from '../../electron/core/types';

// Deterministic lightweight agent for E2E invocation
const echoAgent: AgentDefinition = {
  name: 'E2E Echo Agent',
  description: 'Returns an echo of the prompt.',
  async createGraph() {
    return {
      async *stream(input: any) {
        // Simulate minimal streaming lifecycle
        yield { messages: [{ content: `Processing: ${(input.messages?.[0]?.content) || ''}`, tool_calls: [{}] }] };
        yield { messages: [{ content: `EchoResult: ${(input.messages?.[0]?.content) || ''}`, tool_calls: [] }] };
      },
    } as any;
  },
};
registerAgent(echoAgent);

describe('A2A run invocation E2E', () => {
  it('invokes an agent and returns final echo result', async () => {
    const handle = await startA2AServer({ port: 0, logger: () => {} });
    try {
      const payload = { prompt: 'IntegrationTest' };
      const res = await request(handle.server)
        .post('/agents/E2E%20Echo%20Agent/run')
        .send(payload)
        .expect(200);
      expect(res.body.agent).toBe('E2E Echo Agent');
      expect(String(res.body.result)).toMatch(/EchoResult: IntegrationTest/);
    } finally {
      await handle.close();
    }
  });
});

