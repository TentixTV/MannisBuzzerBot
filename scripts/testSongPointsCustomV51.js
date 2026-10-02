process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const assert = require('assert');
const botManager = require('../src/bot/botManager');
const { loadConfig, saveConfig } = require('../src/config/configManager');

app.whenReady().then(async () => {
  console.log('========================================================');
  console.log('  TEST SONG POINTS SYNC & CUSTOM BUTTON (V5.1.000)');
  console.log('========================================================\n');

  // 1. Test Config defaults
  console.log('[STEP 1] Testing config defaults...');
  const { defaultConfig } = require('../src/config/configManager');
  assert.strictEqual(defaultConfig.points.correct, 2, 'Default correct points must be 2 (Teils)');
  assert.strictEqual(defaultConfig.points.perfect, 4, 'Default perfect points must be 4 (Vollständig)');
  assert.strictEqual(defaultConfig.points.custom, 1, 'Default custom points must be 1');

  saveConfig({ points: { correct: 2, perfect: 4, custom: 1 } });
  const cfg = loadConfig();
  assert.strictEqual(cfg.points.correct, 2, 'Loaded correct points must be 2 (Teils)');
  assert.strictEqual(cfg.points.perfect, 4, 'Loaded perfect points must be 4 (Vollständig)');
  assert.strictEqual(cfg.points.custom, 1, 'Loaded custom points must be 1');
  console.log('✓ Step 1 Passed: Config points default to 2 (Teils) and 4 (Vollständig).\n');

  // 2. Test Bot Manager Evaluation
  console.log('[STEP 2] Testing BotManager evaluation with partial, perfect, and custom points...');
  await botManager.setGameMode('song');
  botManager.updateConfig({ points: { correct: 2, perfect: 4, custom: 1 } });

  // Test Partial (default 2)
  botManager.gameState.scores['test-player-1'] = { id: 'test-player-1', username: 'ManniFan', points: 0 };
  botManager.gameState.activePlayer = { id: 'test-player-1', username: 'ManniFan' };
  await botManager.evaluateActivePlayer('correct');
  assert.strictEqual(botManager.gameState.scores['test-player-1'].points, 2, 'Partial answer awards 2 points');

  // Test Perfect (default 4)
  botManager.gameState.scores['test-player-2'] = { id: 'test-player-2', username: 'MasterQuizzer', points: 0 };
  botManager.gameState.activePlayer = { id: 'test-player-2', username: 'MasterQuizzer' };
  await botManager.evaluateActivePlayer('perfect');
  assert.strictEqual(botManager.gameState.scores['test-player-2'].points, 4, 'Perfect answer awards 4 points');

  // Test Custom Points (e.g. 5)
  botManager.gameState.scores['test-player-3'] = { id: 'test-player-3', username: 'CustomWinner', points: 0 };
  botManager.gameState.activePlayer = { id: 'test-player-3', username: 'CustomWinner' };
  await botManager.evaluateActivePlayer('custom', null, 5);
  assert.strictEqual(botManager.gameState.scores['test-player-3'].points, 5, 'Custom answer awards 5 points');

  // Test Custom Points with Boost 2X (e.g. 5 * 2 = 10)
  botManager.gameState.scores['test-player-4'] = { id: 'test-player-4', username: 'BoostedWinner', points: 0 };
  botManager.gameState.activePlayer = { id: 'test-player-4', username: 'BoostedWinner' };
  botManager.toggleBoost(true);
  assert.strictEqual(botManager.gameState.isBoostActive, true, 'Boost is active');
  await botManager.evaluateActivePlayer('custom', null, 5);
  assert.strictEqual(botManager.gameState.scores['test-player-4'].points, 10, 'Custom points doubled with boost (5 * 2 = 10)');
  assert.strictEqual(botManager.gameState.isBoostActive, false, 'Boost auto-consumed');
  console.log('✓ Step 2 Passed: BotManager accurately evaluates partial (2), perfect (4), custom (5) and boost (10).\n');

  // 3. Test Electron DOM Sync between Left side and Center Buttons
  console.log('[STEP 3] Launching Electron window to test UI Live-Sync...');
  ipcMain.handle('get-config', () => loadConfig());
  ipcMain.handle('save-config', (e, newCfg) => saveConfig(newCfg));
  ipcMain.handle('get-game-state', () => botManager.getState());
  ipcMain.handle('get-guilds', () => []);
  ipcMain.handle('get-channels', () => ({ text: [], voice: [] }));
  ipcMain.handle('window-minimize', () => {});
  ipcMain.handle('window-maximize', () => true);
  ipcMain.handle('window-close', () => {});
  ipcMain.handle('window-is-maximized', () => false);
  ipcMain.handle('check-for-updates', () => ({ success: true, updateAvailable: false }));
  ipcMain.handle('evaluate-player', async (event, arg) => {
    const action = (typeof arg === 'object' && arg !== null) ? arg.action : arg;
    const targetPlayer = (typeof arg === 'object' && arg !== null) ? arg.targetPlayer : undefined;
    const customPoints = (typeof arg === 'object' && arg !== null) ? (arg.customPoints !== undefined ? arg.customPoints : arg.points) : undefined;
    return await botManager.evaluateActivePlayer(action, targetPlayer, customPoints);
  });

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

  const domErrors = [];
  win.webContents.on('console-message', (e, level, msg) => {
    if (msg.includes('Electron Security Warning')) return;
    if (level >= 2 || msg.includes('Error')) domErrors.push(msg);
  });

  await win.loadFile(path.join(__dirname, '../src/renderer/index.html'));
  await new Promise(r => setTimeout(r, 700));

  const syncTestResults = await win.webContents.executeJavaScript(`
    (() => {
      const inpPartial = document.getElementById('inpSongPtsPartial');
      const inpPerfect = document.getElementById('inpSongPtsPerfect');
      const inpCustom = document.getElementById('inpSongPtsCustom');

      const btnPartialPlus = document.getElementById('btnSongPtsPartialPlus');
      const btnPerfectMinus = document.getElementById('btnSongPtsPerfectMinus');
      const btnCustomPlus = document.getElementById('btnSongPtsCustomPlus');

      const lblCorrectPts = document.getElementById('lblEvalCorrectPts');
      const lblPerfectPts = document.getElementById('lblEvalPerfectPts');
      const lblCustomPts = document.getElementById('lblEvalCustomPts');

      const initialCorrectText = lblCorrectPts?.textContent;
      const initialPerfectText = lblPerfectPts?.textContent;
      const initialCustomText = lblCustomPts?.textContent;

      // 1. Simulate user clicking "+" on partial points (2 -> 3)
      btnPartialPlus.click();
      const updatedCorrectText = lblCorrectPts?.textContent;

      // 2. Simulate user typing "6" into perfect points input
      inpPerfect.value = '6';
      inpPerfect.dispatchEvent(new Event('input'));
      const updatedPerfectText = lblPerfectPts?.textContent;

      // 3. Simulate user clicking "+" on custom points (1 -> 2)
      btnCustomPlus.click();
      const updatedCustomText = lblCustomPts?.textContent;

      return {
        initialCorrectText,
        initialPerfectText,
        initialCustomText,
        updatedCorrectText,
        updatedPerfectText,
        updatedCustomText,
        partialVal: inpPartial?.value,
        perfectVal: inpPerfect?.value,
        customVal: inpCustom?.value
      };
    })()
  `);

  console.log('UI Sync Results:', syncTestResults);
  assert.strictEqual(syncTestResults.initialCorrectText, '+2 Punkte', 'Initial correct button must show +2 Punkte');
  assert.strictEqual(syncTestResults.initialPerfectText, '+4 Punkte', 'Initial perfect button must show +4 Punkte');
  assert.strictEqual(syncTestResults.initialCustomText, '+1 Pkt (Custom)', 'Initial custom button must show +1 Pkt (Custom)');

  assert.strictEqual(syncTestResults.updatedCorrectText, '+3 Punkte', 'Correct button must update to +3 Punkte after click +');
  assert.strictEqual(syncTestResults.updatedPerfectText, '+6 Punkte', 'Perfect button must update to +6 Punkte after input 6');
  assert.strictEqual(syncTestResults.updatedCustomText, '+2 Pkt (Custom)', 'Custom button must update to +2 Pkt (Custom) after click +');

  assert.strictEqual(syncTestResults.partialVal, '3', 'inpPartial value must be 3');
  assert.strictEqual(syncTestResults.perfectVal, '6', 'inpPerfect value must be 6');
  assert.strictEqual(syncTestResults.customVal, '2', 'inpCustom value must be 2');

  console.log('✓ Step 3 Passed: Left side and Center evaluation buttons are 100% synchronized in real time.\n');

  console.log('========================================================');
  console.log('🎉 ALL SONG POINTS & CUSTOM BUTTON TESTS PASSED (100%)!');
  console.log('========================================================\n');

  saveConfig({ points: { correct: 2, perfect: 4, custom: 1 } });
  win.destroy();
  app.quit();
  process.exit(0);
});
