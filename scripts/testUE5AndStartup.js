process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Mock any missing IPC handlers so renderer runs without full bot
ipcMain.handle('get-config', () => ({ botToken: '', guildId: '', textChannelId: '', voiceChannelId: '', soundVolume: 0.8 }));
ipcMain.handle('get-game-state', () => ({ gameMode: null, isRoundActive: false, isLocked: true, scores: {}, voiceMembers: [] }));
ipcMain.handle('set-game-mode', (e, mode) => ({ success: true, mode }));
ipcMain.handle('save-config', (e, c) => c);
ipcMain.handle('start-bot', () => ({ success: true }));
ipcMain.handle('get-guilds', () => []);
ipcMain.handle('get-stream-url', () => 'http://localhost:8888/stream.html');
ipcMain.handle('manual-buzz-player', () => ({ success: true }));
ipcMain.handle('toggle-boost', () => ({ success: true }));
ipcMain.handle('set-goal', () => ({ success: true }));

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1360,
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
    } else {
      console.log('CONSOLE LOG:', msg);
    }
  });

  await win.loadFile(path.join(__dirname, '../src/renderer/index.html'));
  await new Promise(r => setTimeout(r, 1200));

  // Run DOM & Logic checks inside renderer
  const results = await win.webContents.executeJavaScript(`
    (() => {
      const hasUE5Stage = !!window.ue5StageInstance;
      const startupGate = document.getElementById('startupGateModal');
      const ue5Canvas = document.getElementById('ue5Canvas');
      const btnHit = document.getElementById('btnModeHitster');
      const btnWp = document.getElementById('btnModeWallpaper');
      const btnSong = document.getElementById('btnModeSong');
      const physicalBuzzer = document.getElementById('btnPhysicalBuzzer');
      const cardHitster = document.getElementById('cardSelectHitster');
      const cardSong = document.getElementById('cardSelectSong');
      const flippableCard = document.getElementById('hitster3DFlippableCard');

      const arenaBoardSong = document.getElementById('arenaBoardSong');
      const arenaBoardHitster = document.getElementById('arenaBoardHitster');
      const arenaBoardWallpaper = document.getElementById('arenaBoardWallpaper');
      const cinemaImg = document.getElementById('arenaWpCinemaImg');
      const torxBolts = document.querySelectorAll('.bezel-bolt');

      const gateVisibleBefore = !startupGate.classList.contains('hidden');

      // 1. Click Hitster on 3D startup gate
      cardHitster.click();

      const gateHiddenAfter = startupGate.classList.contains('hidden');
      const btnHitActive = btnHit.classList.contains('active');
      const boardHitsterVisible = !arenaBoardHitster.classList.contains('hidden');
      const boardSongHiddenInHitster = arenaBoardSong.classList.contains('hidden');

      // 2. Click Wallpaper Mode
      btnWp.click();
      const boardWpVisible = !arenaBoardWallpaper.classList.contains('hidden');
      const boardHitsterHiddenInWp = arenaBoardHitster.classList.contains('hidden');

      // 3. Click Song Mode
      btnSong.click();
      const boardSongVisible = !arenaBoardSong.classList.contains('hidden');
      const boardWpHiddenInSong = arenaBoardWallpaper.classList.contains('hidden');

      // Test physical buzzer click
      physicalBuzzer.click();
      const buzzerExists = !!physicalBuzzer;
      const boltCount = torxBolts.length;

      return {
        gateVisibleBefore,
        gateHiddenAfter,
        btnHitActive,
        boardHitsterVisible,
        boardSongHiddenInHitster,
        boardWpVisible,
        boardHitsterHiddenInWp,
        boardSongVisible,
        boardWpHiddenInSong,
        buzzerExists,
        boltCount,
        hasUE5Stage,
        hasCanvas: !!ue5Canvas
      };
    })()
  `);

  console.log('[TEST RESULT]:', JSON.stringify(results));
  console.log('[TOTAL CONSOLE ERRORS]:', errors.length);

  app.quit();
  process.exit(errors.length === 0 ? 0 : 1);
});
