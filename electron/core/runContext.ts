/**
 * Run Context Manager
 * Tracks in-flight agent runs enabling cooperative cancellation.
 */
export interface RunState { cancelled: boolean }

const runs = new Map<string, RunState>();

export function registerRun(runId: string) {
  runs.set(runId, { cancelled: false });
}

export function cancelRun(runId: string): boolean {
  const ctx = runs.get(runId);
  if (!ctx) return false;
  ctx.cancelled = true;
  return true;
}

export function isCancelled(runId: string): boolean {
  const ctx = runs.get(runId);
  return !!ctx?.cancelled;
}

export function clearRun(runId: string) {
  runs.delete(runId);
}

