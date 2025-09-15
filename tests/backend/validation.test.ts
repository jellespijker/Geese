import { describe, it, expect } from 'vitest';
import { validateRunAgentStream } from '../../electron/core/validation';

describe('validation: runAgentStream', () => {
  it('accepts valid payload with prompt', () => {
    const res = validateRunAgentStream({ runId: 'r1', agentName: 'A', prompt: 'hi' });
    expect(res.runId).toBe('r1');
  });
  it('rejects missing prompt & humanInput', () => {
    expect(() => validateRunAgentStream({ runId: 'r2', agentName: 'A' })).toThrow(/prompt or humanInput required/);
  });
});

