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
  ipcMain.handle('place-hitster-card', (e, slot) => botManager.placeHitsterCard(slot));
  ipcMain.handle('resolve-hitster-card', () => botManager.resolveHitsterCard());
  ipcMain.handle('resolve-wallpaper', () => botManager.resolveWallpaper());
  ipcMain.handle('upload-wallpaper', (e, fp, title) => botManager.uploadWallpaper(fp, title));

  botManager.on('game-state', (state) => {
    if (!win.isDestroyed()) {
      win.webContents.send('game-state', state);
    }
  });

  await win.loadFile(path.join(__dirname, '../src/renderer/index.html'));
  await new Promise(r => setTimeout(r, 1000));

  console.log('[TEST HITSTER CHRONOLOGY]');
  await botManager.setGameMode('hitster');
  
  // Setup baseline cards on timeline: 1980 and 2000
  botManager.gameState.hitsterState.timeline = [
    { year: 1980, title: 'Back in Black', artist: 'AC/DC' },
    { year: 2000, title: 'In the End', artist: 'Linkin Park' }
  ];
  
  // Set current mystery card: 1991 Nirvana
  botManager.gameState.hitsterState.currentCard = {
    year: 1991,
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    revealed: false
  };

  // Set active player
  botManager.gameState.scores['player-h'] = {
    id: 'player-h',
    username: 'MusicGeek',
    avatar: '',
    points: 0,
    cards: 2
  };
  botManager.gameState.activePlayer = {
    id: 'player-h',
    username: 'MusicGeek',
    avatar: '',
    buzzedAt: Date.now()
  };

  // Place at slot 1 (between 1980 and 2000) -> 1991 is between 1980 and 2000, so correct!
  const placementRes = await botManager.placeHitsterCard(1);
  console.log('Placement result (slot 1 for 1991):', placementRes.success, 'Correct?:', placementRes.correct);

  const timelineYears = botManager.gameState.hitsterState.timeline.map(c => c.year);
  console.log('Timeline order after placement:', timelineYears);

  const hitsterCorrect = placementRes.correct &&
                         timelineYears.length === 3 &&
                         timelineYears[0] === 1980 &&
                         timelineYears[1] === 1991 &&
                         timelineYears[2] === 2000;

  console.log('[TEST WALLPAPER STAGES & RESOLUTION]');
  await botManager.setGameMode('wallpaper');
  botManager.gameState.wallpaperState = {
    imagePath: path.join(__dirname, '../App.png'),
    movieTitle: 'Inception',
    stage: 2,
    points: 35,
    resolved: false
  };
  botManager.emitState();
  await new Promise(r => setTimeout(r, 200));

  const wpStageCheck = await win.webContents.executeJavaScript(`
    (() => {
      const stageText = document.getElementById('arenaWpStageText')?.textContent;
      const wpImg = document.getElementById('arenaWpCinemaImg');
      const hasBlur2 = wpImg && wpImg.classList.contains('blur-stage-2');
      return { stageText, hasBlur2 };
    })()
  `);
  console.log('Wallpaper stage 2 check:', wpStageCheck);

  // Resolve wallpaper
  await botManager.resolveWallpaper();
  await new Promise(r => setTimeout(r, 200));

  const wpResolvedCheck = await win.webContents.executeJavaScript(`
    (() => {
      const resolvedTitle = document.getElementById('arenaWpResolvedTitle')?.textContent;
      const overlayVisible = !document.getElementById('arenaWpResolvedOverlay')?.classList.contains('hidden');
      const wpImg = document.getElementById('arenaWpCinemaImg');
      const hasBlur5 = wpImg && wpImg.classList.contains('blur-stage-5');
      return { resolvedTitle, overlayVisible, hasBlur5 };
    })()
  `);
  console.log('Wallpaper resolved check:', wpResolvedCheck);

  const wpPassed = wpStageCheck.hasBlur2 && wpResolvedCheck.overlayVisible && wpResolvedCheck.hasBlur5;

  const totalPassed = hitsterCorrect && wpPassed && errors.length === 0;
  console.log('--- HITSTER & WALLPAPER TEST RESULT:', totalPassed ? 'PASSED (100% OK)' : 'FAILED', '---');

  app.quit();
  process.exit(totalPassed ? 0 : 1);
});
