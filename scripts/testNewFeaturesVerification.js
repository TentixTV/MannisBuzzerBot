const botManager = require('../src/bot/botManager');
const assert = require('assert');

async function runNewFeatureTests() {
  console.log('[TEST 1] Testing physical dome buzzer auto-creation of host player...');
  // Ensure scores is empty
  botManager.gameState.scores = {};
  botManager.gameState.activePlayer = null;
  botManager.gameState.isLocked = false;

  const buzzRes = botManager.manualBuzzPlayer('host-regie-buzzer', 'Host / Regie');
  assert.strictEqual(buzzRes.success, true, 'manualBuzzPlayer should succeed');
  assert.strictEqual(botManager.gameState.scores['host-regie-buzzer'], undefined, 'host-regie-buzzer must NOT be added to scores');
  assert.strictEqual(botManager.gameState.activePlayer.id, 'host-regie-buzzer');
  console.log('Test 1 Passed: Physical dome buzzer sets active player without polluting scores.');

  console.log('[TEST 2] Testing Hitster card placement and shelf synchronization...');
  await botManager.setGameMode('hitster');
  botManager.gameState.hitsterState.timeline = [
    { year: 1975, title: 'Bohemian Rhapsody', artist: 'Queen', revealed: true }
  ];
  botManager.gameState.hitsterState.currentCard = {
    year: 1982,
    title: 'Thriller',
    artist: 'Michael Jackson',
    revealed: false
  };
  botManager.gameState.scores['player-alice'] = {
    id: 'player-alice',
    username: 'Alice',
    points: 0,
    cards: []
  };

  const placeRes = botManager.placeHitsterCard(1, 'player-alice');
  assert.strictEqual(placeRes.success, true, 'Hitster card placement should succeed');
  assert.strictEqual(placeRes.correct, true, '1982 after 1975 is correct');
  assert.strictEqual(botManager.gameState.scores['player-alice'].cards.length, 1);
  assert.strictEqual(botManager.gameState.scores['player-alice'].cards[0].year, 1982);
  assert.ok(botManager.gameState.hitsterState.playerShelves['Alice'], 'Shelf for Alice should exist');
  assert.strictEqual(botManager.gameState.hitsterState.playerShelves['Alice'].cards.length, 1);
  assert.strictEqual(botManager.gameState.hitsterState.playerShelves['Alice'].cards[0].year, 1982);
  console.log('Test 2 Passed: Hitster card placement updates timeline, player.cards, and playerShelves.');

  console.log('[TEST 3] Testing resetScores clears winner, activePlayer, queue, shelves, and timeline...');
  // Force a winner and active state
  botManager.gameState.winner = { id: 'player-alice', username: 'Alice', points: 50 };
  botManager.gameState.activePlayer = { id: 'player-alice', username: 'Alice' };
  botManager.gameState.queue = [{ id: 'player-bob' }];
  botManager.gameState.isLocked = true;
  botManager.gameState.isBoostActive = true;
  assert.ok(botManager.gameState.winner, 'Winner should be set before reset');

  const resetRes = botManager.resetScores();
  assert.strictEqual(resetRes.success, true, 'resetScores should succeed');
  assert.strictEqual(botManager.gameState.winner, null, 'Winner must be null after reset');
  assert.strictEqual(botManager.gameState.activePlayer, null, 'Active player must be null after reset');
  assert.strictEqual(botManager.gameState.queue.length, 0, 'Queue must be empty');
  assert.strictEqual(botManager.gameState.isLocked, false, 'isLocked must be false');
  assert.strictEqual(botManager.gameState.isBoostActive, false, 'Boost must be reset');
  assert.strictEqual(botManager.gameState.hitsterState.timeline.length, 0, 'Hitster timeline must be reset');
  assert.strictEqual(Object.keys(botManager.gameState.hitsterState.playerShelves).length, 0, 'Hitster shelves must be reset');
  console.log('Test 3 Passed: resetScores comprehensively resets winner, active player, shelves, and timeline.');

  console.log('[TEST 4] Testing Hitster Victory by reaching card target...');
  await botManager.setGoal(3); // target 3 cards for test
  botManager.gameState.scores['player-winner'] = {
    id: 'player-winner',
    username: 'WinnerPro',
    points: 2,
    cards: [
      { year: 1970, title: 'Song 1', artist: 'Artist 1' },
      { year: 1980, title: 'Song 2', artist: 'Artist 2' }
    ]
  };
  botManager.gameState.hitsterState.timeline = [
    { year: 1970, title: 'Song 1', artist: 'Artist 1' },
    { year: 1980, title: 'Song 2', artist: 'Artist 2' }
  ];
  botManager.gameState.hitsterState.currentCard = {
    year: 1990,
    title: 'Song 3',
    artist: 'Artist 3',
    revealed: false
  };

  const winPlaceRes = botManager.placeHitsterCard(2, 'player-winner');
  assert.strictEqual(winPlaceRes.correct, true);
  assert.strictEqual(botManager.gameState.scores['player-winner'].cards.length, 3);
  assert.ok(botManager.gameState.winner, 'Winner should be declared upon reaching 3 cards');
  assert.strictEqual(botManager.gameState.winner.username, 'WinnerPro');
  assert.strictEqual(botManager.gameState.winner.cards, 3);
  console.log('Test 4 Passed: Hitster victory correctly declared based on card target!');

  console.log('\n--- ALL NEW FEATURE VERIFICATIONS PASSED (100% OK) ---');
  process.exit(0);
}

runNewFeatureTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
