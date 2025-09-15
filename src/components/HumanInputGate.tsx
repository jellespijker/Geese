/** HumanInputGate Component
 * Renders a small inline form when the agent run is awaiting human input (HITL).
 */
import React, { useState, FormEvent } from 'react';

export interface HumanInputGateProps {
  onSubmit: (value: string) => void;
}

export const HumanInputGate: React.FC<HumanInputGateProps> = ({ onSubmit }) => {
  const [value, setValue] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
  };
  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', background: '#fff7ed', padding: 8, borderRadius: 8, border: '1px solid #fdba74' }}>
      <span style={{ fontSize: 12, fontWeight: 600 }}>Human Input Required:</span>
      <input value={value} onChange={e => setValue(e.target.value)} placeholder="Provide clarification..." style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px solid #ccc' }} />
      <button style={{ padding: '6px 12px', borderRadius: 6 }}>Send</button>
    </form>
  );
};

export default HumanInputGate;

