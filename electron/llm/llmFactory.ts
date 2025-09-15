/**
 * LLM Factory (PDN: llmFactory.ts)
 * Resolves an LLMStrategy implementation based on environment configuration.
 */
import { LLMStrategy, LLMInitializationError } from './llmStrategy';

async function loadVertexAI(): Promise<LLMStrategy> {
  const { ChatVertexAI } = await import('@langchain/google-genai');
  const modelName = process.env.VERTEX_MODEL || 'gemini-1.5-flash';
  try {
    const impl = new ChatVertexAI({ model: modelName });
    return {
      providerName: 'vertexai',
      async generate(prompt: string) {
        const res: unknown = await impl.invoke(prompt);
        const content: unknown = (res as any)?.content;
        if (Array.isArray(content)) {
          return content.map((p: any) => (p?.text ? String(p.text) : '')).join('\n');
        }
        return String(content ?? '');
      },
    };
  } catch (err) {
    throw new LLMInitializationError(`Vertex AI init failed: ${(err as Error).message}`);
  }
}

function createMockStrategy(): LLMStrategy {
  return {
    providerName: 'mock',
    async generate(prompt: string) {
      return `[mock-response] ${prompt.slice(0, 40)}`;
    },
  };
}

export function createLLMStrategy(): LLMStrategy {
  const provider = (process.env.LLM_PROVIDER || 'mock').toLowerCase();
  if (provider === 'mock') return createMockStrategy();
  if (provider === 'vertexai') {
    const strategyPromise = loadVertexAI();
    return {
      providerName: 'vertexai',
      async generate(prompt: string, options) {
        const real = await strategyPromise;
        return real.generate(prompt, options);
      },
    };
  }
  throw new Error(`Unsupported LLM provider: ${provider}`);
}

