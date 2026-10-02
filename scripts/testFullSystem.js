process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const botManager = require('../src/bot/botManager');
const StreamServer = require('../src/streamServer');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 950,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../src/preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const consoleLogs = [];
  const consoleErrors = [];

  win.webContents.on('console-message', (e, level, msg, line) => {
    if (msg.includes('Electron Security Warning')) return;
    if (level >= 2 || msg.includes('Error') || msg.includes('Uncaught')) {
      consoleErrors.push({ level, msg, line });
      console.log('CONSOLE ERR:', msg, 'at line', line);
    } else {
      consoleLogs.push(msg);
    }
  });

  // Start internal stream server on 8888
  const streamServer = new StreamServer(() => botManager.getState());
  streamServer.start();

  // Setup IPC handlers mimicking main.js
  ipcMain.handle('get-config', () => require('../src/config/configManager').loadConfig());
  ipcMain.handle('save-config', (e, c) => require('../src/config/configManager').saveConfig(c));
  ipcMain.handle('start-bot', () => ({ success: true }));
  ipcMain.handle('get-guilds', () => []);
  ipcMain.handle('get-channels', () => ({ text: [], voice: [] }));
  ipcMain.handle('get-game-state', () => botManager.getState());
  ipcMain.handle('check-for-updates', () => ({ success: true, updateAvailable: false }));
  ipcMain.handle('set-game-mode', (e, mode) => botManager.setGameMode(mode));
  ipcMain.handle('toggle-boost', (e, forced) => botManager.toggleBoost(forced));
  ipcMain.handle('set-goal', (e, goal) => botManager.setGoal(goal));
  ipcMain.handle('start-round', (e, p) => botManager.startRound(p));
  ipcMain.handle('end-round', () => botManager.endRound());
  ipcMain.handle('toggle-lock', () => botManager.toggleLock());
  ipcMain.handle('evaluate-player', (e, data) => {
    const action = data?.action || data;
    const targetPlayer = data?.targetPlayer || null;
    return botManager.evaluateActivePlayer(action, targetPlayer);
  });
  ipcMain.handle('evaluate-active-player', (e, a, p) => botManager.evaluateActivePlayer(a, p));
  ipcMain.handle('manual-buzz-player', (e, data, name) => {
    const playerId = data?.playerId || data;
    const username = data?.username || name;
    return botManager.manualBuzzPlayer(playerId, username);
  });
  ipcMain.handle('select-queue-player', (e, id) => botManager.selectQueuePlayer(id));
  ipcMain.handle('adjust-player-score', (e, arg) => {
    const playerId = arg?.playerId || arg;
    const delta = arg?.delta !== undefined ? arg.delta : 0;
    return botManager.adjustPlayerScore(playerId, delta);
  });
  ipcMain.handle('rename-player', (e, id, name) => botManager.renamePlayer(id, name));
  ipcMain.handle('remove-player', (e, id) => botManager.removePlayer(id));
  ipcMain.handle('reset-scores', () => botManager.resetScores());
  ipcMain.handle('ban-player', (e, id, name) => botManager.banPlayer(id, name));
  ipcMain.handle('unban-player', (e, id) => botManager.unbanPlayer(id));
  ipcMain.handle('undo-last-action', () => botManager.undoLastAction());
  ipcMain.handle('place-hitster-card', (e, data) => {
    const targetSlot = data?.targetSlot !== undefined ? data.targetSlot : data;
    const targetPlayer = data?.targetPlayer || null;
    return botManager.placeHitsterCard(targetSlot, targetPlayer);
  });
  ipcMain.handle('resolve-hitster-card', (e, targetPlayer) => botManager.resolveHitsterCard(targetPlayer));
  ipcMain.handle('resolve-wallpaper', () => botManager.resolveWallpaper());
  ipcMain.handle('upload-wallpaper', (e, data) => {
    const imagePath = data?.imagePath || data;
    const movieTitle = data?.movieTitle || 'Film';
    return botManager.uploadWallpaper(imagePath, movieTitle);
  });
  ipcMain.handle('set-manual-song', (e, data) => {
    const artist = data?.artist !== undefined ? data.artist : data;
    const title = data?.title || '';
    return botManager.setManualSong(artist, title);
  });
  ipcMain.handle('pick-random-song', () => ({ success: true, song: { fullTitle: 'Queen - Bohemian Rhapsody', artist: 'Queen', title: 'Bohemian Rhapsody' } }));
  ipcMain.handle('get-stream-url', () => 'http://localhost:8888/stream.html');

  // Proper event binding via EventEmitter
  botManager.on('game-state', (state) => {
    if (!win.isDestroyed()) {
      win.webContents.send('game-state', state);
    }
  });

  await win.loadFile(path.join(__dirname, '../src/renderer/index.html'));
  await new Promise(r => setTimeout(r, 1200));

  console.log('[STEP 1] Testing Game Mode Switching & UI Layouts...');
  const testModes = await win.webContents.executeJavaScript(`
    (async () => {
      // Test Song Mode
      document.getElementById('cardSelectSong')?.click();
      await new Promise(r => setTimeout(r, 150));
      const songBoardVisible = !document.getElementById('arenaBoardSong').classList.contains('hidden');

      // Test Hitster Mode
      document.getElementById('btnModeHitster')?.click();
      await new Promise(r => setTimeout(r, 150));
      const hitsterBoardVisible = !document.getElementById('arenaBoardHitster').classList.contains('hidden');

      // Test Wallpaper Mode
      document.getElementById('btnModeWallpaper')?.click();
      await new Promise(r => setTimeout(r, 150));
      const wpBoardVisible = !document.getElementById('arenaBoardWallpaper').classList.contains('hidden');

      return { songBoardVisible, hitsterBoardVisible, wpBoardVisible };
    })()
  `);
  console.log('Mode switch results:', testModes);

  console.log('[STEP 2] Testing Goal Setting (/goal)...');
  await win.webContents.executeJavaScript(`
    (async () => {
      await window.mannisBoxAPI.setGoal(60);
    })()
  `);
  await new Promise(r => setTimeout(r, 300));
  const goalCheck = await win.webContents.executeJavaScript(`
    (() => {
      const val = document.getElementById('lblGoalValue')?.textContent;
      return { val, matches: val === '60' };
    })()
  `);
  console.log('Goal check:', goalCheck);

  console.log('[STEP 3] Testing 2X Boost Mode (/boost)...');
  await win.webContents.executeJavaScript(`
    (async () => {
      await window.mannisBoxAPI.toggleBoost(true);
    })()
  `);
  await new Promise(r => setTimeout(r, 300));
  const boostCheck = await win.webContents.executeJavaScript(`
    (() => {
      const btnActive = document.getElementById('btnToggleBoost')?.classList.contains('active');
      const bannerVisible = !document.getElementById('arenaBoostBanner')?.classList.contains('hidden');
      const domeBoosted = document.getElementById('btnPhysicalBuzzer')?.classList.contains('boosted');
      return { btnActive, bannerVisible, domeBoosted };
    })()
  `);
  console.log('Boost check (ON):', boostCheck);

  console.log('[STEP 4] Testing 2X Points Awarded & Boost Reset (Song Quiz Mode)...');
  await botManager.setGameMode('song');
  // Create player first in scores
  botManager.gameState.scores['test-user-1'] = {
    id: 'test-user-1',
    username: 'GamerPro',
    avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
    points: 0,
    correct: 0,
    wrong: 0
  };
  // Re-enable boost for the test round
  botManager.toggleBoost(true);
  botManager.manualBuzzPlayer('test-user-1', 'GamerPro');
  await new Promise(r => setTimeout(r, 200));
  // In song mode, correct award is config.points.correct (default 2 in v5.1.000), with 2x boost = 4 points
  await botManager.evaluateActivePlayer('correct');
  await new Promise(r => setTimeout(r, 300));
  const boostAwardCheck = botManager.getState();
  const player1Points = boostAwardCheck.scores['test-user-1']?.points;
  const boostClearedAfterHit = !boostAwardCheck.isBoostActive;
  console.log('Points awarded (should be 4 for 2 base with 2x boost):', player1Points, 'Boost cleared:', boostClearedAfterHit);

  console.log('[STEP 5] Testing Grand Champion Victory Trigger...');
  // Set goal to 20 and adjust player to reach 20 points
  await win.webContents.executeJavaScript(`
    (async () => {
      await window.mannisBoxAPI.setGoal(20);
      await window.mannisBoxAPI.adjustPlayerScore('test-user-1', 16); // 4 + 16 = 20
    })()
  `);
  await new Promise(r => setTimeout(r, 400));
  const victoryCheck = await win.webContents.executeJavaScript(`
    (() => {
      const modal = document.getElementById('victoryModal');
      const modalVisible = modal && !modal.classList.contains('hidden');
      const champName = document.getElementById('victoryWinnerName')?.textContent;
      const champScore = document.getElementById('victoryWinnerScoreTag')?.textContent;
      return { modalVisible, champName, champScore };
    })()
  `);
  console.log('Victory modal check:', victoryCheck);

  console.log('[STEP 6] Testing OBS Stream Endpoint HTTP Fetch...');
  const http = require('http');
  const streamData = await new Promise((resolve) => {
    http.get('http://localhost:8888/api/state', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', () => resolve(null));
  });
  console.log('Stream state API returned:', !!streamData, 'Winner in stream:', streamData?.winner?.username);

  console.log('[TOTAL CONSOLE ERRORS]:', consoleErrors.length);
  const success = testModes.songBoardVisible &&
                  testModes.hitsterBoardVisible &&
                  testModes.wpBoardVisible &&
                  goalCheck.matches &&
                  boostCheck.btnActive &&
                  boostCheck.bannerVisible &&
                  boostCheck.domeBoosted &&
                  player1Points === 4 &&
                  boostClearedAfterHit &&
                  victoryCheck.modalVisible &&
                  streamData?.winner?.username === 'GamerPro' &&
                  consoleErrors.length === 0;

  console.log('--- SYSTEM VERIFICATION TEST RESULT:', success ? 'PASSED (100% OK)' : 'FAILED', '---');

  streamServer.stop();
  app.quit();
  process.exit(success ? 0 : 1);
});
