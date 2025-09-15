import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import 'dotenv/config';
import { listAgents } from './agents/agentRegistry';
import { runAgent } from './agentExecutor.orchestrator';
import { startA2AServer } from './protocols/a2a-server';
import { IPC_LIST_AGENTS, IPC_RUN_AGENT_STREAM, IPC_AGENT_RESPONSE, IPC_CANCEL_AGENT_RUN } from './core/ipcChannels';
import { validateRunAgentStream } from './core/validation';
import { cancelRun } from './core/runContext';

let a2aHandle: { close: () => Promise<void> } | null = null;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), sandbox: false },
  });
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
  win.webContents.openDevTools();
};

app.whenReady().then(async () => {
  // Start internal A2A server (best-effort; log and continue on failure)
  try {
    a2aHandle = await startA2AServer({});
  } catch (err) {
    console.error('[Main] Failed to start A2A server:', err);
  }

  ipcMain.handle(IPC_LIST_AGENTS, () => {
    console.log('[Main] list-agents invoked');
    return listAgents().map(a => ({ name: a.name, description: a.description }));
  });

  ipcMain.on(IPC_RUN_AGENT_STREAM, async (event, args) => {
    let payload;
    try {
      payload = validateRunAgentStream(args);
    } catch (e) {
      event.sender.send(IPC_AGENT_RESPONSE, { runId: args?.runId || 'invalid', type: 'error', data: { message: (e as Error).message, code: 'ValidationError' } });
      return;
    }
    const { runId, agentName, prompt, humanInput } = payload;
    console.log(`[Main] run-agent-stream start runId=${runId} agent=${agentName}`);
    const stream = runAgent(runId, agentName, prompt || '', humanInput);
    for await (const chunk of stream) {
      if (event.sender.isDestroyed()) break;
      event.sender.send(IPC_AGENT_RESPONSE, { runId, ...chunk });
    }
    console.log(`[Main] run-agent-stream complete runId=${runId}`);
  });

  ipcMain.on(IPC_CANCEL_AGENT_RUN, (_event, runId: string) => {
    const ok = cancelRun(runId);
    if (!ok) {
      console.warn(`[Main] cancel-run: runId=${runId} not found`);
    } else {
      console.log(`[Main] cancel-run requested runId=${runId}`);
    }
  });

  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('before-quit', async (e) => {
  if (a2aHandle) {
    e.preventDefault();
    try { await a2aHandle.close(); } catch (err) { console.error('[Main] Error closing A2A server', err); }
    a2aHandle = null;
    app.exit(0);
  }
});
