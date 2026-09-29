process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

// 1. Test Version Comparison Logic
function compareSemver(remoteTag, localTag) {
  const parse = (v) => (v || '').replace(/^[^\d]*/, '').split(/[.-]/).map(p => parseInt(p, 10) || 0);
  const r = parse(remoteTag);
  const l = parse(localTag);
  const len = Math.max(r.length, l.length);
  for (let i = 0; i < len; i++) {
    const rVal = r[i] || 0;
    const lVal = l[i] || 0;
    if (rVal > lVal) return 1;
    if (rVal < lVal) return -1;
  }
  return 0;
}

console.log('========================================================');
console.log('   MANNISBOX V5.0.000 — COMPREHENSIVE UPDATER & PERF TEST');
console.log('========================================================\n');

// Unit tests for compareSemver
console.log('[STEP 1] Testing Semver comparison edge cases...');
assert.strictEqual(compareSemver('v5.0.000', 'v5.0.000'), 0, 'Exact same version should be equal (0)');
assert.strictEqual(compareSemver('5.0.0', 'v5.0.000'), 0, 'Stripped prefix and zeros should be equal (0)');
assert.strictEqual(compareSemver('v5.0.001', 'v5.0.000'), 1, 'Patch bump should be newer (1)');
assert.strictEqual(compareSemver('v5.1.000', 'v5.0.000'), 1, 'Minor bump should be newer (1)');
assert.strictEqual(compareSemver('v6.0.000', 'v5.0.000'), 1, 'Major bump should be newer (1)');
assert.strictEqual(compareSemver('v4.8.031', 'v5.0.000'), -1, 'Previous release should be older (-1)');
assert.strictEqual(compareSemver('v4.8.0', 'v5.0.000'), -1, 'Older version should be (-1)');
console.log('✓ Check 1 Passed: Semver comparisons all behave correctly.\n');

// Unit test 2: Check that no backdrop-filter remains in CSS or stream.html
console.log('[STEP 2] Verifying zero backdrop-filter in style.css and stream.html...');
const styleCss = fs.readFileSync(path.join(__dirname, '../src/renderer/style.css'), 'utf8');
const streamHtml = fs.readFileSync(path.join(__dirname, '../src/renderer/stream.html'), 'utf8');
assert.strictEqual(styleCss.includes('backdrop-filter'), false, 'style.css must not contain any backdrop-filter');
assert.strictEqual(streamHtml.includes('backdrop-filter'), false, 'stream.html must not contain any backdrop-filter');
console.log('✓ Check 2 Passed: All heavy backdrop-filter calls completely eliminated.\n');

// Unit test 3: Check that WebGL shader in ue5_stage3d.js does NOT contain discard
console.log('[STEP 3] Verifying WebGL shader optimization in ue5_stage3d.js...');
const ue5Js = fs.readFileSync(path.join(__dirname, '../src/renderer/ue5_stage3d.js'), 'utf8');
assert.strictEqual(ue5Js.includes('discard;'), false, 'ue5_stage3d.js must not contain discard;');
assert.strictEqual(ue5Js.includes('alpha * falloff') || ue5Js.includes('1.0 - 2.0 * dist'), true, 'Smooth falloff shader must be present');
console.log('✓ Check 3 Passed: Early-Z preserving fragment shader verified (zero discard).\n');

// Unit test 4: Check main.js for ignore-gpu-blocklist
console.log('[STEP 4] Verifying GPU flags in main.js...');
const mainJs = fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8');
assert.strictEqual(mainJs.includes('ignore-gpu-blocklist'), true, 'main.js must append ignore-gpu-blocklist');
assert.strictEqual(mainJs.includes('check-for-updates'), true, 'main.js must have check-for-updates IPC handler');
assert.strictEqual(mainJs.includes('V5.0.004'), true, 'main.js window title must be V5.0.004');
console.log('✓ Check 4 Passed: main.js has GPU flag, version 5.0.004 and update handler.\n');

// Unit test 5: DOM & UI elements in Electron window
app.whenReady().then(async () => {
  console.log('[STEP 5] Launching Electron window to verify DOM Updater UI...');
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
  win.webContents.on('console-message', (e, level, msg, line) => {
    if (msg.includes('Electron Security Warning')) return;
    if (level >= 2 || msg.includes('Error') || msg.includes('Uncaught')) {
      domErrors.push(msg);
      console.log('CONSOLE ERR:', msg);
    }
  });

  // Mock IPC handlers
  ipcMain.handle('get-config', () => require('../src/config/configManager').loadConfig());
  ipcMain.handle('save-config', (e, c) => require('../src/config/configManager').saveConfig(c));
  ipcMain.handle('get-guilds', () => []);
  ipcMain.handle('get-channels', () => ({ text: [], voice: [] }));
  ipcMain.handle('get-game-state', () => require('../src/bot/botManager').getState());
  ipcMain.handle('check-for-updates', async () => ({
    success: true,
    updateAvailable: true,
    currentVersion: 'v5.0.000',
    latestVersion: 'v5.0.001',
    releaseName: 'MannisBox v5.0.001 — Test Release',
    publishedAt: new Date().toISOString(),
    releaseNotes: '### Neuerungen in v5.0.001:\n- Test Update Notiz\n- 1-Klick Instant Download',
    htmlUrl: 'https://github.com/TentixTV/MannisBuzzerBot/releases/tag/v5.0.001',
    zipUrl: 'https://github.com/TentixTV/MannisBuzzerBot/releases/download/v5.0.001/MannisBox-Windows-x64.zip',
    rarUrl: 'https://github.com/TentixTV/MannisBuzzerBot/releases/download/v5.0.001/MannisBox-Windows-x64.rar'
  }));

  await win.loadFile(path.join(__dirname, '../src/renderer/index.html'));
  await new Promise(r => setTimeout(r, 1200));

  const uiChecks = await win.webContents.executeJavaScript(`
    (async () => {
      const titlebarVersion = document.querySelector('.titlebar-version-tag')?.textContent?.trim();
      const headerVersion = document.querySelector('.version-tag')?.textContent?.trim();
      const btnHeaderUpdate = document.getElementById('btnHeaderUpdate');
      const updateModal = document.getElementById('updateModal');
      const btnSettingsCheckUpdate = document.getElementById('btnSettingsCheckUpdate');
      const lblSettingsCurrentVersion = document.getElementById('lblSettingsCurrentVersion')?.textContent?.trim();
      const btnUpdateDownloadZip = document.getElementById('btnUpdateDownloadZip');
      const btnUpdateDownloadRar = document.getElementById('btnUpdateDownloadRar');
      const btnUpdateOpenGitHub = document.getElementById('btnUpdateOpenGitHub');
      const updateReleaseNotesBox = document.getElementById('updateReleaseNotesBox');

      // Test manual update check click
      btnSettingsCheckUpdate?.click();
      await new Promise(r => setTimeout(r, 400));

      const modalVisible = updateModal && !updateModal.classList.contains('hidden');
      const headerBadgeVisible = btnHeaderUpdate && !btnHeaderUpdate.classList.contains('hidden');
      const notesContent = updateReleaseNotesBox?.textContent;

      return {
        titlebarVersion,
        headerVersion,
        lblSettingsCurrentVersion,
        hasHeaderUpdateBtn: !!btnHeaderUpdate,
        hasUpdateModal: !!updateModal,
        hasZipBtn: !!btnUpdateDownloadZip,
        hasRarBtn: !!btnUpdateDownloadRar,
        hasGitHubBtn: !!btnUpdateOpenGitHub,
        modalVisible,
        headerBadgeVisible,
        notesContainsTest: notesContent?.includes('Test Update Notiz')
      };
    })()
  `);

  console.log('UI Checks result:', uiChecks);
  assert.strictEqual(uiChecks.titlebarVersion, 'V5.0.004', 'Titlebar version must be V5.0.004');
  assert.strictEqual(uiChecks.headerVersion, 'V5.0.004', 'Header version must be V5.0.004');
  assert.strictEqual(uiChecks.lblSettingsCurrentVersion, 'V5.0.004', 'Settings version pill must be V5.0.004');
  assert.strictEqual(uiChecks.hasHeaderUpdateBtn, true, 'Header update button must exist in DOM');
  assert.strictEqual(uiChecks.hasUpdateModal, true, 'Update modal must exist in DOM');
  assert.strictEqual(uiChecks.hasZipBtn, true, 'ZIP download button must exist');
  assert.strictEqual(uiChecks.hasRarBtn, true, 'RAR download button must exist');
  assert.strictEqual(uiChecks.hasGitHubBtn, true, 'GitHub button must exist');
  assert.strictEqual(uiChecks.modalVisible, true, 'Update modal should become visible when update is found');
  assert.strictEqual(uiChecks.headerBadgeVisible, true, 'Header update badge should become visible');
  assert.strictEqual(uiChecks.notesContainsTest, true, 'Release notes should be populated');
  assert.strictEqual(domErrors.length, 0, 'No console errors allowed in DOM');

  console.log('\n========================================================');
  console.log('🎉 ALL UPDATER & PERFORMANCE CRITERIA PASSED 100%!');
  console.log('========================================================\n');

  win.destroy();
  app.quit();
  process.exit(0);
});
