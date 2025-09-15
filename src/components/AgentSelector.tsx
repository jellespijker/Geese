/** AgentSelector Component
 * Renders a dropdown to choose among registered agents.
 */
import React from 'react';

export interface AgentOption { name: string; description: string }
export interface AgentSelectorProps {
  agents: AgentOption[];
  value: string;
  onChange: (name: string) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({ agents, value, onChange }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: 6 }}>
    {agents.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
  </select>
);

export default AgentSelector;

