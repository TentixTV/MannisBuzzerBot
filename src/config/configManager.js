const fs = require('fs');
const path = require('path');

let userDataPath = __dirname;
try {
  const { app } = require('electron');
  if (app) {
    userDataPath = app.getPath('userData');
  }
} catch (e) {
  // Fallback to local dirname in standalone node scripts
}

const configPath = path.join(userDataPath, 'mannisbox_config.json');
const localConfigPath = path.join(__dirname, 'config.json');

const defaultConfig = {
  token: process.env.DISCORD_TOKEN || '',
  hostId: '327863089796087809',
  guildId: '',
  voiceChannelId: '',
  textChannelId: '',
  points: {
    correct: 2,
    perfect: 4,
    custom: 1,
    wrongFirst: -1,
    wrongRepeat: -2
  },
  soundVolume: 0.8
};

function loadConfig() {
  try {
    let cfg = null;
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      cfg = JSON.parse(data);
    } else if (fs.existsSync(localConfigPath)) {
      const data = fs.readFileSync(localConfigPath, 'utf-8');
      cfg = JSON.parse(data);
    }
    if (cfg) {
      const mergedPoints = { ...defaultConfig.points, ...(cfg.points || {}) };
      // V5.1.000: Default for partial recognition is now 2 points (migrate legacy default 3)
      if (mergedPoints.correct === 3) {
        mergedPoints.correct = 2;
      }
      const merged = { ...defaultConfig, ...cfg, points: mergedPoints };
      return merged;
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }
  saveConfig(defaultConfig);
  return defaultConfig;
}

function saveConfig(newConfig) {
  try {
    const merged = { ...defaultConfig, ...newConfig };
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  } catch (err) {
    console.error('Error saving config:', err);
    return newConfig;
  }
}

module.exports = {
  loadConfig,
  saveConfig,
  defaultConfig
};
