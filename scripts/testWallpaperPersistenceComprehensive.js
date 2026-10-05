const assert = require('assert');
const path = require('path');
const configManager = require('../src/config/configManager');
const botManager = require('../src/bot/botManager');

console.log('========================================================');
console.log('  TEST COMPREHENSIVE WALLPAPER POINTS & STAGES SYNC');
console.log('========================================================\n');

// 1. Initial State & Defaults
console.log('[STEP 1] Verifying default configuration...');
configManager.saveConfig({
  wallpaperStagePoints: { 1: 4, 2: 3, 3: 2, 4: 1 },
  wallpaperStageTimes: { 1: 10, 2: 10, 3: 10, 4: 10 }
});
botManager.config = configManager.loadConfig();
assert.strictEqual(botManager.config.wallpaperStagePoints[1], 4);
assert.strictEqual(botManager.config.wallpaperStagePoints[4], 1);
console.log('✓ Step 1 Passed: Default configuration verified.\n');

// 2. Custom Points Setting & Persistence
console.log('[STEP 2] Setting custom stage points (1: 15, 2: 10, 3: 5, 4: 2)...');
const resPoints = botManager.setWallpaperStagePoints({ 1: 15, 2: 10, 3: 5, 4: 2 });
assert.strictEqual(resPoints.success, true);
assert.strictEqual(botManager.gameState.wallpaperStagePoints[1], 15);
assert.strictEqual(botManager.gameState.wallpaperStagePoints[4], 2);
assert.strictEqual(botManager.gameState.wallpaperState.points, 15);
assert.strictEqual(botManager.config.wallpaperStagePoints[1], 15);

// Check disk persistence
const cfgOnDisk = configManager.loadConfig();
assert.strictEqual(cfgOnDisk.wallpaperStagePoints[1], 15);
console.log('✓ Step 2 Passed: Custom stage points successfully persisted to config & gameState.\n');

// 3. Selection of New Wallpaper must NOT reset points to hardcoded 4
console.log('[STEP 3] Testing setWallpaperRound, uploadWallpaper, and pickNextWallpaper point preservation...');
botManager.setWallpaperRound({
  stages: { 1: 'stage1.jpg', 2: 'stage2.jpg', 3: 'stage3.jpg', 4: 'stage4.jpg' },
  sharpImage: 'sharp.jpg',
  movieTitle: 'Inception'
});
assert.strictEqual(botManager.gameState.wallpaperState.points, 15, 'Points must remain 15, NOT revert to hardcoded 4');
assert.strictEqual(botManager.gameState.potentialPoints, 15, 'potentialPoints must match stage 1 points (15)');

// Upload Wallpaper
const uploadRes = botManager.uploadWallpaper('test_wp.jpg', 'Avatar');
assert.strictEqual(uploadRes.success, true);
assert.strictEqual(botManager.gameState.wallpaperState.points, 15, 'Uploaded wallpaper must inherit custom stage 1 points (15)');
assert.strictEqual(botManager.gameState.potentialPoints, 15);
console.log('✓ Step 3 Passed: Round loading preserves custom stage 1 points.\n');

// 4. Test updateConfig return value and full synchronization
console.log('[STEP 4] Testing updateConfig with wallpaper points & times...');
const returnedCfg = botManager.updateConfig({
  wallpaperStagePoints: { 1: 20, 2: 14, 3: 8, 4: 3 },
  wallpaperStageTimes: { 1: 8, 2: 8, 3: 8, 4: 8 }
});
assert.ok(returnedCfg, 'updateConfig must return config object (not undefined)');
assert.strictEqual(returnedCfg.wallpaperStagePoints[1], 20);
assert.strictEqual(botManager.gameState.wallpaperStagePoints[1], 20);
assert.strictEqual(botManager.gameState.wallpaperStageTimes[1], 8);
assert.strictEqual(botManager.gameState.wallpaperState.points, 20);
console.log('✓ Step 4 Passed: updateConfig return value and state updates verified.\n');

// 5. Test evaluateActivePlayer in Wallpaper mode with Custom Points
console.log('[STEP 5] Testing evaluation with custom points in wallpaper mode...');
botManager.setGameMode('wallpaper');
botManager.gameState.scores = {};
botManager.gameState.activePlayer = {
  id: 'CinemaPlayer',
  username: 'FilmGeek',
  potentialPoints: 20
};
botManager.evaluateActivePlayer('correct');
assert.strictEqual(botManager.gameState.scores['CinemaPlayer'].points, 20, 'Awarded points must be 20');
assert.strictEqual(botManager.gameState.wallpaperState.resolved, true, 'Wallpaper must be resolved on correct');
console.log('✓ Step 5 Passed: evaluateActivePlayer awarded exact custom stage points.\n');

// 6. Test 0 Points Edge Case
console.log('[STEP 6] Testing 0 points edge case (stage 4 = 0 pts)...');
botManager.setWallpaperStagePoints({ 1: 10, 2: 5, 3: 2, 4: 0 });
assert.strictEqual(botManager.gameState.wallpaperStagePoints[4], 0);
assert.strictEqual(botManager.getWallpaperPoints(35), 0, 'Stage 4 points should be 0, not default');
console.log('✓ Step 6 Passed: 0 points edge case handled without falsy fallback bugs.\n');

// 7. Clean Restoration
console.log('[STEP 7] Restoring default stage points...');
configManager.saveConfig({
  wallpaperStagePoints: { 1: 4, 2: 3, 3: 2, 4: 1 },
  wallpaperStageTimes: { 1: 10, 2: 10, 3: 10, 4: 10 }
});
botManager.setWallpaperStagePoints({ 1: 4, 2: 3, 3: 2, 4: 1 });
botManager.setWallpaperStageTimes({ 1: 10, 2: 10, 3: 10, 4: 10 });
console.log('✓ Step 7 Passed: Defaults cleanly restored.\n');

console.log('========================================================');
console.log('🎉 ALL COMPREHENSIVE WALLPAPER SYNC TESTS PASSED (100%)!');
console.log('========================================================\n');
