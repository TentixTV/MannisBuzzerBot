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
  wallpaperStagePoints: { 1: 4, 2: 3, 3: 2, 4: 1 },
  wallpaperStageTimes: { 1: 10, 2: 10, 3: 10, 4: 10 },
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
    // If config on disk has an empty token, fall back to local config.json if it has one
    if ((!cfg || !cfg.token) && fs.existsSync(localConfigPath)) {
      try {
        const localData = fs.readFileSync(localConfigPath, 'utf-8');
        const localCfg = JSON.parse(localData);
        if (localCfg.token) {
          cfg = { ...(localCfg || {}), ...(cfg || {}) };
          if (!cfg.token) cfg.token = localCfg.token;
        }
      } catch (e) {}
    }
    if (cfg) {
      const mergedPoints = { ...defaultConfig.points, ...(cfg.points || {}) };
      // V5.1.000: Default for partial recognition is now 2 points (migrate legacy default 3)
      if (mergedPoints.correct === 3) {
        mergedPoints.correct = 2;
      }
      const mergedWpPoints = { ...defaultConfig.wallpaperStagePoints, ...(cfg.wallpaperStagePoints || {}) };
      const mergedWpTimes = { ...defaultConfig.wallpaperStageTimes, ...(cfg.wallpaperStageTimes || {}) };
      const merged = {
        ...defaultConfig,
        ...cfg,
        points: mergedPoints,
        wallpaperStagePoints: mergedWpPoints,
        wallpaperStageTimes: mergedWpTimes
      };
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
    let existing = {};
    if (fs.existsSync(configPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(configPath, 'utf-8')) || {};
      } catch (e) {}
    } else if (fs.existsSync(localConfigPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(localConfigPath, 'utf-8')) || {};
      } catch (e) {}
    }

    const mergedPoints = {
      ...defaultConfig.points,
      ...(existing.points || {}),
      ...(newConfig?.points || {})
    };

    const mergedWpPoints = {
      ...defaultConfig.wallpaperStagePoints,
      ...(existing.wallpaperStagePoints || {}),
      ...(newConfig?.wallpaperStagePoints || {})
    };

    const mergedWpTimes = {
      ...defaultConfig.wallpaperStageTimes,
      ...(existing.wallpaperStageTimes || {}),
      ...(newConfig?.wallpaperStageTimes || {})
    };

    const merged = {
      ...defaultConfig,
      ...existing,
      ...newConfig,
      points: mergedPoints,
      wallpaperStagePoints: mergedWpPoints,
      wallpaperStageTimes: mergedWpTimes
    };

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
