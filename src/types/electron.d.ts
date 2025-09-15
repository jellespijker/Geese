// Global ambient types for preload-exposed Electron bridge
export interface ElectronAgentInfo { name: string; description: string }
export interface ElectronAgentError { message: string; code: string; details?: string[] }
export type ElectronAgentResponse =
  | { runId: string; type: 'state'; data: { content: unknown } }
  | { runId: string; type: 'result'; data: unknown }
  | { runId: string; type: 'cancelled'; data: { reason: string } }
  | { runId: string; type: 'error'; data: ElectronAgentError };

interface ElectronAPI {
  listAgents(): Promise<ElectronAgentInfo[]>;
  runAgentStream(runId: string, agentName: string, prompt: string): void;
  provideHumanInput(runId: string, input: string): void;
  cancelAgentRun(runId: string): void;
  onAgentResponse(cb: (resp: ElectronAgentResponse) => void): () => void;
}

declare global {
  interface Window { electron: ElectronAPI }
}

export {};
