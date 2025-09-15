/**
 * Agent Orchestrator (PDN: *.orchestrator.ts)
 * Executes an agent graph run while streaming intermediate events.
 *
 * Responsibilities:
 *  - Guardrail input enforcement
 *  - Acquire LLM strategy (factory) and construct agent graph
 *  - Translate LangGraph stream events to normalized domain events
 *  - Apply output guardrails before emitting final result
 *  - Surface structured domain errors (code + details)
 *
 * Non‑Responsibilities:
 *  - Network / protocol translation (handled by A2A server / IPC layers)
 *  - UI formatting / persistence
 *  - Human‑in‑the‑Loop resume logic (placeholder for future)
 */
import { HumanMessage } from '@langchain/core/messages';
import { applyInputGuardrail, applyOutputGuardrail } from './core/guardrails';
import { getAgent } from './agents/agentRegistry';
import { createLLMStrategy } from './llm/llmFactory';
import { AgentNotFoundError, toSerializableError } from './core/errors';
import { registerRun, isCancelled, clearRun } from './core/runContext';

export type AgentStreamEvent =
  | { type: 'state'; data: { content: unknown } }
  | { type: 'result'; data: unknown }
  | { type: 'cancelled'; data: { reason: string } }
  | { type: 'error'; data: { message: string; code: string; details?: string[] } };

/**
 * Run an agent and yield streaming events.
 * @param runId Stable identifier for run correlation.
 * @param agentName Registered agent name.
 * @param prompt Primary prompt (ignored if humanInput provided on resume path).
 * @param humanInput Optional human input for paused (HITL) continuation.
 * @yields AgentStreamEvent entries until a terminal result or error occurs.
 */
export async function* runAgent(
  runId: string,
  agentName: string,
  prompt: string,
  humanInput?: string
): AsyncGenerator<AgentStreamEvent> {
  try {
    if (!humanInput) {
      applyInputGuardrail(prompt);
    }
    registerRun(runId);
    const agentDefinition = getAgent(agentName);
    if (!agentDefinition) {
      throw new AgentNotFoundError(agentName);
    }
    const llm = createLLMStrategy();
    const graph = await agentDefinition.createGraph(llm);
    const messages = humanInput ? [new HumanMessage(humanInput)] : [new HumanMessage(prompt)];

    // Stream LangGraph events
    for await (const event of await (graph as any).stream(
      { messages },
      { recursionLimit: 50, streamMode: 'values' }
    )) {
      if (isCancelled(runId)) {
        yield { type: 'cancelled', data: { reason: 'user_cancel' } };
        return;
      }
      const lastMessage = event.messages[event.messages.length - 1];
      yield { type: 'state', data: { content: lastMessage.content } };
      if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
        if (isCancelled(runId)) {
          yield { type: 'cancelled', data: { reason: 'user_cancel' } };
          return;
        }
        applyOutputGuardrail(lastMessage.content);
        yield { type: 'result', data: lastMessage.content };
        return;
      }
    }
  } catch (error) {
    const serial = toSerializableError(error);
    console.error('[Orchestrator] Agent run failed:', serial);
    yield { type: 'error', data: { message: serial.message, code: serial.type, details: (serial as any).details } };
  } finally {
    clearRun(runId);
  }
}
