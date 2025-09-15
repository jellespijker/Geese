import { describe, it, expect } from 'vitest';
import { createLLMStrategy } from '../../electron/llm/llmFactory';

// Ensure environment isolation
const ORIGINAL_PROVIDER = process.env.LLM_PROVIDER;

describe('llmFactory', () => {
  afterAll(() => { process.env.LLM_PROVIDER = ORIGINAL_PROVIDER; });

  it('defaults to mock provider', async () => {
    delete process.env.LLM_PROVIDER;
    const llm = createLLMStrategy();
    const output = await llm.generate('Hello');
    expect(llm.providerName).toBe('mock');
    expect(output).toMatch(/mock-response/);
  });

  it('throws on unsupported provider', () => {
    process.env.LLM_PROVIDER = 'invalidX';
    expect(() => createLLMStrategy()).toThrow(/Unsupported LLM provider/i);
  });
});
