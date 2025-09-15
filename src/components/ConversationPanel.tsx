/** ConversationPanel Component
 * Displays a scrollable list of messages with simple role-based styling.
 */
import React, { useEffect, useRef } from 'react';
import type { StreamMessage } from '../hooks/useAgentStreaming';

export interface ConversationPanelProps { messages: StreamMessage[] }

export const ConversationPanel: React.FC<ConversationPanelProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, height: '55vh', overflowY: 'auto', background: '#fafafa' }}>
      {messages.map(m => (
        <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
          <div style={{ background: m.role === 'user' ? '#2563eb' : (m.role === 'system' ? '#fef3c7' : '#e5e7eb'), color: m.role === 'user' ? '#fff' : '#000', padding: '8px 12px', borderRadius: 14, maxWidth: '70%', whiteSpace: 'pre-wrap' }}>{m.content}</div>
        </div>
      ))}
      {!messages.length && <div style={{ opacity: .6 }}>No conversation yet. Ask something.</div>}
      <div ref={bottomRef} />
    </div>
  );
};

export default ConversationPanel;

