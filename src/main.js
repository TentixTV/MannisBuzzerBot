const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');

// Hardware Acceleration & High-Refresh Rate (60Hz / 120Hz / 144Hz+) VSync Support
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('force-high-performance-gpu');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-accelerated-video-decode');

const botManager = require('./bot/botManager');
const StreamServer = require('./streamServer');
const { loadConfig, saveConfig } = require('./config/configManager');

let mainWindow = null;
let streamWindow = null;
let streamServer = null;

function openStreamWindow() {
  if (streamWindow && !streamWindow.isDestroyed()) {
    streamWindow.show();
    streamWindow.focus();
    return { success: true };
  }

  const iconPath = path.join(__dirname, '..', 'App.png');
  streamWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 450,
    title: "MannisBox — Stream Overlay",
    icon: iconPath,
    backgroundColor: '#12131a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const url = streamServer ? streamServer.getUrl() : 'http://localhost:8888/stream.html';
  streamWindow.loadURL(url);

  streamWindow.on('closed', () => {
    streamWindow = null;
  });

  return { success: true };
}

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'App.png');

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    title: "Manni's Box — Discord Buzzer & Stream Master V4.8.029",
    icon: iconPath,
    backgroundColor: '#12131a',
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.on('maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximize-changed', true);
    }
  });

  mainWindow.on('unmaximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximize-changed', false);
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] [Level ${level}] ${message} (at ${path.basename(sourceId || '')}:${line})`);
  });

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
    if (streamWindow && !streamWindow.isDestroyed()) {
      streamWindow.webContents.send('game-state', state);
    }
    if (streamServer) {
      streamServer.broadcast(state);
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
  // Start OBS StreamServer
  streamServer = new StreamServer(() => botManager.getState());
  streamServer.start();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', async () => {
  console.log('[Main] App quitting, shutting down bot and stream server...');
  if (streamServer) streamServer.stop();
  await botManager.stop();
});

app.on('window-all-closed', async () => {
  if (streamServer) streamServer.stop();
  await botManager.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Window Controls (Custom Titlebar)
ipcMain.handle('window-minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
    return true;
  }
  return false;
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  }
  return false;
});

ipcMain.handle('window-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
    return true;
  }
  return false;
});

ipcMain.handle('window-is-maximized', () => {
  return (mainWindow && !mainWindow.isDestroyed()) ? mainWindow.isMaximized() : false;
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

ipcMain.handle('evaluate-player', async (event, arg) => {
  const action = (typeof arg === 'object' && arg !== null) ? arg.action : arg;
  const targetPlayer = (typeof arg === 'object' && arg !== null) ? arg.targetPlayer : undefined;
  return await botManager.evaluateActivePlayer(action, targetPlayer);
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

ipcMain.handle('set-player-score', (event, { playerId, newPoints }) => {
  return botManager.setPlayerScore(playerId, newPoints);
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

ipcMain.handle('add-custom-player', (event, username) => {
  return botManager.addCustomPlayer(username);
});

ipcMain.handle('remove-player', (event, playerId) => {
  return botManager.removePlayer(playerId);
});

ipcMain.handle('rename-player', (event, { playerId, newName }) => {
  return botManager.renamePlayer(playerId, newName);
});

ipcMain.handle('manual-buzz-player', (event, arg) => {
  const playerId = (typeof arg === 'object' && arg !== null) ? arg.playerId : arg;
  const username = (typeof arg === 'object' && arg !== null) ? arg.username : undefined;
  return botManager.manualBuzzPlayer(playerId, username);
});

ipcMain.handle('place-hitster-card', (event, arg) => {
  if (typeof arg === 'object' && arg !== null) {
    return botManager.placeHitsterCard(arg.targetSlot, arg.targetPlayer);
  }
  return botManager.placeHitsterCard(arg);
});

ipcMain.handle('get-game-state', () => {
  return botManager.getState();
});

ipcMain.handle('open-external', async (event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    await shell.openExternal(url);
    return { success: true };
  }
  return { success: false, error: 'Invalid URL' };
});

ipcMain.handle('play-test-sound', (event, type) => {
  return botManager.playTestSound(type);
});

// --- NEW GAME MODES IPC HANDLERS ---
ipcMain.handle('set-game-mode', (event, mode) => {
  return botManager.setGameMode(mode);
});

ipcMain.handle('select-music-folder', async () => {
  try {
    const parentWin = (mainWindow && !mainWindow.isDestroyed()) ? mainWindow : null;
    const res = await dialog.showOpenDialog(parentWin, {
      properties: ['openDirectory', 'dontAddToRecent'],
      title: 'Musik-Ordner auswählen (MP3 / Audio)'
    });
    if (!res.canceled && res.filePaths.length > 0) {
      return await botManager.scanMusicFolder(res.filePaths[0]);
    }
    return { success: false, canceled: true };
  } catch (err) {
    console.error('[Dialog] select-music-folder error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('scan-music-folder-direct', async (event, folderPath) => {
  return await botManager.scanMusicFolder(folderPath);
});

ipcMain.handle('pick-random-song', async (event, genre) => {
  return await botManager.pickRandomSong(genre);
});

ipcMain.handle('set-manual-song', (event, { artist, title }) => {
  return botManager.setManualSong(artist, title);
});

ipcMain.handle('pick-hitster-song', async (event, genre) => {
  return await botManager.pickHitsterSong(genre);
});

ipcMain.handle('set-manual-hitster-card', (event, { year, artist, title }) => {
  return botManager.setManualHitsterCard(year, artist, title);
});

ipcMain.handle('resolve-hitster-card', () => {
  return botManager.resolveHitsterCard();
});

ipcMain.handle('select-wallpaper-folder', async () => {
  try {
    const parentWin = (mainWindow && !mainWindow.isDestroyed()) ? mainWindow : null;
    const res = await dialog.showOpenDialog(parentWin, {
      properties: ['openDirectory', 'dontAddToRecent'],
      title: 'Wallpaper-Ordner auswählen'
    });
    if (!res.canceled && res.filePaths.length > 0) {
      return botManager.scanWallpaperFolder(res.filePaths[0]);
    }
    return { success: false, canceled: true };
  } catch (err) {
    console.error('[Dialog] select-wallpaper-folder error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('select-wallpaper-file', async () => {
  try {
    const parentWin = (mainWindow && !mainWindow.isDestroyed()) ? mainWindow : null;
    const res = await dialog.showOpenDialog(parentWin, {
      properties: ['openFile', 'dontAddToRecent'],
      title: 'Wallpaper-Bild auswählen',
      filters: [{ name: 'Bilder', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }]
    });
    if (!res.canceled && res.filePaths.length > 0) {
      return res.filePaths[0];
    }
    return '';
  } catch (err) {
    console.error('[Dialog] select-wallpaper-file error:', err);
    return '';
  }
});

ipcMain.handle('upload-wallpaper', (event, { imagePath, movieTitle }) => {
  return botManager.uploadWallpaper(imagePath, movieTitle);
});

ipcMain.handle('resolve-wallpaper', () => {
  botManager.resolveWallpaper();
  return { success: true };
});

ipcMain.handle('resume-round', () => {
  return botManager.resumeRound();
});

ipcMain.handle('abort-round', () => {
  return botManager.abortRound();
});

ipcMain.handle('toggle-boost', (event, forcedState) => {
  return botManager.toggleBoost(forcedState);
});

ipcMain.handle('set-goal', (event, target) => {
  return botManager.setGoal(target);
});

ipcMain.handle('get-stream-url', () => {
  return streamServer ? streamServer.getUrl() : 'http://localhost:8888/stream.html';
});

ipcMain.handle('pick-next-wallpaper', () => {
  return botManager.pickNextWallpaper();
});

ipcMain.handle('pick-random-wallpaper', () => {
  return botManager.pickRandomWallpaper();
});

ipcMain.handle('challenge-hitster-chip', (event, playerIdOrName) => {
  return botManager.challengeHitsterChip(playerIdOrName);
});

ipcMain.handle('adjust-player-chips', (event, { playerIdOrName, delta }) => {
  return botManager.adjustPlayerChips(playerIdOrName, delta);
});

ipcMain.handle('select-specific-song', async (event, filePath) => {
  return await botManager.selectSpecificSong(filePath);
});

ipcMain.handle('select-specific-hitster', async (event, filePath) => {
  return await botManager.selectSpecificHitster(filePath);
});

ipcMain.handle('select-specific-wallpaper', (event, titleOrIndex) => {
  return botManager.selectSpecificWallpaper(titleOrIndex);
});

ipcMain.handle('set-wallpaper-stage-points', (event, pointsObj) => {
  return botManager.setWallpaperStagePoints(pointsObj);
});

ipcMain.handle('set-wallpaper-stage-times', (event, timesObj) => {
  return botManager.setWallpaperStageTimes(timesObj);
});

ipcMain.handle('open-stream-window', () => {
  return openStreamWindow();
});

ipcMain.handle('set-playlist-mode', (event, mode) => {
  return botManager.setPlaylistMode(mode);
});

ipcMain.handle('prepare-next-song', async () => {
  return await botManager.prepareNextSong();
});

ipcMain.handle('stage-next-song', async (event, filePath) => {
  return await botManager.stageSpecificNextSong(filePath);
});

ipcMain.handle('play-next-song', async () => {
  return await botManager.playNextSong();
});

ipcMain.handle('pause-song', () => {
  return botManager.pauseSong();
});

ipcMain.handle('resume-song', () => {
  return botManager.resumeSong();
});

ipcMain.handle('stop-song', () => {
  return botManager.stopSong();
});


