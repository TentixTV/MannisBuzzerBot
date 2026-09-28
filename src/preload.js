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
  evaluatePlayer: (action, targetPlayer) => ipcRenderer.invoke('evaluate-player', { action, targetPlayer }),
  selectQueuePlayer: (playerId) => ipcRenderer.invoke('select-queue-player', playerId),
  banPlayer: (playerId, username) => ipcRenderer.invoke('ban-player', { playerId, username }),
  unbanPlayer: (playerId) => ipcRenderer.invoke('unban-player', playerId),
  adjustPlayerScore: (playerId, delta) => ipcRenderer.invoke('adjust-player-score', { playerId, delta }),
  setPlayerScore: (playerId, newPoints) => ipcRenderer.invoke('set-player-score', { playerId, newPoints }),
  addCustomPlayer: (username) => ipcRenderer.invoke('add-custom-player', username),
  removePlayer: (playerId) => ipcRenderer.invoke('remove-player', playerId),
  renamePlayer: (playerId, newName) => ipcRenderer.invoke('rename-player', { playerId, newName }),
  manualBuzzPlayer: (playerId, username) => ipcRenderer.invoke('manual-buzz-player', { playerId, username }),
  undoLastAction: () => ipcRenderer.invoke('undo-last-action'),
  endRound: () => ipcRenderer.invoke('end-round'),
  resetScores: () => ipcRenderer.invoke('reset-scores'),
  getGameState: () => ipcRenderer.invoke('get-game-state'),

  // Sounds & Helpers
  playTestSound: (type) => ipcRenderer.invoke('play-test-sound', type),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Big Big Update Handlers
  setGameMode: (mode) => ipcRenderer.invoke('set-game-mode', mode),
  selectMusicFolder: () => ipcRenderer.invoke('select-music-folder'),
  scanMusicFolderDirect: (folderPath) => ipcRenderer.invoke('scan-music-folder-direct', folderPath),
  pickRandomSong: (genre) => ipcRenderer.invoke('pick-random-song', genre),
  setManualSong: (artist, title) => ipcRenderer.invoke('set-manual-song', { artist, title }),
  pickHitsterSong: (genre) => ipcRenderer.invoke('pick-hitster-song', genre),
  setManualHitsterCard: (year, artist, title) => ipcRenderer.invoke('set-manual-hitster-card', { year, artist, title }),
  resolveHitsterCard: () => ipcRenderer.invoke('resolve-hitster-card'),
  placeHitsterCard: (targetSlot, targetPlayer) => ipcRenderer.invoke('place-hitster-card', { targetSlot, targetPlayer }),
  selectWallpaperFolder: () => ipcRenderer.invoke('select-wallpaper-folder'),
  selectWallpaperFile: () => ipcRenderer.invoke('select-wallpaper-file'),
  uploadWallpaper: (imagePath, movieTitle) => ipcRenderer.invoke('upload-wallpaper', { imagePath, movieTitle }),
  resolveWallpaper: () => ipcRenderer.invoke('resolve-wallpaper'),
  resumeRound: () => ipcRenderer.invoke('resume-round'),
  abortRound: () => ipcRenderer.invoke('abort-round'),
  toggleBoost: (forcedState) => ipcRenderer.invoke('toggle-boost', forcedState),
  setGoal: (target) => ipcRenderer.invoke('set-goal', target),
  getStreamUrl: () => ipcRenderer.invoke('get-stream-url'),
  pickNextWallpaper: () => ipcRenderer.invoke('pick-next-wallpaper'),
  pickRandomWallpaper: () => ipcRenderer.invoke('pick-random-wallpaper'),
  challengeHitsterChip: (playerIdOrName) => ipcRenderer.invoke('challenge-hitster-chip', playerIdOrName),
  adjustPlayerChips: (playerIdOrName, delta) => ipcRenderer.invoke('adjust-player-chips', { playerIdOrName, delta }),
  selectSpecificSong: (filePath) => ipcRenderer.invoke('select-specific-song', filePath),
  selectSpecificHitster: (filePath) => ipcRenderer.invoke('select-specific-hitster', filePath),
  selectSpecificWallpaper: (titleOrIndex) => ipcRenderer.invoke('select-specific-wallpaper', titleOrIndex),
  setWallpaperStagePoints: (pointsObj) => ipcRenderer.invoke('set-wallpaper-stage-points', pointsObj),
  setWallpaperStageTimes: (timesObj) => ipcRenderer.invoke('set-wallpaper-stage-times', timesObj),
  openStreamWindow: () => ipcRenderer.invoke('open-stream-window'),
  setPlaylistMode: (mode) => ipcRenderer.invoke('set-playlist-mode', mode),
  prepareNextSong: () => ipcRenderer.invoke('prepare-next-song'),
  stageNextSong: (filePath) => ipcRenderer.invoke('stage-next-song', filePath),
  playNextSong: () => ipcRenderer.invoke('play-next-song'),
  pauseSong: () => ipcRenderer.invoke('pause-song'),
  resumeSong: () => ipcRenderer.invoke('resume-song'),
  stopSong: () => ipcRenderer.invoke('stop-song'),

  // Window Controls (Custom Titlebar)
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (callback) => {
    const handler = (event, isMax) => callback(isMax);
    ipcRenderer.on('window-maximize-changed', handler);
    return () => ipcRenderer.removeListener('window-maximize-changed', handler);
  },

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
