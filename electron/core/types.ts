/**
 * Core Domain Types
 * Defines the contracts (ports) for agent definitions consumed by the orchestrator
 * and protocol layers. Keep this file pure (types/interfaces only) to simplify
 * static reasoning and test isolation.
 */
import type { LLMStrategy } from '../llm/llmStrategy';

export interface AgentGraph {
  // Minimal shape: object supporting async iterable .stream(); we keep it loose here.
  // In Phase 4+ this can be specialized to a typed LangGraph interface.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stream: (input: any, opts?: any) => AsyncIterable<any> | Promise<AsyncIterable<any>>;
}

export interface AgentDefinition {
  name: string;
  description: string;
  /** Optional capability tags used by future planner/coordinator. */
  capabilities?: string[];
  /** Construct an executable graph instance using the injected LLM strategy. */
  createGraph: (llm: LLMStrategy) => Promise<AgentGraph> | AgentGraph;
}
