import '@testing-library/jest-dom';

// Provide a minimal window.electron mock for renderer tests.
// This avoids needing the real preload bridge.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).window = window;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).window.electron = {
  listAgents: async () => [{ name: 'Mock Agent', description: 'A mock agent for tests' }],
  runAgentStream: () => { /* no-op */ },
  provideHumanInput: () => { /* no-op */ },
  onAgentResponse: (cb: unknown) => { return () => void cb; },
};

let agentResponseCallback: any = null;
(globalThis as any).window.electron.onAgentResponse = (cb: any) => {
  agentResponseCallback = cb;
  return () => { if (agentResponseCallback === cb) agentResponseCallback = null; };
};
// Helper for tests to simulate backend streaming
export function __emitAgentResponse(payload: any) {
  if (agentResponseCallback) agentResponseCallback(payload);
}

let lastRunId: string | null = null;
(globalThis as any).window.electron.runAgentStream = (runId: string) => { lastRunId = runId; };
(globalThis as any).window.electron.cancelAgentRun = (runId: string) => {
  // emit a cancelled event immediately for tests
  __emitAgentResponse({ runId, type: 'cancelled', data: { reason: 'user_cancel' } });
};
export function __getLastRunId() { return lastRunId; }
