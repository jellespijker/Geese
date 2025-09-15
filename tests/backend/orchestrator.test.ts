import { describe, it, expect } from 'vitest';
import { runAgent } from '../../electron/agentExecutor.orchestrator';

async function collect(stream: AsyncGenerator<any>) {
  const events: any[] = [];
  for await (const ev of stream) events.push(ev);
  return events;
}

describe('orchestrator runAgent', () => {
  it('returns error event for unknown agent', async () => {
    const gen = runAgent('test1', 'NonExistentAgent', 'Hello');
    const events = await collect(gen);
    const errorEv = events.find(e => e.type === 'error');
    expect(errorEv).toBeTruthy();
    expect(errorEv.data.code).toBe('AgentNotFoundError');
  });
});

