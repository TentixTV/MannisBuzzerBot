const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const botManager = require('./bot/botManager');
const { loadConfig, saveConfig } = require('./config/configManager');

let mainWindow = null;

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'App.png');

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1080,
    minHeight: 720,
    title: "Manni's Box — Discord Buzzer & Game Show Master",
    icon: iconPath,
    backgroundColor: '#12131a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Forward bot events to renderer
  botManager.on('status-changed', (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bot-status', status);
    }
  });

  botManager.on('game-state', (state) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('game-state', state);
    }
  });

  botManager.on('voice-status', (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('voice-status', status);
    }
  });

  botManager.on('error', (err) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bot-error', err);
    }
  });

  // Auto-start bot on launch
  mainWindow.webContents.on('did-finish-load', () => {
    botManager.start();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', async () => {
  console.log('[Main] App quitting, shutting down bot...');
  await botManager.stop();
});

app.on('window-all-closed', async () => {
  await botManager.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-config', () => {
  return loadConfig();
});

ipcMain.handle('save-config', (event, newConf) => {
  botManager.updateConfig(newConf);
  return loadConfig();
});

ipcMain.handle('start-bot', async () => {
  return await botManager.start();
});

ipcMain.handle('stop-bot', async () => {
  await botManager.stop();
  return { success: true };
});

ipcMain.handle('get-guilds', async () => {
  return await botManager.getGuilds();
});

ipcMain.handle('get-channels', async (event, guildId) => {
  return await botManager.getChannels(guildId);
});

ipcMain.handle('join-voice', async (event, { guildId, channelId }) => {
  return await botManager.joinVoice(guildId, channelId);
});

ipcMain.handle('leave-voice', async () => {
  botManager.leaveVoice();
  return { success: true };
});

ipcMain.handle('start-round', async (event, options) => {
  return await botManager.startRound(options || {});
});

ipcMain.handle('lock-buzzer', async (event, locked) => {
  return await botManager.setBuzzerLocked(locked);
});

ipcMain.handle('evaluate-player', async (event, action) => {
  return await botManager.evaluateActivePlayer(action);
});

ipcMain.handle('select-queue-player', async (event, playerId) => {
  return await botManager.selectQueuePlayer(playerId);
});

ipcMain.handle('ban-player', (event, { playerId, username }) => {
  return botManager.banPlayer(playerId, username);
});

ipcMain.handle('unban-player', (event, playerId) => {
  return botManager.unbanPlayer(playerId);
});

ipcMain.handle('adjust-player-score', (event, { playerId, delta }) => {
  return botManager.adjustPlayerScore(playerId, delta);
});

ipcMain.handle('undo-last-action', () => {
  return botManager.undoLastAction();
});

ipcMain.handle('end-round', async () => {
  return await botManager.endRound();
});

ipcMain.handle('reset-scores', async () => {
  return botManager.resetScores();
});

ipcMain.handle('get-game-state', () => {
  return botManager.getState();
});

ipcMain.handle('open-external', async (event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    const { shell } = require('electron');
    await shell.openExternal(url);
    return { success: true };
  }
  return { success: false, error: 'Invalid URL' };
});

ipcMain.handle('play-test-sound', (event, type) => {
  return botManager.playTestSound(type);
});
