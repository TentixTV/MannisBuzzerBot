const fs = require('fs');
const path = require('path');

function createWaveBuffer(sampleRate, durationSeconds, generateSampleFn) {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const bytesPerSample = 2; // 16-bit
  const numChannels = 1;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34); // bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = generateSampleFn(t, durationSeconds);
    sample = Math.max(-1, Math.min(1, sample));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    buffer.writeInt16LE(Math.floor(intSample), 44 + i * 2);
  }

  return buffer;
}

function getSoundsDirectory() {
  let baseDir = path.join(__dirname, '..', '..', 'assets', 'sounds');
  try {
    const { app } = require('electron');
    if (app && app.isPackaged) {
      baseDir = path.join(app.getPath('userData'), 'sounds');
    }
  } catch (e) {}

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return baseDir;
}

function ensureSounds() {
  const soundsDir = getSoundsDirectory();
  const sampleRate = 44100;

  // 1. EPIC BUZZER (Sub-bass drop + high energy dual sawtooth game buzzer)
  const buzzerFile = path.join(soundsDir, 'buzzer.wav');
  const bufBuzzer = createWaveBuffer(sampleRate, 0.55, (t, dur) => {
    const env = Math.exp(-3.2 * (t / dur));
    // Sub bass punch
    const subFreq = 90 * Math.exp(-6 * t) + 45;
    const sub = Math.sin(2 * Math.PI * subFreq * t) * 0.45;
    // Dual saw buzzer
    const saw1 = (2 * ((t * 220) % 1) - 1) * 0.35;
    const saw2 = (2 * ((t * 440) % 1) - 1) * 0.25;
    const grit = (Math.sin(2 * Math.PI * 180 * t) > 0 ? 0.2 : -0.2);
    return (sub + saw1 + saw2 + grit) * env * 0.9;
  });
  fs.writeFileSync(buzzerFile, bufBuzzer);

  // 2. EPIC WRONG (Dramatic heavy fail horn with dual dissonant sub tones)
  const wrongFile = path.join(soundsDir, 'wrong.wav');
  const bufWrong = createWaveBuffer(sampleRate, 0.85, (t, dur) => {
    const step = t < 0.4 ? 0 : 1;
    const localT = step === 0 ? t : t - 0.4;
    const freq = step === 0 ? 155.56 : 116.54; // D#3 -> A#2
    const env = Math.exp(-2.6 * localT);
    const saw = (2 * ((localT * freq) % 1) - 1) * 0.45;
    const sub = Math.sin(2 * Math.PI * (freq / 2) * localT) * 0.4;
    const buzz = Math.sin(2 * Math.PI * freq * 1.5 * localT) * 0.2;
    return (saw + sub + buzz) * env * 0.85;
  });
  fs.writeFileSync(wrongFile, bufWrong);

  // 3. EPIC CORRECT (Crystal Bell Major Arpeggio: C5 -> E5 -> G5 -> High C6 with sparkles)
  const correctFile = path.join(soundsDir, 'correct.wav');
  const bufCorrect = createWaveBuffer(sampleRate, 0.95, (t, dur) => {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    let noteIdx = Math.min(3, Math.floor(t / 0.14));
    let localT = t - noteIdx * 0.14;
    let freq = notes[noteIdx];
    let env = Math.exp(-4.5 * localT);
    if (noteIdx === 3) env = Math.exp(-2.2 * localT);

    const fundamental = Math.sin(2 * Math.PI * freq * t) * 0.55;
    const overtone1 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.25;
    const overtone2 = Math.sin(2 * Math.PI * freq * 3 * t) * 0.15;
    const sparkle = Math.sin(2 * Math.PI * freq * 4.2 * t) * 0.08 * env;
    return (fundamental + overtone1 + overtone2 + sparkle) * env * 0.9;
  });
  fs.writeFileSync(correctFile, bufCorrect);

  // 4. EPIC 100% PERFECT (Grand Victory Orchestral Fanfare with Golden Chimes)
  const perfectFile = path.join(soundsDir, 'perfect.wav');
  const bufPerfect = createWaveBuffer(sampleRate, 1.45, (t, dur) => {
    // Stage 1: Fast triplet roll -> Grand victory chord
    let sample = 0;
    if (t < 0.36) {
      const step = Math.floor(t / 0.12);
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      const lt = t - step * 0.12;
      const env = Math.exp(-4 * lt);
      sample = (Math.sin(2 * Math.PI * freqs[step] * t) + 0.3 * Math.sin(2 * Math.PI * freqs[step] * 2 * t)) * env;
    } else {
      const lt = t - 0.36;
      const env = Math.exp(-1.8 * lt);
      // Grand chord: C5 + G5 + C6 + E6
      const c5 = Math.sin(2 * Math.PI * 523.25 * t) * 0.25;
      const g5 = Math.sin(2 * Math.PI * 783.99 * t) * 0.25;
      const c6 = Math.sin(2 * Math.PI * 1046.50 * t) * 0.3;
      const e6 = Math.sin(2 * Math.PI * 1318.51 * t) * 0.2;
      const sparkle = Math.sin(2 * Math.PI * 2093.00 * t) * 0.1 * Math.exp(-3 * lt);
      sample = (c5 + g5 + c6 + e6 + sparkle) * env;
    }
    return sample * 0.95;
  });
  fs.writeFileSync(perfectFile, bufPerfect);

  return {
    buzzer: buzzerFile,
    wrong: wrongFile,
    correct: correctFile,
    perfect: perfectFile
  };
}

module.exports = {
  ensureSounds,
  getSoundsDirectory
};
