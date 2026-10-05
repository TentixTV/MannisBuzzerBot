const assert = require('assert');
const fs = require('fs');
const path = require('path');
const configManager = require('../src/config/configManager');
const BotManager = require('../src/bot/botManager');

console.log('========================================================');
console.log('  TEST WALLPAPER POINTS & STAGES CONFIG PERSISTENCE');
console.log('========================================================\n');

// 1. Test Config Manager Defaults & Save/Load
console.log('[STEP 1] Testing configManager default wallpaper stages & saveConfig...');
const cfgInitial = configManager.loadConfig();
assert.ok(cfgInitial.wallpaperStagePoints, 'wallpaperStagePoints must exist in config');
assert.ok(cfgInitial.wallpaperStageTimes, 'wallpaperStageTimes must exist in config');
assert.strictEqual(typeof cfgInitial.wallpaperStagePoints[1], 'number');

const customPoints = { 1: 8, 2: 6, 3: 4, 4: 2 };
const customTimes = { 1: 12, 2: 14, 3: 16, 4: 18 };

configManager.saveConfig({
  wallpaperStagePoints: customPoints,
  wallpaperStageTimes: customTimes
});

const cfgReloaded = configManager.loadConfig();
assert.deepStrictEqual(cfgReloaded.wallpaperStagePoints, customPoints, 'Saved wallpaperStagePoints must persist');
assert.deepStrictEqual(cfgReloaded.wallpaperStageTimes, customTimes, 'Saved wallpaperStageTimes must persist');
console.log('✓ Step 1 Passed: configManager persists wallpaper stage points and times.\n');

// 2. Test BotManager integration with Wallpaper Stage Points
console.log('[STEP 2] Testing BotManager setWallpaperStagePoints and setWallpaperStageTimes...');
const bot = require('../src/bot/botManager');
bot.config = configManager.loadConfig();

// Simulate setting points via Host UI IPC
const newPoints = { 1: 10, 2: 7, 3: 5, 4: 1 };
bot.setWallpaperStagePoints(newPoints);
assert.deepStrictEqual(bot.config.wallpaperStagePoints, newPoints, 'bot.config must update');
assert.deepStrictEqual(bot.gameState.wallpaperStagePoints, newPoints, 'gameState must update');

// When idle (no round running), potentialPoints should match stage 1 (10)
assert.strictEqual(bot.gameState.potentialPoints, 10, 'Idle potentialPoints must be Stage 1 points (10)');

// Test setWallpaperStageTimes
const newTimes = { 1: 15, 2: 15, 3: 15, 4: 15 };
bot.setWallpaperStageTimes(newTimes);
assert.deepStrictEqual(bot.config.wallpaperStageTimes, newTimes, 'bot.config times must update');
assert.deepStrictEqual(bot.gameState.wallpaperStageTimes, newTimes, 'gameState times must update');
console.log('✓ Step 2 Passed: BotManager setWallpaperStagePoints & times update config and gameState.\n');

// 3. Test Wallpaper Round Progression Points
console.log('[STEP 3] Testing Wallpaper points at different elapsed times...');
bot.setGameMode('wallpaper');
bot.gameState.wallpaperState = {
  currentImage: 'test.jpg',
  movieTitle: 'Matrix'
};

// At 0s -> Stage 1 (10 pts)
assert.strictEqual(bot.getWallpaperPoints(0), 10, '0s should give stage 1 points (10)');
// At 14s (within 0-15s) -> Stage 1 (10 pts)
assert.strictEqual(bot.getWallpaperPoints(14), 10, '14s should give stage 1 points (10)');
// At 16s (stage 2 is 15-30s) -> Stage 2 (7 pts)
assert.strictEqual(bot.getWallpaperPoints(16), 7, '16s should give stage 2 points (7)');
// At 32s (stage 3 is 30-45s) -> Stage 3 (5 pts)
assert.strictEqual(bot.getWallpaperPoints(32), 5, '32s should give stage 3 points (5)');
// At 48s (stage 4 is 45-60s) -> Stage 4 (1 pt)
assert.strictEqual(bot.getWallpaperPoints(48), 1, '48s should give stage 4 points (1)');
console.log('✓ Step 3 Passed: Wallpaper points accurately follow custom time boundaries and point values.\n');

// 4. Test evaluateActivePlayer in Wallpaper mode
console.log('[STEP 4] Testing evaluateActivePlayer award with custom wallpaper points...');
bot.gameState.activePlayer = {
  id: 'PlayerWp',
  username: 'FilmFan',
  potentialPoints: 7,
  stage: 2
};
bot.evaluateActivePlayer('correct');
assert.strictEqual(bot.gameState.scores['PlayerWp'].points, 7, 'Player should receive 7 points');
console.log('✓ Step 4 Passed: evaluateActivePlayer awarded accurate custom stage points.\n');

// 4b. Test setWallpaperRound preserves custom stage 1 points
console.log('[STEP 4b] Testing setWallpaperRound preserves custom stage 1 points (no hardcoded 4 points regression)...');
bot.setWallpaperRound({
  stages: { 1: 'stage1.jpg', 2: 'stage2.jpg', 3: 'stage3.jpg', 4: 'stage4.jpg' },
  sharpImage: 'sharp.jpg',
  movieTitle: 'Interstellar'
});
assert.strictEqual(bot.gameState.wallpaperState.points, 10, 'setWallpaperRound must use custom stage 1 points (10), not hardcoded 4');
assert.strictEqual(bot.gameState.potentialPoints, 10, 'potentialPoints must match stage 1 points');
console.log('✓ Step 4b Passed: setWallpaperRound preserves custom stage points accurately.\n');

// 4c. Test updateConfig returns config and updates gameState wallpaper points
console.log('[STEP 4c] Testing updateConfig returns updated config and synchronizes gameState...');
const cfgUpdateRes = bot.updateConfig({
  wallpaperStagePoints: { 1: 12, 2: 9, 3: 6, 4: 3 }
});
assert.ok(cfgUpdateRes, 'updateConfig must return the updated config object');
assert.strictEqual(cfgUpdateRes.wallpaperStagePoints[1], 12, 'Returned config must have new points');
assert.strictEqual(bot.gameState.wallpaperStagePoints[1], 12, 'gameState.wallpaperStagePoints must be updated');
assert.strictEqual(bot.gameState.wallpaperState.points, 12, 'gameState.wallpaperState.points must be updated');
console.log('✓ Step 4c Passed: updateConfig return value and gameState synchronization verified.\n');

// 5. Test Stream Overlay dimensions
console.log('[STEP 5] Checking stream.html enlarged wallpaper dimensions...');
const streamHtml = fs.readFileSync(path.join(__dirname, '../src/renderer/stream.html'), 'utf8');
assert.ok(streamHtml.includes('max-width: 1080px'), 'stream.html stageWallpaper must have max-width: 1080px');
assert.ok(streamHtml.includes('height: 500px'), 'stream.html cinema-screen-viewport must have height: 500px');
assert.ok(streamHtml.includes('max-height: 500px'), 'stream.html wpImage must have max-height: 500px');
console.log('✓ Step 5 Passed: Stream overlay dimensions properly enlarged for OBS.\n');

// 6. Restore default config points cleanly
configManager.saveConfig({
  wallpaperStagePoints: { 1: 4, 2: 3, 3: 2, 4: 1 },
  wallpaperStageTimes: { 1: 10, 2: 10, 3: 10, 4: 10 }
});

console.log('========================================================');
console.log('🎉 ALL WALLPAPER STAGE CONFIG & STREAM TESTS PASSED 100%!');
console.log('========================================================\n');
