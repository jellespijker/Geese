import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IPC_LIST_AGENTS, IPC_RUN_AGENT_STREAM, IPC_AGENT_RESPONSE, IPC_CANCEL_AGENT_RUN } from './core/ipcChannels';

// Inline to avoid module import issues
interface AgentResponse {
  runId: string;
  type: 'state' | 'hitl' | 'result' | 'error' | 'cancelled';
  data: any;
}

contextBridge.exposeInMainWorld('electron', {
  /** List registered agents (name + description). */
  listAgents: () => ipcRenderer.invoke(IPC_LIST_AGENTS),
  /** Start a streaming agent run. */
  runAgentStream: (runId: string, agentName: string, prompt: string) => {
    ipcRenderer.send(IPC_RUN_AGENT_STREAM, { runId, agentName, prompt });
  },
  /** Provide human input to a paused (HITL) run - placeholder semantics. */
  provideHumanInput: (runId: string, input: string) => {
    ipcRenderer.send(IPC_RUN_AGENT_STREAM, { runId, humanInput: input });
  },
  /** Cancel an agent run. */
  cancelAgentRun: (runId: string) => {
    ipcRenderer.send(IPC_CANCEL_AGENT_RUN, runId);
  },
  /** Subscribe to agent response events. Returns unsubscribe function. */
  onAgentResponse: (callback: (response: AgentResponse) => void) => {
    const listener = (_event: IpcRendererEvent, response: AgentResponse) => callback(response);
    ipcRenderer.on(IPC_AGENT_RESPONSE, listener);
    return () => ipcRenderer.removeListener(IPC_AGENT_RESPONSE, listener);
  },
});
