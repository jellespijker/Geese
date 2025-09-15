/** React hook to manage a single agent run streaming lifecycle. */
import { useState, useRef, useCallback, useEffect } from 'react';

export interface StreamMessage { id: string; role: 'user' | 'assistant' | 'system'; content: string }
export interface UseAgentStreamingOptions { agentName?: string }
export interface UseAgentStreamingState {
  messages: StreamMessage[];
  running: boolean;
  awaitingHuman: boolean;
}

export function useAgentStreaming(opts: UseAgentStreamingOptions) {
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [running, setRunning] = useState(false);
  const [awaitingHuman, setAwaitingHuman] = useState(false);
  const runIdRef = useRef<string | null>(null);

  const start = useCallback((prompt: string) => {
    if (!opts.agentName || !prompt.trim()) return;
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    runIdRef.current = runId;
    setMessages(prev => [...prev, { id: runId, role: 'user', content: prompt }]);
    setRunning(true);
    setAwaitingHuman(false);
    // @ts-expect-error preload injection
    window.electron.runAgentStream(runId, opts.agentName, prompt);
  }, [opts.agentName]);

  const submitHuman = useCallback((input: string) => {
    if (!runIdRef.current) return;
    // @ts-expect-error preload injection
    window.electron.provideHumanInput(runIdRef.current, input);
    setAwaitingHuman(false);
  }, []);

  const cancel = useCallback(() => {
    if (!runIdRef.current) return;
    // @ts-expect-error preload injection
    window.electron.cancelAgentRun(runIdRef.current);
  }, []);

  useEffect(() => {
    // @ts-expect-error preload injection
    const unsubscribe = window.electron.onAgentResponse((resp: any) => {
      if (resp.runId !== runIdRef.current) return;
      if (resp.type === 'result') {
        setMessages(prev => [...prev, { id: `res_${Date.now()}`, role: 'assistant', content: String(resp.data) }]);
        setRunning(false);
      } else if (resp.type === 'error') {
        const msg = typeof resp.data === 'object' ? `${resp.data.code}: ${resp.data.message}` : String(resp.data);
        setMessages(prev => [...prev, { id: `err_${Date.now()}`, role: 'assistant', content: msg }]);
        setRunning(false);
      } else if (resp.type === 'hitl') {
        setAwaitingHuman(true);
      } else if (resp.type === 'cancelled') {
        setMessages(prev => [...prev, { id: `cancel_${Date.now()}`, role: 'system', content: `Run cancelled: ${resp.data?.reason || 'user request'}` }]);
        setRunning(false);
      }
    });
    return unsubscribe;
  }, []);

  return { messages, start, running, awaitingHuman, submitHuman, cancel } as UseAgentStreamingState & { start: typeof start; submitHuman: typeof submitHuman; cancel: typeof cancel };
}
