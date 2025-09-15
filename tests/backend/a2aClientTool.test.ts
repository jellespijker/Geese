import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createA2AClientTool } from '../../electron/protocols/a2a-client-tool';

declare const global: any;

describe('a2a-client-tool', () => {
  beforeEach(() => { global.fetch = vi.fn(); });

  it('invokes remote agent endpoint', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, text: async () => 'RESULT' });
    const tool = createA2AClientTool();
    const out = await tool.call(JSON.stringify({ url: 'http://x/run', prompt: 'Hi' }));
    expect(out).toBe('RESULT');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('throws on bad json', async () => {
    const tool = createA2AClientTool();
    await expect(tool.call('{bad json')).rejects.toThrow(/Invalid JSON/);
  });
});

