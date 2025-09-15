import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { startA2AServer } from '../../electron/protocols/a2a-server';

describe('a2a-server', () => {
  it('starts and lists agents', async () => {
    const handle = await startA2AServer({ port: 0, logger: () => {} });
    try {
      const health = await request(handle.server).get('/healthz').expect(200);
      expect(health.body.ok).toBe(true);
      const agentsResp = await request(handle.server).get('/agents').expect(200);
      expect(Array.isArray(agentsResp.body.agents)).toBe(true);
      expect(agentsResp.body.agents.length).toBeGreaterThan(0);
    } finally {
      await handle.close();
    }
  });
});

