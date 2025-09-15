import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import 'dotenv/config';
import started from 'electron-squirrel-startup';
import { IPC_LIST_AGENTS, IPC_RUN_AGENT_STREAM, IPC_AGENT_RESPONSE } from '../electron/core/ipcChannels';
import { validateRunAgentStream } from '../electron/core/validation';
import { listAgents } from '../electron/agents/agentRegistry';
import { runAgent } from '../electron/agentExecutor.orchestrator';

if (started) app.quit();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), sandbox: false },
  });
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
  win.webContents.openDevTools();
};

app.on('ready', () => {
  ipcMain.handle(IPC_LIST_AGENTS, () => listAgents().map(a => ({ name: a.name, description: a.description })));
  ipcMain.on(IPC_RUN_AGENT_STREAM, async (event, args) => {
    let payload;
    try { payload = validateRunAgentStream(args); } catch (e) {
      event.sender.send(IPC_AGENT_RESPONSE, { runId: args?.runId || 'invalid', type: 'error', data: { message: (e as Error).message, code: 'ValidationError' } });
      return;
    }
    const { runId, agentName, prompt, humanInput } = payload;
    const stream = runAgent(runId, agentName, prompt || '', humanInput);
    for await (const chunk of stream) {
      if (!event.sender.isDestroyed()) {
        event.sender.send(IPC_AGENT_RESPONSE, { runId, ...chunk });
      }
    }
  });
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
