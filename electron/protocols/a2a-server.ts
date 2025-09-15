/**
 * A2A Server Adapter
 * Exposes internal agents over HTTP so external A2A-compliant agents can discover
 * and invoke them. This module is a thin translation layer: HTTP <-> Orchestrator.
 *
 * Responsibilities:
 *  - Enumerate registered agents (GET /agents)
 *  - Run an agent (POST /agents/:name/run)
 *  - Normalize errors into structured JSON
 *
 * Non-Responsibilities:
 *  - Business logic / planning / guardrails (handled upstream in orchestrator)
 *  - Authentication (future Phase)
 *  - Streaming over HTTP (future SSE/WebSocket upgrade)
 */
import express, { Request, Response } from 'express';
import type { Server } from 'http';
import { listAgents, getAgent } from '../agents/agentRegistry';
import { runAgent } from '../agentExecutor.orchestrator';

export interface StartA2AServerOptions { port?: number; logger?: (msg: string) => void }

export interface A2AServerHandle { server: Server; port: number; close: () => Promise<void> }

interface RunRequestBody { prompt?: string; humanInput?: string }

/** Map an unknown error into a safe client JSON payload. */
function normalizeError(err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  return { error: 'execution_failed', message };
}

/** Start the A2A HTTP server. */
export async function startA2AServer(opts: StartA2AServerOptions = {}): Promise<A2AServerHandle> {
  const basePort = (typeof opts.port === 'number') ? opts.port : Number(process.env.A2A_PORT || 3020);
  const log = opts.logger || ((m: string) => console.log(`[A2A] ${m}`));
  const app = express();
  app.use(express.json({ limit: '256kb' }));
  const handlePort = { value: basePort };

  app.get('/agents', (_req: Request, res: Response) => {
    const agents = listAgents().map(a => ({ name: a.name, description: a.description }));
    res.json({ agents });
  });

  app.post('/agents/:name/run', async (req: Request, res: Response) => {
    const agentName = req.params.name;
    const body: RunRequestBody = req.body || {};
    const agent = getAgent(agentName);
    if (!agent) {
      return res.status(404).json({ error: 'agent_not_found', message: `Agent '${agentName}' not found` });
    }
    const prompt = body.prompt || body.humanInput || '';
    if (!prompt) {
      return res.status(400).json({ error: 'invalid_request', message: 'Missing prompt or humanInput' });
    }
    try {
      const runId = `http-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const stream = runAgent(runId, agentName, prompt, body.humanInput);
      let finalResult: unknown = null;
      for await (const ev of stream) {
        if (ev.type === 'result') { finalResult = ev.data; }
        if (ev.type === 'error') {
          const errData: any = ev.data;
            return res.status(500).json({ error: errData.code || 'agent_error', message: errData.message });
        }
      }
      return res.json({ agent: agentName, result: finalResult });
    } catch (err) {
      return res.status(500).json(normalizeError(err));
    }
  });

  // Basic health endpoint
  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(basePort, () => {
      const addressInfo = s.address();
      if (typeof addressInfo === 'object' && addressInfo && 'port' in addressInfo) {
        handlePort.value = (addressInfo as any).port;
      }
      log(`A2A server listening on :${handlePort.value}`);
      resolve(s);
    });
  });

  async function close() {
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
    log('A2A server closed');
  }

  return { server, port: handlePort.value, close };
}

export default startA2AServer;
