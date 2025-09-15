/**
 * Guardrails Module
 * Provides lightweight input/output validation hooks acting as policy boundaries.
 * These are intentionally simple in Phase 2 and will be expanded with richer
 * classification + policy chaining in later phases.
 */

import { GuardrailViolationError } from './errors';

export interface GuardrailResult {
  passed: boolean;
  reasons: string[];
}

/** Max characters allowed for a single prompt (soft limit). */
export const MAX_INPUT_CHARS = 8000;
/** Max characters allowed for a single model output (soft limit). */
export const MAX_OUTPUT_CHARS = 16000;

/**
 * Heuristic prompt injection pattern fragments (very naive placeholder).
 * Future: replace with structured classifier or embedding similarity checks.
 */
const INJECTION_PATTERNS = [
  /ignore previous/i,
  /disregard (all )?rules/i,
  /you are now/i,
];

/**
 * Apply input guardrail validation.
 * @param prompt The raw user/system prompt content.
 * @throws Error when validation fails (fatal guardrail violation).
 */
export function applyInputGuardrail(prompt: string): GuardrailResult {
  const reasons: string[] = [];
  if (prompt.length > MAX_INPUT_CHARS) {
    reasons.push(`Prompt too long (> ${MAX_INPUT_CHARS} chars)`);
  }
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      reasons.push(`Potential prompt injection pattern: ${pattern.toString()}`);
      break;
    }
  }
  if (reasons.length) {
    throw new GuardrailViolationError(`Input guardrail violation`, reasons);
  }
  return { passed: true, reasons: [] };
}

/**
 * Apply output guardrail validation.
 * Currently only enforces a length bound; placeholder for moderation.
 * @param output Raw LLM output.
 * @throws Error when validation fails (fatal guardrail violation).
 */
export function applyOutputGuardrail(output: any): GuardrailResult {
  const text = typeof output === 'string' ? output : JSON.stringify(output);
  const reasons: string[] = [];
  if (text.length > MAX_OUTPUT_CHARS) {
    reasons.push(`Model output too long (> ${MAX_OUTPUT_CHARS} chars)`);
  }
  if (reasons.length) {
    throw new GuardrailViolationError(`Output guardrail violation`, reasons);
  }
  return { passed: true, reasons: [] };
}

/** Non-throwing evaluation helpers */
export function evaluateInput(prompt: string): GuardrailResult {
  try { return applyInputGuardrail(prompt); } catch (e) {
    if (e instanceof GuardrailViolationError) return { passed: false, reasons: e.details || [e.message] }; throw e; }
}
export function evaluateOutput(output: any): GuardrailResult {
  try { return applyOutputGuardrail(output); } catch (e) {
    if (e instanceof GuardrailViolationError) return { passed: false, reasons: e.details || [e.message] }; throw e; }
}
