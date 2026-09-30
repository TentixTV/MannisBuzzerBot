const assert = require('assert');
const botManager = require('../src/bot/botManager');

async function runTests() {
  console.log('🧪 Starting Test: Player and Buzzer Auto-Start & No Auto-Lock Verification');

  // Create mock Discord channel and message
  let sentMessages = [];
  const mockChannel = {
    id: 'mock-channel-999',
    isTextBased: () => true,
    send: async (options) => {
      const msg = {
        id: 'msg-' + Date.now(),
        channel: mockChannel,
        options,
        edit: async (newOpts) => {
          msg.options = newOpts;
          return msg;
        }
      };
      sentMessages.push(msg);
      return msg;
    }
  };

  botManager.client = {
    user: { id: 'bot-123', tag: 'MannisBoxBot#0001', setPresence: () => {} },
    guilds: { fetch: async () => null },
    channels: {
      fetch: async (id) => {
        if (id === 'mock-channel-999') return mockChannel;
        return null;
      }
    }
  };
  botManager.isReady = true;
  botManager.config.textChannelId = 'mock-channel-999';

  console.log('\n--- 1. Testing Song Quiz Mode: startRound and No Timer Auto-Lock ---');
  botManager.setGameMode('song');
  const startRes = await botManager.startRound({ textChannelId: 'mock-channel-999' });
  assert.strictEqual(startRes.success, true, 'startRound should succeed');
  assert.strictEqual(botManager.gameState.isRoundActive, true, 'Round must be active');
  assert.strictEqual(botManager.gameState.isLocked, false, 'Buzzer must be unlocked initially');
  assert.strictEqual(sentMessages.length, 1, 'Discord buzzer message must be sent to the text channel');
  console.log('✓ startRound successfully created message in Discord channel and unlocked buzzer');

  // Fast forward round timer to 0
  botManager.gameState.roundTimer.remaining = 0;
  botManager.gameState.roundTimer.elapsed = botManager.gameState.roundTimer.duration;

  // Let the ticker run a cycle
  await new Promise(r => setTimeout(r, 600));

  assert.strictEqual(botManager.gameState.isLocked, false, 'In Song Quiz mode, buzzer must NOT lock when timer expires!');
  console.log('✓ Song Quiz timer expired without locking the buzzer (isLocked is still false)');

  console.log('\n--- 2. Testing Hitster Mode: startRound and No Timer Auto-Lock ---');
  botManager.setGameMode('hitster');
  await botManager.startRound({ textChannelId: 'mock-channel-999' });
  assert.strictEqual(botManager.gameState.isRoundActive, true);
  assert.strictEqual(botManager.gameState.isLocked, false);

  botManager.gameState.roundTimer.remaining = 0;
  botManager.gameState.roundTimer.elapsed = botManager.gameState.roundTimer.duration;
  await new Promise(r => setTimeout(r, 600));

  assert.strictEqual(botManager.gameState.isLocked, false, 'In Hitster mode, buzzer must NOT lock when timer expires!');
  console.log('✓ Hitster timer expired without locking the buzzer (isLocked is still false)');

  console.log('\n--- 3. Testing Wallpaper Mode: Auto-lock retained on resolution ---');
  botManager.setGameMode('wallpaper');
  await botManager.startRound({ textChannelId: 'mock-channel-999' });
  botManager.gameState.roundTimer.remaining = 0;
  botManager.gameState.roundTimer.elapsed = botManager.getWallpaperTotalDuration();
  await new Promise(r => setTimeout(r, 600));

  assert.strictEqual(botManager.gameState.isLocked, true, 'In Wallpaper mode, buzzer MUST lock when total time expires');
  console.log('✓ Wallpaper mode correctly locks buzzer on expiration');

  // Clean up
  botManager.stopRoundTimer();
  botManager.stopAnswerCountdown();

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
