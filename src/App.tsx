import React, { useEffect, useState, FormEvent } from 'react';
import { useAgentStreaming } from './hooks/useAgentStreaming';
import AgentSelector from './components/AgentSelector';
import ConversationPanel from './components/ConversationPanel';
import HumanInputGate from './components/HumanInputGate';

interface AgentInfo { name: string; description: string }

const App: React.FC = () => {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const { messages, start, running, awaitingHuman, submitHuman, cancel } = useAgentStreaming({ agentName: selectedAgent });
  const [input, setInput] = useState('');

  useEffect(() => {
    window.electron.listAgents().then(list => {
      setAgents(list);
      if (list.length) setSelectedAgent(list[0].name);
    });
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    start(input.trim());
    setInput('');
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Agentic Desktop App</h1>
        <p style={{ marginTop: 4 }}>Protocol-native (A2A + MCP) – Hexagonal Architecture</p>
        <AgentSelector agents={agents} value={selectedAgent} onChange={setSelectedAgent} />
      </header>

      <ConversationPanel messages={messages} />

      {awaitingHuman && (
        <HumanInputGate onSubmit={submitHuman} />
      )}

      <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder={running ? 'Running...' : 'Ask the agent...'} disabled={running || awaitingHuman} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc' }} />
        <button disabled={running || awaitingHuman} style={{ padding: '10px 16px', borderRadius: 8, cursor: running ? 'not-allowed' : 'pointer' }}>{running ? 'Working' : 'Send'}</button>
        {running && !awaitingHuman && (
          <button type="button" onClick={cancel} style={{ padding: '10px 12px', borderRadius: 8, background: '#dc2626', color: '#fff', cursor: 'pointer' }}>Cancel</button>
        )}
      </form>
    </div>
  );
};

export default App;
