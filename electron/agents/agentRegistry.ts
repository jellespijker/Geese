/**
 * Agent Registry (PDN compliant)
 * Maintains a mapping from agent name -> AgentDefinition.
 * Responsibilities:
 *  - Register agents
 *  - List agents
 *  - Retrieve a single agent
 *  - Provide a reset hook for tests (not exported publicly yet)
 */
import { AgentDefinition } from '../core/types';
import { agent as reactAgent } from './reactAgent.definition';

const registry = new Map<string, AgentDefinition>();

export function registerAgent(def: AgentDefinition): void {
  registry.set(def.name, def);
}

export function getAgent(name: string): AgentDefinition | undefined {
  return registry.get(name);
}

export function listAgents(): AgentDefinition[] {
  return Array.from(registry.values());
}

// Initial registrations
registerAgent(reactAgent);

// Testing utility (can be surfaced later if needed)
function __resetRegistry() { registry.clear(); }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _internal = { __resetRegistry };

