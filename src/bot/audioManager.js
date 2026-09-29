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
    this.songPlayer = createAudioPlayer();
    this.sfxPlayer = createAudioPlayer();
    this.connection = null;
    this.volume = 0.8;
    this.soundPaths = ensureSounds();
    this.isSongPlaying = false;
    this.isSongPaused = false;
    this.currentSongPath = null;

    this.songPlayer.on('error', (error) => {
      console.error('[Audio] Song Player Error:', error.message);
    });

    this.sfxPlayer.on('error', (error) => {
      console.error('[Audio] SFX Player Error:', error.message);
    });

    this.sfxPlayer.on(AudioPlayerStatus.Idle, () => {
      // When SFX finishes, re-subscribe connection to songPlayer if song is still active and not paused by buzzer
      if (this.connection && this.isSongPlaying && !this.isSongPaused) {
        try {
          this.connection.subscribe(this.songPlayer);
        } catch (e) {}
      }
    });

    this.songPlayer.on(AudioPlayerStatus.Idle, () => {
      this.isSongPlaying = false;
    });
  }

  setConnection(connection) {
    this.connection = connection;
    if (this.connection && this.connection.state?.status !== VoiceConnectionStatus.Destroyed) {
      try {
        const target = (this.isSongPlaying && !this.isSongPaused) ? this.songPlayer : this.sfxPlayer;
        this.connection.subscribe(target);
      } catch (e) {
        console.warn('[Audio] setConnection subscribe error:', e.message);
      }
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

    if (!this.connection || this.connection.state?.status === VoiceConnectionStatus.Destroyed) {
      return false;
    }

    try {
      const resource = createAudioResource(targetFile, {
        inlineVolume: true
      });
      if (resource.volume) {
        resource.volume.setVolume(this.volume);
      }
      this.connection.subscribe(this.sfxPlayer);
      this.sfxPlayer.play(resource);
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

  playSong(filePath) {
    if (!filePath || !fs.existsSync(filePath)) return false;
    this.currentSongPath = filePath;
    this.isSongPlaying = true;
    this.isSongPaused = false;

    if (!this.connection || this.connection.state?.status === VoiceConnectionStatus.Destroyed) return true;
    try {
      const resource = createAudioResource(filePath, { inlineVolume: true });
      if (resource.volume) {
        resource.volume.setVolume(this.volume);
      }
      this.connection.subscribe(this.songPlayer);
      this.songPlayer.play(resource);
      return true;
    } catch (err) {
      console.warn('[Audio] playSong voice warning:', err.message);
      return false;
    }
  }

  pauseSong() {
    this.isSongPaused = true;
    try {
      if (this.songPlayer && this.songPlayer.state.status !== AudioPlayerStatus.Paused) {
        this.songPlayer.pause();
      }
    } catch (e) {}
  }

  resumeSong() {
    this.isSongPaused = false;
    try {
      if (this.connection && this.connection.state?.status !== VoiceConnectionStatus.Destroyed) {
        this.connection.subscribe(this.songPlayer);
      }
      if (this.songPlayer && this.songPlayer.state.status === AudioPlayerStatus.Paused) {
        this.songPlayer.unpause();
      }
    } catch (e) {}
  }

  stop() {
    this.isSongPlaying = false;
    this.isSongPaused = false;
    this.currentSongPath = null;
    try {
      if (this.songPlayer) this.songPlayer.stop();
      if (this.sfxPlayer) this.sfxPlayer.stop();
    } catch (e) {}
  }
}

module.exports = new AudioManager();
