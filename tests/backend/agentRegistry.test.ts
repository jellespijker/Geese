import { describe, it, expect } from 'vitest';
import { listAgents, getAgent } from '../../electron/agents/agentRegistry';

describe('agentRegistry', () => {
  it('lists at least one built-in agent', () => {
    const agents = listAgents();
    expect(agents.length).toBeGreaterThan(0);
  });
  it('retrieves agent by name', () => {
    const first = listAgents()[0];
    const retrieved = getAgent(first.name);
    expect(retrieved?.name).toBe(first.name);
  });
});

