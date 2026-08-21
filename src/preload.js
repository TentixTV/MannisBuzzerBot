const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('mannisBoxAPI', {
  // Config
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),

  // Bot Lifecycle
  startBot: () => ipcRenderer.invoke('start-bot'),
  stopBot: () => ipcRenderer.invoke('stop-bot'),

  // Discord Guilds & Channels
  getGuilds: () => ipcRenderer.invoke('get-guilds'),
  getChannels: (guildId) => ipcRenderer.invoke('get-channels', guildId),
  joinVoice: (guildId, channelId) => ipcRenderer.invoke('join-voice', { guildId, channelId }),
  leaveVoice: () => ipcRenderer.invoke('leave-voice'),

  // Game Control
  startRound: (options) => ipcRenderer.invoke('start-round', options),
  lockBuzzer: (locked) => ipcRenderer.invoke('lock-buzzer', locked),
  evaluatePlayer: (action) => ipcRenderer.invoke('evaluate-player', action),
  selectQueuePlayer: (playerId) => ipcRenderer.invoke('select-queue-player', playerId),
  banPlayer: (playerId, username) => ipcRenderer.invoke('ban-player', { playerId, username }),
  unbanPlayer: (playerId) => ipcRenderer.invoke('unban-player', playerId),
  adjustPlayerScore: (playerId, delta) => ipcRenderer.invoke('adjust-player-score', { playerId, delta }),
  undoLastAction: () => ipcRenderer.invoke('undo-last-action'),
  endRound: () => ipcRenderer.invoke('end-round'),
  resetScores: () => ipcRenderer.invoke('reset-scores'),
  getGameState: () => ipcRenderer.invoke('get-game-state'),

  // Sounds & Helpers
  playTestSound: (type) => ipcRenderer.invoke('play-test-sound', type),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Event Listeners
  onGameState: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('game-state', handler);
    return () => ipcRenderer.removeListener('game-state', handler);
  },
  onBotStatus: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('bot-status', handler);
    return () => ipcRenderer.removeListener('bot-status', handler);
  },
  onVoiceStatus: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('voice-status', handler);
    return () => ipcRenderer.removeListener('voice-status', handler);
  },
  onError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('bot-error', handler);
    return () => ipcRenderer.removeListener('bot-error', handler);
  }
});
