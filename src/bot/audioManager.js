const {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
  entersState,
  VoiceConnectionStatus
} = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const { ensureSounds } = require('./generateSounds');

class AudioManager {
  constructor() {
    this.player = createAudioPlayer();
    this.connection = null;
    this.volume = 0.8;
    this.soundPaths = ensureSounds();

    this.player.on('error', (error) => {
      console.error('Audio Player Error:', error.message, error);
    });

    this.player.on(AudioPlayerStatus.Idle, () => {
      // Audio finished playing
    });
  }

  setConnection(connection) {
    this.connection = connection;
    if (this.connection) {
      this.connection.subscribe(this.player);
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  playSound(soundType) {
    const filePath = this.soundPaths[soundType] || path.join(__dirname, '..', '..', 'assets', 'sounds', `${soundType}.wav`);
    const mp3Fallback = path.join(__dirname, '..', '..', 'assets', 'sounds', `${soundType}.mp3`);

    let targetFile = null;
    if (fs.existsSync(mp3Fallback)) {
      targetFile = mp3Fallback;
    } else if (fs.existsSync(filePath)) {
      targetFile = filePath;
    }

    if (!targetFile) {
      console.warn(`Sound file not found for type: ${soundType}`);
      return false;
    }

    if (!this.connection) {
      console.log(`[Audio] No active voice connection to play ${soundType}`);
      return false;
    }

    try {
      const resource = createAudioResource(targetFile, {
        inlineVolume: true
      });
      if (resource.volume) {
        resource.volume.setVolume(this.volume);
      }
      this.player.play(resource);
      return true;
    } catch (err) {
      console.error(`Error playing sound ${soundType}:`, err);
      return false;
    }
  }

  playBuzzer() {
    return this.playSound('buzzer');
  }

  playWrong() {
    return this.playSound('wrong');
  }

  playCorrect() {
    return this.playSound('correct');
  }

  playPerfect() {
    return this.playSound('perfect');
  }

  stop() {
    if (this.player) {
      this.player.stop();
    }
  }
}

module.exports = new AudioManager();
