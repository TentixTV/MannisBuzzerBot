process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

console.log('========================================================');
console.log('  MANNISBOX V5.0.006 - LEGAL MODALS, SVG ANIMATIONS & GOAL UI TEST');
console.log('========================================================\n');

// 1. Static code check in index.html
console.log('[STEP 1] Verifying index.html modal elements and SVG markup...');
const htmlContent = fs.readFileSync(path.join(__dirname, '../src/renderer/index.html'), 'utf8');

assert.strictEqual(htmlContent.includes('id="appInfoLegalModal"'), true, 'appInfoLegalModal must exist');
assert.strictEqual(htmlContent.includes('id="changelogModal"'), true, 'changelogModal must exist');
assert.strictEqual(htmlContent.includes('id="goalSettingsModal"'), true, 'goalSettingsModal must exist');
assert.strictEqual(htmlContent.includes('id="btnSettingsViewChangelog"'), true, 'btnSettingsViewChangelog must exist');
assert.strictEqual(htmlContent.includes('id="titlebarVersionTag"'), true, 'titlebarVersionTag must exist');
assert.strictEqual(htmlContent.includes('id="brandVersionTag"'), true, 'brandVersionTag must exist');
assert.strictEqual(htmlContent.includes('id="lblSettingsCurrentVersion"'), true, 'lblSettingsCurrentVersion must exist');

// Check SVG elements
assert.strictEqual(htmlContent.includes('anim-svg-cookie'), true, 'anim-svg-cookie SVG must exist');
assert.strictEqual(htmlContent.includes('bite-1'), true, 'bite-1 must exist');
assert.strictEqual(htmlContent.includes('bite-4'), true, 'bite-4 must exist');
assert.strictEqual(htmlContent.includes('anim-svg-privacy'), true, 'anim-svg-privacy SVG must exist');
assert.strictEqual(htmlContent.includes('privacy-lock-group'), true, 'privacy-lock-group must exist');
assert.strictEqual(htmlContent.includes('anim-svg-gavel'), true, 'anim-svg-gavel SVG must exist');
assert.strictEqual(htmlContent.includes('gavel-arm'), true, 'gavel-arm must exist');
assert.strictEqual(htmlContent.includes('btn-score-quick-pill'), true, 'btn-score-quick-pill must exist');
assert.strictEqual(htmlContent.includes('lblGoalCounterDigits'), true, 'lblGoalCounterDigits must exist');

// Check Copyright notice & Year 2026 & TENTIX
assert.strictEqual(htmlContent.includes('2026 TENTIX'), true, 'Copyright notice must mention 2026 TENTIX');
assert.strictEqual(htmlContent.includes('copyright-icon'), true, 'Vector copyright icon must exist');

// Check Official Tech Stack Logos & Badges
assert.strictEqual(htmlContent.includes('aria-label="JavaScript Logo"'), true, 'JavaScript official logo must exist');
assert.strictEqual(htmlContent.includes('aria-label="Node.js Logo"'), true, 'Node.js official logo must exist');
assert.strictEqual(htmlContent.includes('aria-label="Electron Logo"'), true, 'Electron official logo must exist');
assert.strictEqual(htmlContent.includes('aria-label="HTML5 Logo"'), true, 'HTML5 official logo must exist');
assert.strictEqual(htmlContent.includes('aria-label="CSS3 Logo"'), true, 'CSS3 official logo must exist');
assert.strictEqual(htmlContent.includes('aria-label="WebGL / Three.js Logo"'), true, 'WebGL / Three.js official logo must exist');
assert.strictEqual(htmlContent.includes('aria-label="Discord Logo"'), true, 'Discord official logo must exist');
assert.strictEqual(htmlContent.includes('aria-label="FFmpeg Logo"'), true, 'FFmpeg official logo must exist');

// Check Comprehensive German Legal Texts
assert.strictEqual(htmlContent.includes('TTDSG'), true, 'Cookies must reference TTDSG / TDDDG');
assert.strictEqual(htmlContent.includes('mannisbox_config.json'), true, 'Cookies must detail mannisbox_config.json storage');
assert.strictEqual(htmlContent.includes('DSGVO'), true, 'Datenschutz must reference DSGVO');
assert.strictEqual(htmlContent.includes('DDG'), true, 'Impressum must reference DDG');
assert.strictEqual(htmlContent.includes('Haftungsausschluss'), true, 'Impressum must feature complete liability disclaimer');

console.log('✓ Step 1 Passed: All HTML modal elements, tech logos, legal texts, and copyright structures present.\n');

// 2. Static CSS animation keyframes check
console.log('[STEP 2] Verifying style.css CSS keyframe animations and styling...');
const cssContent = fs.readFileSync(path.join(__dirname, '../src/renderer/style.css'), 'utf8');

assert.strictEqual(cssContent.includes('@keyframes cookieBite1'), true, 'cookieBite1 keyframe must exist');
assert.strictEqual(cssContent.includes('@keyframes cookieBite4'), true, 'cookieBite4 keyframe must exist');
assert.strictEqual(cssContent.includes('@keyframes cookieCrumbsBurst'), true, 'cookieCrumbsBurst keyframe must exist');
assert.strictEqual(cssContent.includes('@keyframes cookieHecticCrunch'), true, 'cookieHecticCrunch keyframe must exist');
assert.strictEqual(cssContent.includes('@keyframes lockFlyAndClose'), true, 'lockFlyAndClose keyframe must exist');
assert.strictEqual(cssContent.includes('@keyframes shackleSnap'), true, 'shackleSnap keyframe must exist');
assert.strictEqual(cssContent.includes('@keyframes smoothGavelStrike'), true, 'smoothGavelStrike keyframe must exist');
assert.strictEqual(cssContent.includes('@keyframes gavelWaveExpand'), true, 'gavelWaveExpand keyframe must exist');
assert.strictEqual(cssContent.includes('@keyframes versionGradientShimmer'), true, 'versionGradientShimmer keyframe must exist');

console.log('✓ Step 2 Passed: All required CSS animations verified.\n');

// 3. Electron Window DOM & Interaction Test
app.whenReady().then(async () => {
  let win = null;
  try {
    ipcMain.handle('check-for-updates', async () => {
      return { success: true, updateAvailable: false, currentVersion: 'v5.0.006', latestVersion: 'v5.0.006' };
    });
    ipcMain.handle('get-config', async () => {
      return { botToken: 'mock', guildId: 'mock' };
    });
    ipcMain.handle('set-goal', async (event, val) => {
      return { success: true, goal: val };
    });

    console.log('[STEP 3] Launching Electron to test DOM interactive behaviors...');
    win = new BrowserWindow({
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
    win.webContents.on('console-message', (event, level, message) => {
      if (level >= 3 && !message.includes('Autofocus processing') && !message.includes('AudioContext') && !message.includes('No handler registered')) {
        domErrors.push(message);
      }
    });

    await win.loadFile(path.join(__dirname, '../src/renderer/index.html'));
    await new Promise(r => setTimeout(r, 600));

    const testResults = await win.webContents.executeJavaScript(`
      (async () => {
        const results = {};

        // 1. Version tags exist and display V5.0.006
        const titlebarTag = document.getElementById('titlebarVersionTag');
        const brandTag = document.getElementById('brandVersionTag');
        const settingsTag = document.getElementById('lblSettingsCurrentVersion');
        results.titlebarTagText = titlebarTag ? titlebarTag.textContent.trim() : null;
        results.brandTagText = brandTag ? brandTag.textContent.trim() : null;
        results.settingsTagText = settingsTag ? settingsTag.textContent.trim() : null;

        // Quick Score Popup must be strictly hidden (display: none)
        const quickScorePopup = document.getElementById('quickScoreEditorPopup');
        results.quickScoreComputedDisplay = quickScorePopup ? window.getComputedStyle(quickScorePopup).display : null;
        results.quickScoreHasHidden = quickScorePopup ? quickScorePopup.classList.contains('hidden') : false;

        // 2. Click titlebarVersionTag -> appInfoLegalModal opens
        const appInfoModal = document.getElementById('appInfoLegalModal');
        results.appInfoInitialHidden = appInfoModal.classList.contains('hidden');
        titlebarTag.click();
        results.appInfoOpened = !appInfoModal.classList.contains('hidden');

        // Copyright notice check
        const copyrightEl = document.querySelector('.app-info-copyright');
        results.copyrightNotice = copyrightEl ? copyrightEl.textContent.trim() : null;

        // Tech stack cards and logos check
        results.techCardCount = document.querySelectorAll('#tabTechStack .tech-card').length;
        results.techLogoCount = document.querySelectorAll('#tabTechStack .tech-card-logo').length;

        // 3. Test tab switching in appInfoLegalModal
        const tabCookiesBtn = document.querySelector('.app-info-tab[data-tab="tabCookies"]');
        if (tabCookiesBtn) tabCookiesBtn.click();
        const tabCookiesPane = document.getElementById('tabCookies');
        results.tabCookiesActive = tabCookiesPane && tabCookiesPane.classList.contains('active');

        const tabImpressumBtn = document.querySelector('.app-info-tab[data-tab="tabImpressum"]');
        if (tabImpressumBtn) tabImpressumBtn.click();
        const tabImpressumPane = document.getElementById('tabImpressum');
        results.tabImpressumActive = tabImpressumPane && tabImpressumPane.classList.contains('active');

        // Close appInfoLegalModal
        const btnAppInfoClose = document.getElementById('btnAppInfoClose');
        btnAppInfoClose.click();
        results.appInfoClosed = appInfoModal.classList.contains('hidden');

        // 4. Click btnSettingsViewChangelog -> changelogModal opens
        const btnChangelog = document.getElementById('btnSettingsViewChangelog');
        const changelogModal = document.getElementById('changelogModal');
        results.changelogInitialHidden = changelogModal.classList.contains('hidden');
        btnChangelog.click();
        results.changelogOpened = !changelogModal.classList.contains('hidden');
        const btnChangelogClose = document.getElementById('btnChangelogClose');
        btnChangelogClose.click();
        results.changelogClosed = changelogModal.classList.contains('hidden');

        // 5. Goal modal interaction
        const goalBadge = document.getElementById('goalBadgeContainer');
        const goalModal = document.getElementById('goalSettingsModal');
        results.goalModalInitialHidden = goalModal.classList.contains('hidden');
        goalBadge.click();
        results.goalModalOpened = !goalModal.classList.contains('hidden');

        // Stepper +10
        const stepPlus10 = document.querySelector('.btn-goal-step[data-delta="10"]');
        const inpGoal = document.getElementById('inpGoalDirectValue');
        const digitsGoal = document.getElementById('lblGoalCounterDigits');
        const beforeVal = parseInt(inpGoal.value, 10);
        stepPlus10.click();
        results.stepperWorked = (parseInt(inpGoal.value, 10) === beforeVal + 10) && (parseInt(digitsGoal.textContent, 10) === beforeVal + 10);

        // Preset click
        const preset25 = document.querySelector('.btn-goal-preset[data-val="25"]');
        preset25.click();
        results.presetWorked = (parseInt(inpGoal.value, 10) === 25) && (parseInt(digitsGoal.textContent, 10) === 25) && preset25.classList.contains('active');

        // Close goal modal
        const btnGoalClose = document.getElementById('btnGoalModalClose');
        btnGoalClose.click();
        results.goalModalClosed = goalModal.classList.contains('hidden');

        return results;
      })()
    `);

    console.log('Interactive DOM results:', testResults);

    assert.strictEqual(testResults.titlebarTagText, 'V5.0.006', 'Titlebar tag must be V5.0.006');
    assert.strictEqual(testResults.brandTagText, 'V5.0.006', 'Brand tag must be V5.0.006');
    assert.strictEqual(testResults.settingsTagText, 'V5.0.006', 'Settings pill must be V5.0.006');
    assert.strictEqual(testResults.quickScoreComputedDisplay, 'none', 'quickScoreEditorPopup MUST have computed display: none');
    assert.strictEqual(testResults.quickScoreHasHidden, true, 'quickScoreEditorPopup must have hidden class');
    assert.strictEqual(testResults.appInfoOpened, true, 'App info modal must open on version click');
    assert.ok(testResults.copyrightNotice && testResults.copyrightNotice.includes('2026 TENTIX'), 'Copyright notice must contain 2026 TENTIX');
    assert.strictEqual(testResults.techCardCount, 8, 'Must have 8 tech stack cards');
    assert.strictEqual(testResults.techLogoCount, 8, 'Must have 8 official tech stack vector logos');
    assert.strictEqual(testResults.tabCookiesActive, true, 'Cookies tab must activate properly');
    assert.strictEqual(testResults.tabImpressumActive, true, 'Impressum tab must activate properly');
    assert.strictEqual(testResults.appInfoClosed, true, 'App info modal must close');
    assert.strictEqual(testResults.changelogOpened, true, 'Changelog modal must open');
    assert.strictEqual(testResults.changelogClosed, true, 'Changelog modal must close');
    assert.strictEqual(testResults.goalModalOpened, true, 'Goal modal must open on goal click');
    assert.strictEqual(testResults.stepperWorked, true, 'Goal stepper +10 must work correctly');
    assert.strictEqual(testResults.presetWorked, true, 'Goal preset 25 must work correctly');
    assert.strictEqual(testResults.goalModalClosed, true, 'Goal modal must close');
    assert.strictEqual(domErrors.length, 0, 'No DOM console errors allowed');

    console.log('\n========================================================');
    console.log('🎉 ALL LEGAL MODALS, SVG ANIMATIONS & GOAL UI TESTS PASSED!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  } finally {
    if (win) win.destroy();
    app.quit();
    process.exit(0);
  }
});
