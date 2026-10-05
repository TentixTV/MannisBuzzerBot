process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const botManager = require('../src/bot/botManager');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../src/preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const errors = [];
  win.webContents.on('console-message', (e, level, msg, line) => {
    if (msg.includes('Electron Security Warning')) return;
    if (level >= 2 || msg.includes('Error') || msg.includes('Uncaught')) {
      errors.push({ level, msg, line });
      console.log('CONSOLE ERR:', msg, 'at line', line);
    }
  });

  ipcMain.handle('get-config', () => require('../src/config/configManager').loadConfig());
  ipcMain.handle('save-config', (e, c) => require('../src/config/configManager').saveConfig(c));
  ipcMain.handle('get-guilds', () => []);
  ipcMain.handle('get-channels', () => ({ text: [], voice: [] }));
  ipcMain.handle('get-game-state', () => botManager.getState());
  ipcMain.handle('set-game-mode', (e, mode) => botManager.setGameMode(mode));
  ipcMain.handle('toggle-boost', (e, forced) => botManager.toggleBoost(forced));
  ipcMain.handle('set-goal', (e, goal) => botManager.setGoal(goal));
  ipcMain.handle('place-hitster-card', (e, slot, target) => botManager.placeHitsterCard(slot, target));
  ipcMain.handle('resolve-hitster-card', () => botManager.resolveHitsterCard());
  ipcMain.handle('resolve-wallpaper', () => botManager.resolveWallpaper());
  ipcMain.handle('upload-wallpaper', (e, fp, title) => botManager.uploadWallpaper(fp, title));
  ipcMain.handle('set-wallpaper-stage-points', (e, pts) => botManager.setWallpaperStagePoints(pts));
  ipcMain.handle('challenge-hitster-chip', (e, p) => botManager.challengeHitsterChip(p));
  ipcMain.handle('adjust-player-chips', (e, p, delta) => botManager.adjustPlayerChips(p, delta));
  ipcMain.handle('set-player-score', (e, id, score) => botManager.setPlayerScore(id, score));

  botManager.on('game-state', (state) => {
    if (!win.isDestroyed()) {
      win.webContents.send('game-state', state);
    }
  });

  await win.loadFile(path.join(__dirname, '../src/renderer/index.html'));
  await new Promise(r => setTimeout(r, 1200));

  console.log('[TEST 1: Test Wallpaper Custom Stage Points]');
  await botManager.setGameMode('wallpaper');
  botManager.setWallpaperStagePoints({ 1: 10, 2: 7, 3: 5, 4: 2 });
  
  const ptsStage1 = botManager.getWallpaperPoints(5); // in 0-10s stage
  const ptsStage2 = botManager.getWallpaperPoints(15); // in 10-20s stage
  const ptsStage3 = botManager.getWallpaperPoints(25); // in 20-30s stage
  const ptsStage4 = botManager.getWallpaperPoints(35); // in 30-40s stage
  console.log('Stage Points Calculated:', { ptsStage1, ptsStage2, ptsStage3, ptsStage4 });
  const pointsCorrect = ptsStage1 === 10 && ptsStage2 === 7 && ptsStage3 === 5 && ptsStage4 === 2;

  console.log('[TEST 2: Test Hitster Challenge Chip & Adjustment]');
  await botManager.setGameMode('hitster');
  botManager.adjustPlayerChips('PlayerOne', -1);
  const chipsAfterMinus = botManager.gameState.hitsterState.playerShelves['PlayerOne']?.chips;
  console.log('Chips after minus 1:', chipsAfterMinus);
  botManager.adjustPlayerChips('PlayerOne', 2);
  const chipsAfterPlus = botManager.gameState.hitsterState.playerShelves['PlayerOne']?.chips;
  console.log('Chips after plus 2:', chipsAfterPlus);

  const challengeRes = await botManager.challengeHitsterChip('PlayerOne');
  console.log('Challenge result:', challengeRes);

  console.log('[TEST 3: Renderer Custom Dialogs Presence]');
  const dialogPresence = await win.webContents.executeJavaScript(`
    (() => {
      const modal = document.getElementById('customAppDialogModal');
      const title = document.getElementById('customDialogTitle');
      const msg = document.getElementById('customDialogMessage');
      const confirmBtn = document.getElementById('btnCustomDialogConfirm');
      const cancelBtn = document.getElementById('btnCustomDialogCancel');
      const input = document.getElementById('customDialogInput');
      const wpCard1 = document.getElementById('wpCard1');
      const clapperTitle = document.getElementById('arenaWpClapperTitle');

      return {
        hasModal: !!modal,
        hasTitle: !!title,
        hasMsg: !!msg,
        hasConfirm: !!confirmBtn,
        hasCancel: !!cancelBtn,
        hasInput: !!input,
        hasWpCardInteractive: wpCard1 && wpCard1.classList.contains('tag-score-interactive'),
        hasClapperBlurClass: clapperTitle && (clapperTitle.classList.contains('film-blurred') || clapperTitle.classList.contains('film-revealed'))
      };
    })()
  `);
  console.log('Renderer Dialog & Component Presence:', dialogPresence);

  const allPassed = pointsCorrect &&
                    chipsAfterMinus === 2 &&
                    chipsAfterPlus === 4 &&
                    challengeRes.success &&
                    dialogPresence.hasModal &&
                    dialogPresence.hasConfirm &&
                    dialogPresence.hasWpCardInteractive &&
                    errors.length === 0;

  console.log('VERIFICATION SUMMARY:', {
    pointsCorrect,
    chipsLogicWorking: chipsAfterMinus === 2 && chipsAfterPlus === 4 && challengeRes.success,
    dialogPresence,
    consoleErrorsCount: errors.length,
    ALL_TESTS_PASSED: allPassed
  });

  // Restore default wallpaper stage points cleanly
  botManager.setWallpaperStagePoints({ 1: 4, 2: 3, 3: 2, 4: 1 });

  win.destroy();
  app.quit();
  process.exit(allPassed ? 0 : 1);
});
