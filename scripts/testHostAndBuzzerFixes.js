const assert = require('assert');
const botManager = require('../src/bot/botManager');
const { formatDiscordLeaderboard, createBuzzNotificationEmbed } = require('../src/bot/embeds');

console.log('========================================================');
console.log('  TESTING HOST SEPARATION & BUZZER NOTIFICATIONS (v5.0.003)');
console.log('========================================================\n');

// Test 1: isHost identification
console.log('[TEST 1] Verifying isHost identification logic...');
assert.strictEqual(botManager.isHost('327863089796087809'), true, 'Config hostId string must match');
assert.strictEqual(botManager.isHost('thismanniguy'), true, 'ThisManniGuy lowercase must match');
assert.strictEqual(botManager.isHost('ThisManniGuy'), true, 'ThisManniGuy mixed case must match');
assert.strictEqual(botManager.isHost('host-regie-buzzer'), true, 'host-regie-buzzer must match');
assert.strictEqual(botManager.isHost({ id: '327863089796087809' }), true, 'Member object with host ID must match');
assert.strictEqual(botManager.isHost({ displayName: 'ThisManniGuy' }), true, 'Member with displayName ThisManniGuy must match');
assert.strictEqual(botManager.isHost({ user: { username: 'thismanniguy' } }), true, 'Member with user.username thismanniguy must match');

// Non-hosts
assert.strictEqual(botManager.isHost('987654321012345678'), false, 'Regular player ID must NOT match');
assert.strictEqual(botManager.isHost('Gamer123'), false, 'Regular player name must NOT match');
assert.strictEqual(botManager.isHost({ id: '111222333', displayName: 'PlayerOne' }), false, 'Regular member must NOT match');
console.log('✓ Test 1 Passed: Host identification is 100% rock-solid.\n');

// Test 2: formatDiscordLeaderboard filters out host
console.log('[TEST 2] Verifying formatDiscordLeaderboard host exclusion...');
const mockScores = {
  '327863089796087809': { id: '327863089796087809', username: 'ThisManniGuy', points: 0 },
  'p_1': { id: 'p_1', username: 'GamerOne', points: 15, correct: 5, wrong: 1 },
  'p_2': { id: 'p_2', username: 'GamerTwo', points: 25, correct: 8, wrong: 0 }
};

const leaderboardText = formatDiscordLeaderboard(mockScores, 50, 'song');
assert.strictEqual(leaderboardText.includes('ThisManniGuy'), false, 'ThisManniGuy must NOT be in leaderboard');
assert.strictEqual(leaderboardText.includes('GamerTwo'), true, 'GamerTwo must be in leaderboard');
assert.strictEqual(leaderboardText.includes('GamerOne'), true, 'GamerOne must be in leaderboard');
console.log('✓ Test 2 Passed: Host is excluded from Discord leaderboard.\n');

// Test 3: createBuzzNotificationEmbed
console.log('[TEST 3] Verifying createBuzzNotificationEmbed output...');
const buzzEmbed = createBuzzNotificationEmbed({
  username: 'GamerOne',
  userId: '123456789',
  avatar: 'https://cdn.discordapp.com/avatars/123/abc.png',
  timeOffset: '1. Platz (0.00s)',
  potentialPoints: 50,
  isBoostActive: true,
  gameMode: 'wallpaper'
});

assert.strictEqual(buzzEmbed.data.title.includes('GAMERONE'), true, 'Title must contain username in uppercase');
assert.strictEqual(buzzEmbed.data.description.includes('<@123456789>'), true, 'Description must mention userId');
assert.strictEqual(buzzEmbed.data.description.includes('2X BOOST AKTIV!'), true, 'Description must show boost badge');
assert.strictEqual(buzzEmbed.data.description.includes('50 Punkte'), true, 'Description must show potential points');
console.log('✓ Test 3 Passed: createBuzzNotificationEmbed generates correct embed.\n');

// Test 4: Score protection - Host cannot be assigned points
console.log('[TEST 4] Verifying score modification protection for host...');
const resSet = botManager.setPlayerScore('327863089796087809', 20);
assert.strictEqual(resSet.success, false, 'setPlayerScore on host must fail');
const resAdj = botManager.adjustPlayerScore('327863089796087809', 5);
assert.strictEqual(resAdj.success, false, 'adjustPlayerScore on host must fail');
assert.strictEqual(botManager.gameState.scores['327863089796087809'], undefined, 'Host must never exist in scores');
console.log('✓ Test 4 Passed: Host cannot be assigned score points.\n');

// Test 5: Manual buzz as host-regie-buzzer does not pollute scores
console.log('[TEST 5] Verifying manual buzz as host-regie-buzzer...');
botManager.gameState.isRoundActive = true;
botManager.gameState.isLocked = false;
botManager.gameState.scores = {};
const resBuzz = botManager.manualBuzzPlayer('host-regie-buzzer', 'Regie');
assert.strictEqual(resBuzz.success, true, 'manualBuzzPlayer for Regie must succeed');
assert.strictEqual(resBuzz.player.username, 'Regie');
assert.strictEqual(botManager.gameState.scores['host-regie-buzzer'], undefined, 'host-regie-buzzer must NOT be added to scores');
console.log('✓ Test 5 Passed: Regie buzz does not pollute contestant scoreboard.\n');

console.log('========================================================');
console.log('🎉 ALL HOST & BUZZER TESTS PASSED WITH 100% SUCCESS!');
console.log('========================================================');
