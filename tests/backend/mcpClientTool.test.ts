import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMCPClientTool } from '../../electron/protocols/mcp-client-tool';

declare const global: any;

describe('mcp-client-tool', () => {
  beforeEach(() => { global.fetch = vi.fn(); });

  it('invokes MCP server endpoint', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, text: async () => '{"ok":true}' });
    const tool = createMCPClientTool();
    const out = await tool.call(JSON.stringify({ serverUrl: 'http://mcp.example', prompt: 'Ping' }));
    expect(out).toBe('{"ok":true}');
    expect(global.fetch).toHaveBeenCalledWith('http://mcp.example/invoke', expect.any(Object));
  });

  it('errors on missing fields', async () => {
    const tool = createMCPClientTool();
    await expect(tool.call('{"serverUrl":"x"}')).rejects.toThrow(/Missing serverUrl or prompt/);
  });
});

