/**
 * Domain Error Classes
 * Provide typed distinctions for failure modes so protocol / IPC layers can
 * map them to structured payloads. Keep these small and side-effect free.
 */

export class GuardrailViolationError extends Error {
  details?: string[];
  constructor(message: string, details?: string[]) {
    super(message);
    this.name = 'GuardrailViolationError';
    this.details = details;
  }
}

export class AgentNotFoundError extends Error {
  constructor(agentName: string) { super(`Agent '${agentName}' not found`); this.name = 'AgentNotFoundError'; }
}

export class ProviderInitializationError extends Error {
  constructor(message: string) { super(message); this.name = 'ProviderInitializationError'; }
}

export function toSerializableError(err: unknown) {
  if (err instanceof GuardrailViolationError) {
    return { type: err.name, message: err.message, details: err.details ?? [] };
  }
  if (err instanceof AgentNotFoundError) {
    return { type: err.name, message: err.message };
  }
  if (err instanceof ProviderInitializationError) {
    return { type: err.name, message: err.message };
  }
  const message = err instanceof Error ? err.message : 'Unknown error';
  return { type: 'UnknownError', message };
}

