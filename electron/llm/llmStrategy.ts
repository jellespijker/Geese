/**
 * LLMStrategy (PDN: llmStrategy.ts)
 * Minimal abstraction over a chat / text generation provider.
 */
export interface LLMGenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

export interface LLMStrategy {
  readonly providerName: string;
  generate(prompt: string, options?: LLMGenerateOptions): Promise<string>;
}

export class LLMInitializationError extends Error {
  constructor(message: string) { super(message); this.name = 'LLMInitializationError'; }
}

