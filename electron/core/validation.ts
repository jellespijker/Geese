/** Validation schemas using zod for IPC and protocol payloads */
import { z } from 'zod';

export const RunAgentStreamSchema = z.object({
  runId: z.string().min(1),
  agentName: z.string().min(1),
  prompt: z.string().optional(),
  humanInput: z.string().optional(),
}).refine(data => !!(data.prompt || data.humanInput), { message: 'prompt or humanInput required' });

export type RunAgentStreamPayload = z.infer<typeof RunAgentStreamSchema>;

export function validateRunAgentStream(payload: unknown): RunAgentStreamPayload {
  return RunAgentStreamSchema.parse(payload);
}

