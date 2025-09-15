import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { __getLastRunId } from '../setup/testSetup';

/**
 * Frontend cancel flow test.
 * Uses test setup stubs: runAgentStream sets lastRunId, cancelAgentRun emits cancelled event.
 */

describe('frontend: cancel run flow', () => {
  it('starts a run and cancels it showing system cancellation message', async () => {
    render(<App />);
    // Wait for agent selector to populate
    const input = await screen.findByPlaceholderText(/ask the agent/i);
    fireEvent.change(input, { target: { value: 'Hello world' } });
    fireEvent.submit(input.closest('form')!);

    // Cancel button should appear
    const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
    expect(cancelBtn).toBeInTheDocument();

    // Click cancel
    fireEvent.click(cancelBtn);

    const runId = __getLastRunId();
    expect(runId).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText(/Run cancelled/i)).toBeInTheDocument();
    });
  });
});

