process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const assert = require('assert');
const botManager = require('../src/bot/botManager');
const StreamServer = require('../src/streamServer');

app.whenReady().then(async () => {
  console.log('========================================================');
  console.log('  TEST WALLPAPER TITLE UNBLURRED IN GAME VIEW (V5.1.002)');
  console.log('========================================================\n');

  // Start HTTP stream server properly with state callback
  const streamServer = new StreamServer(() => botManager.getState());
  streamServer.start();

  // Create game view window
  const gameWin = new BrowserWindow({
    width: 1360,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../src/preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const gameErrors = [];
  gameWin.webContents.on('console-message', (e, level, msg) => {
    if (msg.includes('Electron Security Warning')) return;
    if (level >= 2 || msg.includes('Error')) gameErrors.push(msg);
  });

  // Create stream view window
  const streamWin = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const streamErrors = [];
  streamWin.webContents.on('console-message', (e, level, msg) => {
    if (msg.includes('Electron Security Warning')) return;
    if (level >= 2 || msg.includes('Error')) streamErrors.push(msg);
  });

  // IPC mock handlers
  ipcMain.handle('get-config', () => require('../src/config/configManager').loadConfig());
  ipcMain.handle('save-config', (e, c) => require('../src/config/configManager').saveConfig(c));
  ipcMain.handle('get-guilds', () => []);
  ipcMain.handle('get-channels', () => ({ text: [], voice: [] }));
  ipcMain.handle('get-game-state', () => botManager.getState());
  ipcMain.handle('set-game-mode', (e, mode) => botManager.setGameMode(mode));
  ipcMain.handle('check-for-updates', () => ({ success: true, updateAvailable: false, currentVersion: 'v5.1.002' }));

  botManager.on('game-state', (state) => {
    if (!gameWin.isDestroyed()) {
      gameWin.webContents.send('game-state', state);
    }
    streamServer.broadcast(state);
  });

  // Load windows
  await gameWin.loadFile(path.join(__dirname, '../src/renderer/index.html'));
  await streamWin.loadURL('http://localhost:8888/stream.html');
  await new Promise(r => setTimeout(r, 600));

  console.log('[STEP 1] Setting Wallpaper round with movieTitle: "Interstellar" (resolved: false)...');
  await botManager.setGameMode('wallpaper');
  botManager.setWallpaperRound({
    stages: { 1: path.join(__dirname, '../App.png'), 2: path.join(__dirname, '../App.png') },
    sharpImage: path.join(__dirname, '../App.png'),
    movieTitle: 'Interstellar'
  });
  botManager.emitState();
  await new Promise(r => setTimeout(r, 600));

  // Check Game View (Host)
  console.log('[STEP 2] Verifying Game View (Host): Title must NOT be blurred and clearly readable...');
  const gameViewCheck = await gameWin.webContents.executeJavaScript(`
    (() => {
      const el = document.getElementById('arenaWpClapperTitle');
      const text = el?.textContent || '';
      const hasBlurredClass = el?.classList.contains('film-blurred') || false;
      const hasRevealedClass = el?.classList.contains('film-revealed') || false;
      const computed = window.getComputedStyle(el);
      const computedFilter = computed.filter || '';
      const txtMovieTitleVal = document.getElementById('txtWpMovieTitle')?.value || '';
      return { text, hasBlurredClass, hasRevealedClass, computedFilter, txtMovieTitleVal };
    })()
  `);
  console.log('Game view results:', gameViewCheck);

  assert.strictEqual(gameViewCheck.text.includes('Interstellar'), true, 'Host must see movie title "Interstellar"');
  assert.strictEqual(gameViewCheck.hasBlurredClass, false, 'Host title MUST NOT have class "film-blurred"');
  assert.strictEqual(gameViewCheck.computedFilter.includes('blur(15px)'), false, 'Host title MUST NOT have 15px blur filter');
  assert.strictEqual(gameViewCheck.txtMovieTitleVal, 'Interstellar', 'Sidebar input must reflect current movie title');
  console.log('✓ Step 2 Passed: Movie title in Game View is 100% unblurred and readable!\n');

  // Check Stream View (Audience)
  console.log('[STEP 3] Verifying Stream View (OBS): Title MUST be censored/blurred for viewers during round...');
  const streamViewCheck = await streamWin.webContents.executeJavaScript(`
    (() => {
      const el = document.getElementById('streamWpClapperTitle');
      const text = el?.innerText || '';
      const hasBlurredClass = el?.classList.contains('film-blurred') || false;
      return { text, hasBlurredClass };
    })()
  `);
  console.log('Stream view results (unresolved):', streamViewCheck);

  assert.strictEqual(streamViewCheck.hasBlurredClass, true, 'Stream clapperTitle MUST have class "film-blurred"');
  assert.strictEqual(streamViewCheck.text.includes('Interstellar'), false, 'Stream view MUST NOT leak "Interstellar" while unresolved');
  assert.strictEqual(streamViewCheck.text.includes('██████████'), true, 'Stream view MUST show censored block');
  console.log('✓ Step 3 Passed: Stream overlay remains securely censored during active round!\n');

  // Resolve Wallpaper
  console.log('[STEP 4] Resolving Wallpaper and checking both views...');
  await botManager.resolveWallpaper();
  botManager.emitState();
  await new Promise(r => setTimeout(r, 600));

  const gameResolved = await gameWin.webContents.executeJavaScript(`
    (() => {
      const el = document.getElementById('arenaWpClapperTitle');
      const text = el?.textContent || '';
      const overlayVisible = !document.getElementById('arenaWpResolvedOverlay')?.classList.contains('hidden');
      return { text, overlayVisible };
    })()
  `);
  const streamResolved = await streamWin.webContents.executeJavaScript(`
    (() => {
      const el = document.getElementById('streamWpClapperTitle');
      const text = el?.innerText || '';
      const hasBlurredClass = el?.classList.contains('film-blurred') || false;
      return { text, hasBlurredClass };
    })()
  `);

  console.log('Resolved results:', { gameResolved, streamResolved });
  assert.strictEqual(gameResolved.text.includes('Interstellar'), true, 'Game view keeps title upon resolution');
  assert.strictEqual(gameResolved.overlayVisible, true, 'Game view shows resolution overlay');
  assert.strictEqual(streamResolved.hasBlurredClass, false, 'Stream view unblurs upon resolution');
  assert.strictEqual(streamResolved.text.includes('Interstellar'), true, 'Stream view shows title upon resolution');
  console.log('✓ Step 4 Passed: Both views handle resolution correctly!\n');

  console.log('========================================================');
  console.log('🎉 ALL V5.1.002 UNBLURRED WALLPAPER TITLE TESTS PASSED!');
  console.log('========================================================\n');

  streamServer.stop();
  gameWin.destroy();
  streamWin.destroy();
  app.quit();
  process.exit(0);
});
