// Module-based type exports for Electron preload <-> renderer bridge
export interface AgentInfo { name: string; description: string }
export interface AgentResponse { runId: string; type: 'state' | 'hitl' | 'result' | 'error'; data: any }
export interface IElectronAPI {
  listAgents: () => Promise<AgentInfo[]>;
  runAgentStream: (runId: string, agentName: string, prompt: string) => void;
  provideHumanInput: (runId: string, input: string) => void;
  onAgentResponse: (callback: (response: AgentResponse) => void) => () => void;
}

