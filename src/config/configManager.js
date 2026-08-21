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
    correct: 3,
    perfect: 4,
    wrongFirst: -1,
    wrongRepeat: -2
  },
  soundVolume: 0.8
};

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return { ...defaultConfig, ...JSON.parse(data) };
    } else if (fs.existsSync(localConfigPath)) {
      const data = fs.readFileSync(localConfigPath, 'utf-8');
      return { ...defaultConfig, ...JSON.parse(data) };
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
