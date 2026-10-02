const assert = require('assert');
const botManager = require('../src/bot/botManager');
const { createBuzzerEmbed, createBuzzNotificationEmbed } = require('../src/bot/embeds');
const { saveConfig } = require('../src/config/configManager');

async function runTests() {
  console.log('========================================================');
  console.log('  TEST REAL-TIME BOT POINTS & EMBEDS SYNCHRONIZATION');
  console.log('========================================================\n');

  // Reset config to defaults
  saveConfig({ points: { correct: 2, perfect: 4, custom: 1, wrongFirst: -1, wrongRepeat: -2 } });
  botManager.updateConfig({ points: { correct: 2, perfect: 4, custom: 1 } });
  await botManager.setGameMode('song');

  // STEP 1: Verify Initial State & Embeds
  console.log('[STEP 1] Checking initial potentialPoints & embed contents...');
  assert.strictEqual(botManager.gameState.potentialPoints, '2 - 4', 'Default potentialPoints must be 2 - 4');

  let buzzerEmbed = createBuzzerEmbed({
    ...botManager.gameState,
    pointsConfig: botManager.config.points
  });

  const songField = buzzerEmbed.data.fields.find(f => f.name.includes('Song Quiz Punkte') || f.name.includes('Aktueller Track'));
  assert.ok(songField, 'Song field must be present in embed');
  assert.ok(songField.value.includes('+2 Pkt (Teils)'), 'Embed must display +2 Pkt (Teils)');
  assert.ok(songField.value.includes('+4 Pkt (Vollst.)'), 'Embed must display +4 Pkt (Vollst.)');
  assert.ok(songField.value.includes('+1 Pkt (Custom)'), 'Embed must display +1 Pkt (Custom)');
  console.log('✓ Step 1 Passed: Initial embed renders partial (2), perfect (4) and custom (1) correctly.\n');

  // STEP 2: Buzz a player and verify active player potential points
  console.log('[STEP 2] Simulating a buzz and checking active player tag...');
  const buzzRes = botManager.manualBuzzPlayer('contestant-1', 'ContestantOne');
  assert.strictEqual(buzzRes.success, true, 'manualBuzzPlayer must succeed');
  assert.strictEqual(botManager.gameState.activePlayer.potentialPoints, '2 - 4', 'activePlayer potential points must be 2 - 4');

  buzzerEmbed = createBuzzerEmbed({
    ...botManager.gameState,
    pointsConfig: botManager.config.points
  });
  const activeField = buzzerEmbed.data.fields.find(f => f.name.includes('an der Reihe'));
  assert.ok(activeField, 'Active player field must be present');
  assert.ok(activeField.value.includes('(2-4 Pkt möglich)'), 'Active player field must show "(2-4 Pkt möglich)"');
  console.log('✓ Step 2 Passed: Active player displays (2-4 Pkt möglich).\n');

  // STEP 3: Live adjust points on left side (Partial 2 -> 3, Perfect 4 -> 6, Custom 1 -> 5)
  console.log('[STEP 3] Simulating Manni adjusting points in UI...');
  let discordMessageEdited = false;
  let editedEmbedData = null;
  botManager.gameState.currentMessage = {
    edit: async (opts) => {
      discordMessageEdited = true;
      editedEmbedData = opts.embeds[0].data;
    }
  };

  let buzzMessageEdited = false;
  botManager.lastBuzzMessage = {
    edit: async (opts) => {
      buzzMessageEdited = true;
    }
  };
  botManager.lastBuzzData = {
    userId: 'contestant-1',
    username: 'ContestantOne',
    avatar: null,
    timeOffset: '1. Platz (0.00s)',
    gameMode: 'song'
  };

  botManager.updateConfig({
    points: { correct: 3, perfect: 6, custom: 5 }
  });

  // Verify internal state updated immediately
  assert.strictEqual(botManager.gameState.potentialPoints, '3 - 6', 'potentialPoints must update to 3 - 6');
  assert.strictEqual(botManager.gameState.activePlayer.potentialPoints, '3 - 6', 'activePlayer.potentialPoints must update to 3 - 6');

  // Verify Discord message edit was triggered
  assert.strictEqual(discordMessageEdited, true, 'updateDiscordMessage must have edited currentMessage');
  assert.strictEqual(buzzMessageEdited, true, 'updateBuzzAnnouncementMessage must have edited lastBuzzMessage');

  // Verify edited embed contents
  const editedActiveField = editedEmbedData.fields.find(f => f.name.includes('an der Reihe'));
  assert.ok(editedActiveField.value.includes('(3-6 Pkt möglich)'), 'Embed must now show "(3-6 Pkt möglich)"');

  const editedSongField = editedEmbedData.fields.find(f => f.name.includes('Song Quiz Punkte') || f.name.includes('Aktueller Track'));
  assert.ok(editedSongField.value.includes('+3 Pkt (Teils)'), 'Embed must now show +3 Pkt (Teils)');
  assert.ok(editedSongField.value.includes('+6 Pkt (Vollst.)'), 'Embed must now show +6 Pkt (Vollst.)');
  assert.ok(editedSongField.value.includes('+5 Pkt (Custom)'), 'Embed must now show +5 Pkt (Custom)');
  console.log('✓ Step 3 Passed: Changing points instantly updates gameState, activePlayer, and edits Discord embed.\n');

  // STEP 4: Test 2X Boost Multiplier on Embeds
  console.log('[STEP 4] Testing 2X Boost doubling in Discord embed...');
  botManager.toggleBoost(true);
  assert.strictEqual(botManager.gameState.isBoostActive, true, 'Boost is active');

  buzzerEmbed = createBuzzerEmbed({
    ...botManager.gameState,
    pointsConfig: botManager.config.points
  });

  const boostedActiveField = buzzerEmbed.data.fields.find(f => f.name.includes('an der Reihe'));
  assert.ok(boostedActiveField.value.includes('(6-12 Pkt möglich 🔥 2x)'), 'Boosted active field must show "(6-12 Pkt möglich 🔥 2x)"');

  const boostedSongField = buzzerEmbed.data.fields.find(f => f.name.includes('Song Quiz Punkte') || f.name.includes('Aktueller Track'));
  assert.ok(boostedSongField.value.includes('+6 Pkt (Teils)'), 'Boosted embed must show +6 Pkt (Teils)');
  assert.ok(boostedSongField.value.includes('+12 Pkt (Vollst.)'), 'Boosted embed must show +12 Pkt (Vollst.)');
  assert.ok(boostedSongField.value.includes('+10 Pkt (Custom)'), 'Boosted embed must show +10 Pkt (Custom)');
  assert.ok(boostedSongField.value.includes('BOOST'), 'Boosted embed must show BOOST badge');
  console.log('✓ Step 4 Passed: 2X Boost accurately doubles all point categories in Discord.\n');

  // STEP 5: Test Equal Points & Zero Points Edge Cases
  console.log('[STEP 5] Testing Equal Points and Zero Points edge cases...');
  botManager.toggleBoost(false);
  // Equal points: correct = 5, perfect = 5
  botManager.updateConfig({ points: { correct: 5, perfect: 5, custom: 2 } });
  assert.strictEqual(botManager.gameState.potentialPoints, 5, 'When correct === perfect, potentialPoints is single number 5');
  assert.strictEqual(botManager.gameState.activePlayer.potentialPoints, 5, 'activePlayer potential points is 5');

  buzzerEmbed = createBuzzerEmbed({
    ...botManager.gameState,
    pointsConfig: botManager.config.points
  });
  const eqField = buzzerEmbed.data.fields.find(f => f.name.includes('an der Reihe'));
  assert.ok(eqField.value.includes('(5 Pkt möglich)'), 'Equal points shows "(5 Pkt möglich)" without hyphen');

  // Zero points: correct = 0, perfect = 0, custom = 0
  botManager.updateConfig({ points: { correct: 0, perfect: 0, custom: 0 } });
  assert.strictEqual(botManager.gameState.potentialPoints, 0, 'Zero points evaluated to 0');
  assert.strictEqual(botManager.gameState.activePlayer.potentialPoints, 0, 'activePlayer potential points is 0');

  buzzerEmbed = createBuzzerEmbed({
    ...botManager.gameState,
    pointsConfig: botManager.config.points
  });
  const zeroField = buzzerEmbed.data.fields.find(f => f.name.includes('an der Reihe'));
  assert.ok(zeroField.value.includes('(0 Pkt möglich)'), 'Zero points shows "(0 Pkt möglich)" without falling back to defaults');
  console.log('✓ Step 5 Passed: Equal points (5) and Zero points (0) edge cases handled gracefully.\n');

  // STEP 6: Test createBuzzNotificationEmbed with pointsConfig
  console.log('[STEP 6] Testing createBuzzNotificationEmbed points formatting...');
  const notifEmbed = createBuzzNotificationEmbed({
    username: 'ContestantOne',
    userId: 'contestant-1',
    timeOffset: '1. Platz (0.00s)',
    gameMode: 'song',
    pointsConfig: { correct: 2, perfect: 4, custom: 1 }
  });
  assert.ok(notifEmbed.data.description.includes('2 - 4 Punkte'), 'Notification embed shows "2 - 4 Punkte"');
  assert.ok(notifEmbed.data.description.includes('Teils: +2'), 'Notification embed details show Teils: +2');
  assert.ok(notifEmbed.data.description.includes('Vollst.: +4'), 'Notification embed details show Vollst.: +4');
  assert.ok(notifEmbed.data.description.includes('Custom: +1'), 'Notification embed details show Custom: +1');
  console.log('✓ Step 6 Passed: createBuzzNotificationEmbed displays all 3 configured points.\n');

  // Restore defaults
  saveConfig({ points: { correct: 2, perfect: 4, custom: 1, wrongFirst: -1, wrongRepeat: -2 } });
  botManager.updateConfig({ points: { correct: 2, perfect: 4, custom: 1 } });
  botManager.endRound();

  console.log('========================================================');
  console.log('🎉 ALL BOT REAL-TIME POINTS SYNC TESTS PASSED (100%)!');
  console.log('========================================================\n');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
