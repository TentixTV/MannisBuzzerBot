const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const botManager = require('../src/bot/botManager');
const StreamServer = require('../src/streamServer');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.webContents.on('console-message', (event, level, msg, line, src) => {
    console.log(`[RENDERER CONSOLE] [lvl ${level}] ${msg} (${line})`);
  });

  ipcMain.handle('get-config', () => require('../src/config/configManager').loadConfig());
  ipcMain.handle('save-config', (e, c) => require('../src/config/configManager').saveConfig(c));
  ipcMain.handle('start-bot', () => ({ success: true }));
  ipcMain.handle('get-guilds', () => []);
  ipcMain.handle('get-channels', () => ({ text: [], voice: [] }));
  ipcMain.handle('get-game-state', () => botManager.getState());
  ipcMain.handle('set-game-mode', (e, mode) => {
    console.log('[MAIN IPC] set-game-mode called with:', mode);
    return botManager.setGameMode(mode);
  });

  await win.loadFile(path.join(__dirname, '..', 'src', 'renderer', 'index.html'));
  console.log('[TEST] Page loaded.');

  setTimeout(async () => {
    console.log('[TEST] Executing click on btnModeHitster...');
    const result = await win.webContents.executeJavaScript(`
      (() => {
        try {
          const btn = document.getElementById('btnModeHitster');
          console.log('Button found:', !!btn);
          btn.click();
          const hitsterPanel = document.getElementById('hitsterRegiePanel');
          const isHitsterVisible = !hitsterPanel.classList.contains('hidden');
          console.log('Is hitsterRegiePanel visible after click?:', isHitsterVisible);
          return { success: true, isHitsterVisible };
        } catch (err) {
          console.error('Error during click execution:', err.message, err.stack);
          return { success: false, error: err.message };
        }
      })()
    `);
    console.log('[TEST] Execution result:', result);
    app.quit();
  }, 2000);
});
