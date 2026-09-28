// ==========================================================================
// MANNISBOX — CLIENT APPLICATION LOGIC (v1.1.0 - DELUXE ARENA & VOICE TRACK)
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const botStatusBadge = document.getElementById('botStatusBadge');
  const voiceStatusBadge = document.getElementById('voiceStatusBadge');
  const voiceStatusText = document.getElementById('voiceStatusText');
  const roundNumberBadge = document.getElementById('roundNumberBadge');
  const goalBadgeContainer = document.getElementById('goalBadgeContainer');
  const lblGoalValue = document.getElementById('lblGoalValue');
  const btnToggleBoost = document.getElementById('btnToggleBoost');
  const lblBoostStatus = document.getElementById('lblBoostStatus');
  const arenaBoostBanner = document.getElementById('arenaBoostBanner');

  // Grand Champion Victory Modal Elements
  const victoryModal = document.getElementById('victoryModal');
  const victoryWinnerAvatar = document.getElementById('victoryWinnerAvatar');
  const victoryWinnerName = document.getElementById('victoryWinnerName');
  const victoryWinnerScoreTag = document.getElementById('victoryWinnerScoreTag');
  const btnVictoryNewGame = document.getElementById('btnVictoryNewGame');
  const btnVictoryClose = document.getElementById('btnVictoryClose');

  const lblCurrentHost = document.getElementById('lblCurrentHost');
  const lblCurrentGuild = document.getElementById('lblCurrentGuild');
  const lblCurrentTextCh = document.getElementById('lblCurrentTextCh');
  const lblCurrentVoiceCh = document.getElementById('lblCurrentVoiceCh');

  const btnStartRound = document.getElementById('btnStartRound');
  const btnToggleLock = document.getElementById('btnToggleLock');
  const lblToggleLock = document.getElementById('lblToggleLock');
  const svgLockIcon = document.getElementById('svgLockIcon');
  const btnUndoAction = document.getElementById('btnUndoAction');
  const btnEndRound = document.getElementById('btnEndRound');
  const btnToggleVoice = document.getElementById('btnToggleVoice');
  const lblToggleVoice = document.getElementById('lblToggleVoice');
  const btnResetScores = document.getElementById('btnResetScores');
  const btnInviteBot = document.getElementById('btnInviteBot');

  const arenaStatusPill = document.getElementById('arenaStatusPill');
  const cooldownTimerPill = document.getElementById('cooldownTimerPill');
  const cooldownSecondsText = document.getElementById('cooldownSecondsText');
  const arenaStatusMessage = document.getElementById('arenaStatusMessage');
  const arenaCountdownOverlay = document.getElementById('arenaCountdownOverlay');
  const countdownBigNumber = document.getElementById('countdownBigNumber');

  const activeBuzzerCard = document.getElementById('activeBuzzerCard');
  const buzzerPlaceholder = document.getElementById('buzzerPlaceholder');
  const activePlayerAvatar = document.getElementById('activePlayerAvatar');
  const activePlayerName = document.getElementById('activePlayerName');
  const activePlayerTime = document.getElementById('activePlayerTime');
  const activePlayerScore = document.getElementById('activePlayerScore');
  const lblWrongPenalty = document.getElementById('lblWrongPenalty');
  const btnBanActivePlayer = document.getElementById('btnBanActivePlayer');

  const btnEvalWrong = document.getElementById('btnEvalWrong');
  const btnEvalSkip = document.getElementById('btnEvalSkip');
  const btnEvalCorrect = document.getElementById('btnEvalCorrect');
  const btnEvalPerfect = document.getElementById('btnEvalPerfect');

  const queueCountBadge = document.getElementById('queueCountBadge');
  const queueListContainer = document.getElementById('queueListContainer');
  const voiceMembersCountBadge = document.getElementById('voiceMembersCountBadge');
  const voiceMembersList = document.getElementById('voiceMembersList');
  const scoreboardList = document.getElementById('scoreboardList');
  const playerCountBadge = document.getElementById('playerCountBadge');

  // Bans Modal Elements
  const btnOpenBans = document.getElementById('btnOpenBans');
  const bannedCountDot = document.getElementById('bannedCountDot');
  const bannedModal = document.getElementById('bannedModal');
  const btnCloseBans = document.getElementById('btnCloseBans');
  const btnCloseBansFooter = document.getElementById('btnCloseBansFooter');
  const bannedListContainer = document.getElementById('bannedListContainer');

  // Settings Modal Elements
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnCancelSettings = document.getElementById('btnCancelSettings');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const settingsModal = document.getElementById('settingsModal');
  const cfgToken = document.getElementById('cfgToken');
  const btnToggleTokenVisibility = document.getElementById('btnToggleTokenVisibility');
  const svgEyeIcon = document.getElementById('svgEyeIcon');
  const cfgHostId = document.getElementById('cfgHostId');
  const selGuild = document.getElementById('selGuild');
  const selTextChannel = document.getElementById('selTextChannel');
  const selVoiceChannel = document.getElementById('selVoiceChannel');
  const rngVolume = document.getElementById('rngVolume');
  const lblVolumeVal = document.getElementById('lblVolumeVal');
  const btnInviteFromSettings = document.getElementById('btnInviteFromSettings');
  const testSoundBtns = document.querySelectorAll('.btn-test-sound');
  // Big Big Update Elements
  const screenFlashLayer = document.getElementById('screenFlashLayer');
  const btnModeSong = document.getElementById('btnModeSong');
  const btnModeHitster = document.getElementById('btnModeHitster');
  const btnModeWallpaper = document.getElementById('btnModeWallpaper');
  const btnToggleStreamView = document.getElementById('btnToggleStreamView');
  const btnCloseStreamView = document.getElementById('btnCloseStreamView');
  const inAppStreamContainer = document.getElementById('inAppStreamContainer');
  const inAppStreamFrame = document.getElementById('inAppStreamFrame');
  const btnCopyObsLink = document.getElementById('btnCopyObsLink');

  const songRegiePanel = document.getElementById('songRegiePanel');
  const wallpaperRegiePanel = document.getElementById('wallpaperRegiePanel');

  const btnSelectMusicFolder = document.getElementById('btnSelectMusicFolder');
  const lblMusicFolderStatus = document.getElementById('lblMusicFolderStatus');
  const selMusicGenre = document.getElementById('selMusicGenre');
  const btnPickRandomSong = document.getElementById('btnPickRandomSong');
  const btnPlaylistShuffle = document.getElementById('btnPlaylistShuffle');
  const btnPlaylistNumbered = document.getElementById('btnPlaylistNumbered');
  const btnRerollNextSong = document.getElementById('btnRerollNextSong');
  const lblNextSongTitle = document.getElementById('lblNextSongTitle');

  let lastActivePlayerId = null;
  let wasAudioPausedByBuzzer = false;

  const localAudioPlayer = document.getElementById('localAudioPlayer');
  const btnAudioPlayPause = document.getElementById('btnAudioPlayPause');
  const lblAudioTrackTitle = document.getElementById('lblAudioTrackTitle');
  const rngAudioPlayerVolume = document.getElementById('rngAudioPlayerVolume');

  const txtExcelArtist = document.getElementById('txtExcelArtist');
  const txtExcelTitle = document.getElementById('txtExcelTitle');
  const btnApplyExcelSong = document.getElementById('btnApplyExcelSong');

  const btnSelectWpFolder = document.getElementById('btnSelectWpFolder');
  const lblWpFolderStatus = document.getElementById('lblWpFolderStatus');
  const btnSelectWpImage = document.getElementById('btnSelectWpImage');
  const txtWpMovieTitle = document.getElementById('txtWpMovieTitle');
  const btnUploadWp = document.getElementById('btnUploadWp');
  const btnResolveWp = document.getElementById('btnResolveWp');

  const wpCard1 = document.getElementById('wpCard1');
  const wpCard2 = document.getElementById('wpCard2');
  const wpCard3 = document.getElementById('wpCard3');
  const wpCard4 = document.getElementById('wpCard4');

  const roundTimerPill = document.getElementById('roundTimerPill');
  const lblRoundTimerSeconds = document.getElementById('lblRoundTimerSeconds');
  const btnResumeRound = document.getElementById('btnResumeRound');
  const btnAbortRound = document.getElementById('btnAbortRound');

  // Frameless Window Titlebar Controls
  const titlebarMin = document.getElementById('titlebarMin');
  const titlebarMax = document.getElementById('titlebarMax');
  const titlebarClose = document.getElementById('titlebarClose');
  const titlebarIconMax = document.getElementById('titlebarIconMax');
  const titlebarIconRestore = document.getElementById('titlebarIconRestore');

  // 10s Buzzer Answer Timer Elements
  const answerTimerBox = document.getElementById('answerTimerBox');
  const lblAnswerTimerSeconds = document.getElementById('lblAnswerTimerSeconds');
  const answerTimerBarFill = document.getElementById('answerTimerBarFill');
  const answerExpiredAlert = document.getElementById('answerExpiredAlert');
  const btnExpiredEndRound = document.getElementById('btnExpiredEndRound');
  const btnExpiredRelease = document.getElementById('btnExpiredRelease');
  const btnPickNextWallpaper = document.getElementById('btnPickNextWallpaper');

  let selectedWpImagePath = '';
  let lastBoostActive = false;

  // Hitster Regie Elements
  const hitsterRegiePanel = document.getElementById('hitsterRegiePanel');
  const btnSelectHitsterFolder = document.getElementById('btnSelectHitsterFolder');
  const lblHitsterFolderStatus = document.getElementById('lblHitsterFolderStatus');
  const btnPickHitsterSong = document.getElementById('btnPickHitsterSong');
  const txtHitsterYear = document.getElementById('txtHitsterYear');
  const txtHitsterArtist = document.getElementById('txtHitsterArtist');
  const txtHitsterTitle = document.getElementById('txtHitsterTitle');
  const btnApplyHitsterCard = document.getElementById('btnApplyHitsterCard');
  const btnResolveHitster = document.getElementById('btnResolveHitster');
  const hitsterTimelineRegieList = document.getElementById('hitsterTimelineRegieList');

  // Arena Game Banners
  const arenaSongBanner = document.getElementById('arenaSongBanner');
  const arenaSongTitleText = document.getElementById('arenaSongTitleText');
  const arenaHitsterBanner = document.getElementById('arenaHitsterBanner');
  const arenaHitsterTrackText = document.getElementById('arenaHitsterTrackText');
  const arenaHitsterYearBadge = document.getElementById('arenaHitsterYearBadge');
  const arenaHitsterTimelineDeck = document.getElementById('arenaHitsterTimelineDeck');
  const hitsterSlotContainer = document.getElementById('hitsterSlotContainer');
  const txtNewPlayerName = document.getElementById('txtNewPlayerName');
  const btnAddPlayer = document.getElementById('btnAddPlayer');
  const arenaWallpaperBanner = document.getElementById('arenaWallpaperBanner');
  const arenaWpPreviewImg = document.getElementById('arenaWpPreviewImg');
  const arenaWpStageText = document.getElementById('arenaWpStageText');
  const arenaWpResolvedTitle = document.getElementById('arenaWpResolvedTitle');

  // Dynamic Evaluation Actions Sets
  const evalActionsSong = document.getElementById('evalActionsSong');
  const evalActionsHitster = document.getElementById('evalActionsHitster');
  const evalActionsWallpaper = document.getElementById('evalActionsWallpaper');

  const btnHitsterWrong = document.getElementById('btnHitsterWrong');
  const btnHitsterSkip = document.getElementById('btnHitsterSkip');
  const btnHitsterCorrect = document.getElementById('btnHitsterCorrect');
  const btnHitsterRevealCenter = document.getElementById('btnHitsterRevealCenter');

  const btnWpWrong = document.getElementById('btnWpWrong');
  const btnWpSkip = document.getElementById('btnWpSkip');
  const btnWpCorrect = document.getElementById('btnWpCorrect');
  const btnWpResolveCenter = document.getElementById('btnWpResolveCenter');
  const lblWpCorrectPointsSub = document.getElementById('lblWpCorrectPointsSub');

  // 3D Startup Gate & Physical Rig Elements
  const startupGateModal = document.getElementById('startupGateModal');
  const cardSelectSong = document.getElementById('cardSelectSong');
  const cardSelectHitster = document.getElementById('cardSelectHitster');
  const cardSelectWallpaper = document.getElementById('cardSelectWallpaper');
  const btnOpenGamePicker = document.getElementById('btnOpenGamePicker');
  const btnPhysicalBuzzer = document.getElementById('btnPhysicalBuzzer');
  const sceneHitsterCard = document.getElementById('sceneHitsterCard');
  const hitster3DFlippableCard = document.getElementById('hitster3DFlippableCard');
  const arenaHitsterCardYear = document.getElementById('arenaHitsterCardYear');

  // Dynamic 3D Game-Faithful Boards & UI Elements
  const arenaModeIconBadge = document.getElementById('arenaModeIconBadge');
  const arenaMainTitle = document.getElementById('arenaMainTitle');
  const arenaModeSubtitle = document.getElementById('arenaModeSubtitle');
  const arenaBoardSong = document.getElementById('arenaBoardSong');
  const arenaBoardHitster = document.getElementById('arenaBoardHitster');
  const arenaBoardWallpaper = document.getElementById('arenaBoardWallpaper');
  const btnHitsterDeckPlay = document.getElementById('btnHitsterDeckPlay');
  const btnHitsterDeckNext = document.getElementById('btnHitsterDeckNext');
  const btnHitsterQuickReveal = document.getElementById('btnHitsterQuickReveal');
  const arenaHitsterCardTitle = document.getElementById('arenaHitsterCardTitle');
  const selHitsterActivePlayer = document.getElementById('selHitsterActivePlayer');
  const hitsterPlayerShelvesContainer = document.getElementById('hitsterPlayerShelvesContainer');
  const hitsterDecadesBar = document.getElementById('hitsterDecadesBar');
  const arenaWpClapperTitle = document.getElementById('arenaWpClapperTitle');
  const arenaWpStageBadge = document.getElementById('arenaWpStageBadge');
  const lblWpNextStageTimer = document.getElementById('lblWpNextStageTimer');
  const arenaWpCinemaImg = document.getElementById('arenaWpCinemaImg');
  const arenaWpScreenPlaceholder = document.getElementById('arenaWpScreenPlaceholder');
  const circleWpProgress = document.getElementById('circleWpProgress');
  const lblWpRadialSeconds = document.getElementById('lblWpRadialSeconds');
  const arenaWpResolvedOverlay = document.getElementById('arenaWpResolvedOverlay');
  const arenaWpResolvedTitleLarge = document.getElementById('arenaWpResolvedTitleLarge');

  // Hitster in-memory player cards collection (username -> [{ year, title, artist }])
  const playerHitsterCards = {};

  // Live Folder Search & Autocomplete Elements
  const txtSearchSong = document.getElementById('txtSearchSong');
  const songSearchResults = document.getElementById('songSearchResults');
  const txtSearchHitster = document.getElementById('txtSearchHitster');
  const hitsterSearchResults = document.getElementById('hitsterSearchResults');
  const txtSearchWallpaper = document.getElementById('txtSearchWallpaper');
  const wpSearchResults = document.getElementById('wpSearchResults');

  // Interactive Score & Floating Editor Popup Elements
  const lblHostScore = document.getElementById('lblHostScore');
  const quickScoreEditorPopup = document.getElementById('quickScoreEditorPopup');
  const btnQuickScoreClose = document.getElementById('btnQuickScoreClose');
  const quickScorePlayerName = document.getElementById('quickScorePlayerName');
  const txtQuickScoreValue = document.getElementById('txtQuickScoreValue');
  const btnQuickScoreSave = document.getElementById('btnQuickScoreSave');

  // Loaded assets cache for instant 60fps search
  let loadedMusicFiles = [];
  let loadedWallpaperRounds = [];
  let editingScorePlayer = null;
  let customWallpaperStagePoints = { 1: 4, 2: 3, 3: 2, 4: 1 };

  // Bespoke Vector SVG Icons (No broken emojis)
  const SVG_CHIP = `<svg class="svg-chip-icon" viewBox="0 0 24 24" width="15" height="15" fill="none"><circle cx="12" cy="12" r="10" stroke="#f59e0b" stroke-width="2" fill="#78350f" stroke-dasharray="3.2 2"/><circle cx="12" cy="12" r="6.5" stroke="#fbbf24" stroke-width="1.5" fill="#1e1b4b"/><circle cx="12" cy="12" r="3" fill="#fbbf24"/></svg>`;
  const SVG_PENCIL = `<svg class="ui-svg-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
  const SVG_DISC = `<svg class="ui-svg-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`;
  const SVG_TROPHY = `<svg class="ui-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`;
  const SVG_TARGET = `<svg class="ui-svg-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;

  // Bespoke In-App Modal Dialogs (Alert / Confirm / Prompt - Replaces ugly Windows popups)
  function showCustomAlert(message, title = 'MannisBox') {
    return new Promise((resolve) => {
      const modal = document.getElementById('customAppDialogModal');
      const titleEl = document.getElementById('customDialogTitle');
      const msgEl = document.getElementById('customDialogMessage');
      const iconEl = document.getElementById('customDialogIconContainer');
      const inputEl = document.getElementById('customDialogInput');
      const cancelBtn = document.getElementById('btnCustomDialogCancel');
      const confirmBtn = document.getElementById('btnCustomDialogConfirm');

      if (!modal) {
        window.alert(message);
        return resolve();
      }

      titleEl.textContent = title;
      msgEl.textContent = message;
      inputEl.classList.add('hidden');
      cancelBtn.classList.add('hidden');
      confirmBtn.textContent = 'Verstanden';

      iconEl.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#6366f1" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
      iconEl.style.borderColor = '#6366f1';
      iconEl.style.background = 'rgba(99, 102, 241, 0.15)';

      modal.classList.remove('hidden');
      confirmBtn.focus();

      function onConfirm() {
        cleanup();
        resolve();
      }

      function onKeyDown(e) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          onConfirm();
        }
      }

      function cleanup() {
        confirmBtn.removeEventListener('click', onConfirm);
        document.removeEventListener('keydown', onKeyDown);
        modal.classList.add('hidden');
      }

      confirmBtn.addEventListener('click', onConfirm);
      document.addEventListener('keydown', onKeyDown);
    });
  }

  function showCustomConfirm(message, title = 'Bestätigung erforderlich') {
    return new Promise((resolve) => {
      const modal = document.getElementById('customAppDialogModal');
      const titleEl = document.getElementById('customDialogTitle');
      const msgEl = document.getElementById('customDialogMessage');
      const iconEl = document.getElementById('customDialogIconContainer');
      const inputEl = document.getElementById('customDialogInput');
      const cancelBtn = document.getElementById('btnCustomDialogCancel');
      const confirmBtn = document.getElementById('btnCustomDialogConfirm');

      if (!modal) {
        return resolve(window.confirm(message));
      }

      titleEl.textContent = title;
      msgEl.textContent = message;
      inputEl.classList.add('hidden');
      cancelBtn.classList.remove('hidden');
      cancelBtn.textContent = 'Abbrechen';
      confirmBtn.textContent = 'Bestätigen';

      iconEl.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      iconEl.style.borderColor = '#f59e0b';
      iconEl.style.background = 'rgba(245, 158, 11, 0.15)';

      modal.classList.remove('hidden');
      confirmBtn.focus();

      function onConfirm() {
        cleanup();
        resolve(true);
      }

      function onCancel() {
        cleanup();
        resolve(false);
      }

      function onKeyDown(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onConfirm();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }

      function cleanup() {
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        document.removeEventListener('keydown', onKeyDown);
        modal.classList.add('hidden');
      }

      confirmBtn.addEventListener('click', onConfirm);
      cancelBtn.addEventListener('click', onCancel);
      document.addEventListener('keydown', onKeyDown);
    });
  }

  function showCustomPrompt(message, defaultValue = '', title = 'Eingabe erforderlich') {
    return new Promise((resolve) => {
      const modal = document.getElementById('customAppDialogModal');
      const titleEl = document.getElementById('customDialogTitle');
      const msgEl = document.getElementById('customDialogMessage');
      const iconEl = document.getElementById('customDialogIconContainer');
      const inputEl = document.getElementById('customDialogInput');
      const cancelBtn = document.getElementById('btnCustomDialogCancel');
      const confirmBtn = document.getElementById('btnCustomDialogConfirm');

      if (!modal) {
        return resolve(window.prompt(message, defaultValue));
      }

      titleEl.textContent = title;
      msgEl.textContent = message;
      inputEl.value = defaultValue;
      inputEl.classList.remove('hidden');
      cancelBtn.classList.remove('hidden');
      cancelBtn.textContent = 'Abbrechen';
      confirmBtn.textContent = 'Übernehmen';

      iconEl.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
      iconEl.style.borderColor = '#38bdf8';
      iconEl.style.background = 'rgba(56, 189, 248, 0.15)';

      modal.classList.remove('hidden');
      inputEl.focus();
      inputEl.select();

      function onConfirm() {
        const val = inputEl.value;
        cleanup();
        resolve(val);
      }

      function onCancel() {
        cleanup();
        resolve(null);
      }

      function onKeyDown(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onConfirm();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }

      function cleanup() {
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        inputEl.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keydown', onKeyDown);
        inputEl.classList.add('hidden');
        modal.classList.add('hidden');
      }

      confirmBtn.addEventListener('click', onConfirm);
      cancelBtn.addEventListener('click', onCancel);
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onConfirm();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      });
    });
  }

  // Local state
  let config = {};
  let currentGameState = null;
  let botOnline = false;
  let hostDisplayName = 'Manni';
  let botInviteUrl = 'https://discord.com/oauth2/authorize?client_id=1530938008532946985&permissions=8&integration_type=0&scope=bot+applications.commands';
  let availableGuilds = [];
  let availableChannels = { text: [], voice: [] };

  // Audio Context for instant local speaker playback
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Soft ticking countdown sound
  function playTickSound() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {}
  }

  // 1. Initialise Config
  try {
    config = await window.mannisBoxAPI.getConfig();
    populateSettingsForm(config);
    updateHostDisplay();
    updateChannelLabels();
    refreshGuildsAndChannels();
  } catch (err) {
    console.error('Error loading config:', err);
  }

  function updateHostDisplay() {
    const id = config.hostId || '327863089796087809';
    const name = (currentGameState && currentGameState.hostName) ? currentGameState.hostName : hostDisplayName;
    lblCurrentHost.textContent = `@${id} (${name})`;
  }

  // 2. Setup IPC Listeners
  window.mannisBoxAPI.onBotStatus(async (status) => {
    const isOnline = !!(status.online || status.connected);
    botOnline = isOnline;
    if (isOnline) {
      const tag = status.tag || status.user?.tag || 'MannisBox#6040';
      botStatusBadge.className = 'status-badge online';
      botStatusBadge.querySelector('.status-text').textContent = 'Bot Online (' + tag + ')';
      if (status.inviteUrl) botInviteUrl = status.inviteUrl;
      if (status.hostName) hostDisplayName = status.hostName;
      updateHostDisplay();
      await refreshGuildsAndChannels();
    } else {
      botStatusBadge.className = 'status-badge offline';
      botStatusBadge.querySelector('.status-text').textContent = status.error ? ('Fehler: ' + status.error) : 'Bot Offline';
    }
  });

  window.mannisBoxAPI.onVoiceStatus((status) => {
    if (status.connected) {
      voiceStatusBadge.className = 'status-badge voice-connected';
      voiceStatusText.textContent = 'Voice: Verbunden';
      lblToggleVoice.textContent = 'Voice trennen';
    } else {
      voiceStatusBadge.className = 'status-badge voice-disconnected';
      voiceStatusText.textContent = 'Voice: Nicht verbunden';
      lblToggleVoice.textContent = 'Voice verbinden';
    }
  });

  window.mannisBoxAPI.onGameState((state) => {
    currentGameState = state;
    if (state.hostName) hostDisplayName = state.hostName;
    renderGameState(state);
  });

  window.mannisBoxAPI.onError(async (err) => {
    await showCustomAlert('Discord Bot Fehler: ' + err, 'Bot Fehler');
  });

  // 3. Epic Local Sound Synthesizer
  function playLocalSound(type) {
    const ctx = getAudioContext();
    const volPercent = parseInt(rngVolume.value, 10) / 100;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volPercent * 0.85, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const t = ctx.currentTime;

    if (type === 'buzzer') {
      const oscSub = ctx.createOscillator();
      const subGain = ctx.createGain();
      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(100, t);
      oscSub.frequency.exponentialRampToValueAtTime(40, t + 0.45);
      subGain.gain.setValueAtTime(0.6, t);
      subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
      oscSub.connect(subGain);
      subGain.connect(masterGain);
      oscSub.start(t);
      oscSub.stop(t + 0.45);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(220, t);
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(440, t);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.5);
      osc2.stop(t + 0.5);

    } else if (type === 'wrong') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(155.56, t);
      osc1.frequency.setValueAtTime(116.54, t + 0.38);
      osc2.frequency.setValueAtTime(77.78, t);
      osc2.frequency.setValueAtTime(58.27, t + 0.38);

      gain.gain.setValueAtTime(0.65, t);
      gain.gain.setValueAtTime(0.65, t + 0.38);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.85);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.85);
      osc2.stop(t + 0.85);

    } else if (type === 'correct') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = t + idx * 0.13;
        const dur = idx === 3 ? 0.65 : 0.4;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);
        oscHarmonic.type = 'sine';
        oscHarmonic.frequency.setValueAtTime(freq * 2, noteStart);

        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.55, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + dur);

        osc.connect(gain);
        oscHarmonic.connect(gain);
        gain.connect(masterGain);

        osc.start(noteStart);
        oscHarmonic.start(noteStart);
        osc.stop(noteStart + dur);
        oscHarmonic.stop(noteStart + dur);
      });

    } else if (type === 'perfect') {
      const triplet = [523.25, 659.25, 783.99];
      triplet.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = t + idx * 0.11;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.5, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.01, noteStart + 0.3);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(noteStart);
        osc.stop(noteStart + 0.3);
      });

      const chordStart = t + 0.33;
      const chordFreqs = [523.25, 783.99, 1046.50, 1318.51];
      chordFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, chordStart);
        gain.gain.setValueAtTime(0, chordStart);
        gain.gain.linearRampToValueAtTime(0.65, chordStart + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, chordStart + 1.1);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(chordStart);
        osc.stop(chordStart + 1.1);
      });
    }
  }

  // 3.5 Hitster Player Shelves Rendering (Real Hitster Rules & Progress to 10 cards)
  function renderHitsterPlayerShelves(state) {
    if (!hitsterPlayerShelvesContainer) return;

    // Reset local cache if scores are empty
    if (state && (!state.scores || Object.keys(state.scores).length === 0)) {
      Object.keys(playerHitsterCards).forEach(k => delete playerHitsterCards[k]);
    }

    // Sync from state.hitsterState.playerShelves and scores
    if (state?.hitsterState?.playerShelves) {
      Object.entries(state.hitsterState.playerShelves).forEach(([name, shelf]) => {
        if (shelf?.cards && Array.isArray(shelf.cards)) {
          playerHitsterCards[name] = [...shelf.cards];
        }
      });
    }
    if (state?.scores) {
      Object.values(state.scores).forEach(p => {
        if (p.cards && Array.isArray(p.cards) && p.cards.length > 0) {
          playerHitsterCards[p.username] = [...p.cards];
        }
      });
    }

    const allPlayersMap = {};
    if (state && state.scores) {
      Object.values(state.scores).forEach(p => {
        allPlayersMap[p.username] = { id: p.id, username: p.username, avatar: p.avatar, points: p.points || 0 };
      });
    }
    if (state && state.voiceMembers) {
      state.voiceMembers.forEach(m => {
        if (!allPlayersMap[m.username]) {
          allPlayersMap[m.username] = { id: m.id, username: m.username, avatar: m.avatar, points: 0 };
        }
      });
    }

    Object.keys(playerHitsterCards).forEach(name => {
      if (!allPlayersMap[name]) {
        allPlayersMap[name] = { id: name, username: name, avatar: '../../App.png', points: 0 };
      }
    });

    const playerNames = Object.keys(allPlayersMap);

    // Update Dropdown in Hitster Evaluation Bar
    if (selHitsterActivePlayer) {
      const currentSelected = selHitsterActivePlayer.value;
      let opts = '<option value="">(Wähle Spieler...)</option>';
      playerNames.forEach(name => {
        opts += `<option value="${escapeHtml(name)}" ${name === currentSelected ? 'selected' : ''}>${escapeHtml(name)}</option>`;
      });
      selHitsterActivePlayer.innerHTML = opts;

      if (currentSelected && playerNames.includes(currentSelected)) {
        selHitsterActivePlayer.value = currentSelected;
      } else if (state && state.activePlayer && state.activePlayer.username) {
        selHitsterActivePlayer.value = state.activePlayer.username;
      } else if (playerNames.length > 0 && !selHitsterActivePlayer.value) {
        selHitsterActivePlayer.value = playerNames[0];
      }
    }

    if (playerNames.length === 0) {
      hitsterPlayerShelvesContainer.innerHTML = '<div class="queue-empty">Keine Spieler angelegt. Starte eine Runde oder lege rechts Spieler an!</div>';
      return;
    }

    hitsterPlayerShelvesContainer.innerHTML = playerNames.map(name => {
      const p = allPlayersMap[name];
      const cards = (state?.hitsterState?.playerShelves?.[name]?.cards) || playerHitsterCards[name] || (p.cards && Array.isArray(p.cards) ? p.cards : []);
      const chips = (state?.hitsterState?.playerShelves?.[name]?.chips !== undefined) ? state.hitsterState.playerShelves[name].chips : (p.chips !== undefined ? p.chips : 3);
      const count = cards.length;
      const isWinner = count >= 10;

      const cardsHtml = count === 0
        ? '<span class="shelf-empty-hint">Noch keine Karten gesammelt</span>'
        : cards.map(c => `
            <div class="hitster-shelf-chip">
              <span class="chip-year">${SVG_DISC} ${c.year}</span>
              <span class="chip-title" title="${escapeHtml(c.title)}">${escapeHtml(c.title)}</span>
            </div>
          `).join('');

      return `
        <div class="hitster-player-shelf ${isWinner ? 'winner-shelf' : ''}">
          <div class="player-shelf-header">
            <div class="player-shelf-name">
              <img src="${p.avatar || '../../App.png'}" class="shelf-avatar" alt="Avatar">
              <span>${escapeHtml(p.username)}</span>
              ${isWinner ? `<span class="winner-trophy-badge">${SVG_TROPHY} GEWINNER!</span>` : ''}
              <div class="hitster-chips-badge" title="Hitster Spielchips zum Anfechten">
                <span>${SVG_CHIP} ${chips}</span>
                <button class="btn-chip-adjust" data-player="${escapeHtml(p.username)}" data-delta="-1" title="Chip abziehen">-</button>
                <button class="btn-chip-adjust" data-player="${escapeHtml(p.username)}" data-delta="1" title="Chip hinzufügen">+</button>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="btn-throw-chip" data-player="${escapeHtml(p.username)}" title="Diesen Spieler anfechten lassen (Chip werfen)">
                <span>${SVG_CHIP} Chip werfen</span>
              </button>
              <span class="player-shelf-progress">${SVG_TARGET} ${count} / 10 Karten</span>
            </div>
          </div>
          <div class="player-shelf-timeline">
            ${cardsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Render Game State
  let lastHandledFlash = null;

  function renderGameState(state) {
    if (!state) return;

    // Game Mode Sync & 3D WebGL Horizon
    const mode = state.gameMode;
    const isStandby = !mode || mode === 'standby';

    if (isStandby) {
      if (startupGateModal) startupGateModal.classList.remove('hidden');
    } else {
      if (startupGateModal && !startupGateModal.dataset.manualOpen) {
        startupGateModal.classList.add('hidden');
      }
    }

    btnModeSong.classList.toggle('active', mode === 'song');
    btnModeHitster.classList.toggle('active', mode === 'hitster');
    btnModeWallpaper.classList.toggle('active', mode === 'wallpaper');

    if (window.ue5StageInstance) {
      window.ue5StageInstance.setGameMode(isStandby ? 'standby' : mode);
    }

    // Dynamic 3-Board Middle Column Switch
    if (arenaBoardSong) arenaBoardSong.classList.toggle('hidden', mode !== 'song');
    if (arenaBoardHitster) arenaBoardHitster.classList.toggle('hidden', mode !== 'hitster');
    if (arenaBoardWallpaper) arenaBoardWallpaper.classList.toggle('hidden', mode !== 'wallpaper');

    // Dynamic Arena Main Header
    if (arenaModeIconBadge && arenaMainTitle) {
      if (mode === 'wallpaper') {
        arenaModeIconBadge.textContent = '🎬';
        arenaMainTitle.textContent = 'Filme & Wallpaper Quiz';
      } else if (mode === 'hitster') {
        arenaModeIconBadge.textContent = '📻';
        arenaMainTitle.textContent = 'Hitster Zeitstrahl';
      } else {
        arenaModeIconBadge.textContent = '🎵';
        arenaMainTitle.textContent = 'Erkennst du den Song';
      }
    }

    // Regie Sub-Panels
    songRegiePanel.classList.toggle('hidden', mode !== 'song');
    hitsterRegiePanel.classList.toggle('hidden', mode !== 'hitster');
    wallpaperRegiePanel.classList.toggle('hidden', mode !== 'wallpaper');

    // Arena Game Banners
    if (arenaSongBanner) arenaSongBanner.classList.toggle('hidden', mode !== 'song');
    if (arenaHitsterBanner) arenaHitsterBanner.classList.toggle('hidden', mode !== 'hitster');
    if (arenaWallpaperBanner) arenaWallpaperBanner.classList.toggle('hidden', mode !== 'wallpaper');

    // Evaluation Actions Sets
    evalActionsSong.classList.toggle('hidden', mode !== 'song');
    evalActionsHitster.classList.toggle('hidden', mode !== 'hitster');
    evalActionsWallpaper.classList.toggle('hidden', mode !== 'wallpaper');

    // Fullscreen Screen Flash
    if (state.screenFlash === 'green' && lastHandledFlash !== 'green') {
      screenFlashLayer.className = 'screen-flash-layer flash-glow-green';
      setTimeout(() => { screenFlashLayer.className = 'screen-flash-layer'; }, 1400);
    } else if (state.screenFlash === 'red' && lastHandledFlash !== 'red') {
      screenFlashLayer.className = 'screen-flash-layer flash-glow-red';
      setTimeout(() => { screenFlashLayer.className = 'screen-flash-layer'; }, 1400);
    }
    lastHandledFlash = state.screenFlash;

    // Round Timer HUD
    if (state.roundTimer && state.roundTimer.active) {
      lblRoundTimerSeconds.textContent = Math.ceil(state.roundTimer.remaining) + 's';
      roundTimerPill.classList.remove('hidden');
    } else {
      lblRoundTimerSeconds.textContent = '--s';
    }

    // Goal & Boost State Handling
    if (lblGoalValue) {
      lblGoalValue.textContent = state.goal || (mode === 'hitster' ? 10 : 50);
    }
    const isBoostActive = !!state.isBoostActive;
    if (btnToggleBoost) {
      btnToggleBoost.classList.toggle('active', isBoostActive);
      if (lblBoostStatus) {
        lblBoostStatus.textContent = 'BOOST 2X';
      }
    }
    if (arenaBoostBanner) {
      arenaBoostBanner.classList.toggle('hidden', !isBoostActive);
    }
    if (btnPhysicalBuzzer) {
      btnPhysicalBuzzer.classList.toggle('boosted', isBoostActive);
    }
    if (window.ue5StageInstance) {
      window.ue5StageInstance.setBoostActive(isBoostActive);
      if (isBoostActive && !lastBoostActive) {
        window.ue5StageInstance.triggerBoostSupercharge();
        document.body.classList.add('screen-shake-boost');
        setTimeout(() => document.body.classList.remove('screen-shake-boost'), 650);
        screenFlashLayer.className = 'screen-flash-layer flash-glow-boost';
        setTimeout(() => { screenFlashLayer.className = 'screen-flash-layer'; }, 850);
      }
    }
    lastBoostActive = isBoostActive;

    // Grand Champion Victory Celebration Modal
    if (state.winner) {
      if (victoryModal && victoryModal.classList.contains('hidden')) {
        victoryModal.classList.remove('hidden');
        playLocalSound('perfect');
        if (window.ue5StageInstance) window.ue5StageInstance.triggerBuzzerShockwave();
      }
      if (victoryWinnerAvatar) {
        victoryWinnerAvatar.src = state.winner.avatar || '../../App.png';
      }
      if (victoryWinnerName) {
        victoryWinnerName.textContent = state.winner.username || 'Champion';
      }
      if (victoryWinnerScoreTag) {
        victoryWinnerScoreTag.textContent = (state.winner.cards ? `${state.winner.cards} Karten` : `${state.winner.points || 0} Punkte`) + ' • Sieger!';
      }
    } else {
      if (victoryModal && !victoryModal.dataset.manuallyOpened) {
        victoryModal.classList.add('hidden');
      }
    }

    // 1. Song Quiz State Rendering (In Modansicht immer unverschlüsselt anzeigen)
    if (state.songState) {
      const song = state.songState;
      const displaySong = song.fullTitle || (song.title ? `${song.artist || 'Unbekannt'} - ${song.title}` : 'Kein Track aktiv');
      arenaSongTitleText.textContent = displaySong;
      if (song.fullTitle) lblAudioTrackTitle.textContent = song.fullTitle;
    }

    // Next Song Slot & Playlist Mode Sync
    if (state.nextSong && lblNextSongTitle) {
      lblNextSongTitle.textContent = state.nextSong.fullTitle || 'Kein Track vorgemerkt';
      lblNextSongTitle.title = state.nextSong.fullTitle || '';
      btnPickRandomSong.disabled = false;
    } else if (lblNextSongTitle && !state.songState?.filePath) {
      lblNextSongTitle.textContent = 'Kein Track vorgemerkt';
      btnPickRandomSong.disabled = true;
    }

    if (state.playlistMode) {
      if (btnPlaylistShuffle) btnPlaylistShuffle.classList.toggle('active', state.playlistMode === 'shuffle');
      if (btnPlaylistNumbered) btnPlaylistNumbered.classList.toggle('active', state.playlistMode === 'numbered');
    }

    // 2. Hitster State Rendering
    if (state.hitsterState) {
      const card = state.hitsterState.currentCard;
      const flippableCard = document.getElementById('hitster3DFlippableCard');
      const cardYearNumber = document.getElementById('arenaHitsterCardYear');
      if (card && card.title) {
        const fullTrackText = `${card.artist || 'Unbekannt'} - ${card.title}`;
        arenaHitsterTrackText.textContent = fullTrackText;
        if (arenaHitsterCardTitle) arenaHitsterCardTitle.textContent = fullTrackText;
        if (cardYearNumber) cardYearNumber.textContent = card.revealed ? (card.year || '????') : '????';
        if (flippableCard) {
          if (card.revealed) {
            flippableCard.classList.add('is-flipped');
          } else {
            flippableCard.classList.remove('is-flipped');
          }
        }
        if (card.revealed) {
          arenaHitsterYearBadge.textContent = card.year || '????';
          arenaHitsterYearBadge.style.background = '#10b981';
        } else {
          arenaHitsterYearBadge.textContent = '????';
          arenaHitsterYearBadge.style.background = 'linear-gradient(180deg, #8b5cf6, #6d28d9)';
        }
      } else {
        arenaHitsterTrackText.textContent = 'Kein Song aktiv';
        if (arenaHitsterCardTitle) arenaHitsterCardTitle.textContent = 'Warte auf Track...';
        if (cardYearNumber) cardYearNumber.textContent = '????';
        if (flippableCard) flippableCard.classList.remove('is-flipped');
        arenaHitsterYearBadge.textContent = '????';
      }

      // Render timeline list in Regie
      const timeline = state.hitsterState.timeline || [];
      if (timeline.length > 0) {
        hitsterTimelineRegieList.innerHTML = timeline.map(c => `
          <div class="hitster-timeline-chip">
            <span style="color: #fbbf24; font-weight: 900; display: inline-flex; align-items: center; gap: 4px;">${SVG_DISC} ${c.year}</span>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(c.title)}</span>
          </div>
        `).join('');
      } else {
        hitsterTimelineRegieList.innerHTML = '<span style="font-size: 10px; color: #64748b;">Noch keine Karten platziert</span>';
      }

      // Render Interactive Arena Deck
      arenaHitsterTimelineDeck.classList.toggle('hidden', state.gameMode !== 'hitster');
      if (hitsterSlotContainer) {
        let slotHtml = '';
        if (timeline.length === 0) {
          slotHtml = `
            <button class="hitster-slot-btn" data-slot="0">
              <span>${SVG_TARGET} ERSTE KARTE</span>
              <small>Hier platzieren</small>
            </button>
          `;
        } else {
          slotHtml += `
            <button class="hitster-slot-btn" data-slot="0">
              <span>${SVG_TARGET} VOR ${timeline[0].year}</span>
              <small>Älter als ${timeline[0].year}</small>
            </button>
          `;

          for (let i = 0; i < timeline.length; i++) {
            const tc = timeline[i];
            slotHtml += `
              <div class="hitster-placed-card">
                <span class="hitster-placed-year">${SVG_DISC} ${tc.year}</span>
                <span class="hitster-placed-title" title="${escapeHtml(tc.title)}">${escapeHtml(tc.title)}</span>
                <span class="hitster-placed-artist" title="${escapeHtml(tc.artist || '')}">${escapeHtml(tc.artist || '')}</span>
              </div>
            `;

            if (i < timeline.length - 1) {
              const nextTc = timeline[i + 1];
              slotHtml += `
                <button class="hitster-slot-btn" data-slot="${i + 1}">
                  <span>${SVG_TARGET} DAZWISCHEN</span>
                  <small>${tc.year} – ${nextTc.year}</small>
                </button>
              `;
            } else {
              slotHtml += `
                <button class="hitster-slot-btn" data-slot="${timeline.length}">
                  <span>${SVG_TARGET} NACH ${tc.year}</span>
                  <small>Neuer als ${tc.year}</small>
                </button>
              `;
            }
          }
        }
        hitsterSlotContainer.innerHTML = slotHtml;

        hitsterSlotContainer.querySelectorAll('.hitster-slot-btn').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const slotIdx = parseInt(btn.getAttribute('data-slot'), 10);
            const targetPlayer = selHitsterActivePlayer?.value || currentGameState?.activePlayer?.username || '';
            const res = await window.mannisBoxAPI.placeHitsterCard(slotIdx, targetPlayer);
            if (res && res.player && res.correct) {
              if (!playerHitsterCards[res.player.username]) playerHitsterCards[res.player.username] = [];
              playerHitsterCards[res.player.username] = [...(res.player.cards || [])];
              renderHitsterPlayerShelves(currentGameState);
            }
          });
        });
      }

      // Render Real Hitster Player Shelves
      renderHitsterPlayerShelves(state);
    }

    // 3. Wallpaper Quiz State Rendering
    if (state.wallpaperState) {
      const wp = state.wallpaperState;
      const st = Math.min(5, Math.max(1, wp.stage || 1));
      wpCard1.classList.toggle('active-stage', st === 1);
      wpCard2.classList.toggle('active-stage', st === 2);
      wpCard3.classList.toggle('active-stage', st === 3);
      wpCard4.classList.toggle('active-stage', st === 4);

      if (state.wallpaperStagePoints) {
        customWallpaperStagePoints = { ...state.wallpaperStagePoints };
      }
      const p1 = customWallpaperStagePoints[1] ?? 4;
      const p2 = customWallpaperStagePoints[2] ?? 3;
      const p3 = customWallpaperStagePoints[3] ?? 2;
      const p4 = customWallpaperStagePoints[4] ?? 1;
      const el1 = document.getElementById('lblWpStage1Pts');
      const el2 = document.getElementById('lblWpStage2Pts');
      const el3 = document.getElementById('lblWpStage3Pts');
      const el4 = document.getElementById('lblWpStage4Pts');
      if (el1) el1.textContent = `${p1} Pkt`;
      if (el2) el2.textContent = `${p2} Pkt`;
      if (el3) el3.textContent = `${p3} Pkt`;
      if (el4) el4.textContent = `${p4} Pkt`;

      arenaWpStageText.textContent = `Stufe ${st} (${wp.points || 4} Pkt)`;
      lblWpCorrectPointsSub.textContent = `+${state.activePlayer?.potentialPoints || wp.points || 4} Pkt`;

      // Cinema Theater 16:9 Screen & Progressive Blur
      const imgPath = wp.imagePath || wp.currentImage;
      if (imgPath) {
        arenaWpCinemaImg.src = `http://localhost:8888/api/image?path=${encodeURIComponent(imgPath)}`;
        arenaWpCinemaImg.style.display = 'block';
        if (arenaWpScreenPlaceholder) arenaWpScreenPlaceholder.style.display = 'none';
      } else {
        arenaWpCinemaImg.style.display = 'none';
        if (arenaWpScreenPlaceholder) arenaWpScreenPlaceholder.style.display = 'flex';
      }

      if (wp.resolved) {
        arenaWpCinemaImg.className = 'cinema-wallpaper-image blur-stage-5';
        arenaWpResolvedTitle.textContent = wp.movieTitle || 'Film Aufgelöst';
        if (arenaWpResolvedOverlay) arenaWpResolvedOverlay.classList.remove('hidden');
        if (arenaWpResolvedTitleLarge) arenaWpResolvedTitleLarge.textContent = wp.movieTitle || 'Film Aufgelöst!';
        if (arenaWpClapperTitle) {
          arenaWpClapperTitle.textContent = 'FILM: ' + (wp.movieTitle || 'Aufgelöst');
          arenaWpClapperTitle.classList.remove('film-blurred');
          arenaWpClapperTitle.classList.add('film-revealed');
        }
        if (arenaWpStageBadge) arenaWpStageBadge.textContent = 'AUFGELÖST';
        if (lblWpNextStageTimer) lblWpNextStageTimer.textContent = 'Film aufgedeckt';
        if (lblWpRadialSeconds) lblWpRadialSeconds.textContent = '✓';
      } else {
        arenaWpCinemaImg.className = `cinema-wallpaper-image blur-stage-${st}`;
        arenaWpResolvedTitle.textContent = '';
        if (arenaWpResolvedOverlay) arenaWpResolvedOverlay.classList.add('hidden');
        if (arenaWpClapperTitle) {
          arenaWpClapperTitle.textContent = 'FILM: ' + (wp.movieTitle || 'Film gesucht...');
          arenaWpClapperTitle.classList.remove('film-revealed');
          arenaWpClapperTitle.classList.add('film-blurred');
        }
        if (arenaWpStageBadge) arenaWpStageBadge.textContent = `STUFE ${st} • ${wp.points || 4} PUNKTE`;

        // 10-Second Countdown Radial Meter
        if (state.roundTimer && state.roundTimer.active) {
          const rem = Math.max(0, state.roundTimer.remaining);
          const inStage = Math.ceil(rem % 10) || 10;
          if (lblWpRadialSeconds) lblWpRadialSeconds.textContent = inStage + 's';
          if (lblWpNextStageTimer) lblWpNextStageTimer.textContent = `Nächste Stufe in ${inStage}s`;
          const offset = (113.1 * (1 - inStage / 10)).toFixed(1);
          if (circleWpProgress) circleWpProgress.style.strokeDashoffset = offset;
        } else {
          if (lblWpRadialSeconds) lblWpRadialSeconds.textContent = '--s';
          if (lblWpNextStageTimer) lblWpNextStageTimer.textContent = 'Timer pausiert';
        }
      }
    }

    // Round badge
    roundNumberBadge.textContent = state.roundNumber || 1;

    // Arena status banner
    arenaStatusMessage.textContent = state.statusText || '';

    // Undo button
    btnUndoAction.disabled = !state.canUndo;

    // Banned count dot
    const bannedKeys = Object.keys(state.bannedPlayers || {});
    if (bannedKeys.length > 0) {
      bannedCountDot.classList.remove('hidden');
      bannedCountDot.textContent = bannedKeys.length;
    } else {
      bannedCountDot.classList.add('hidden');
    }

    // Cooldown & Evaluation Center Overlay (3.. 2.. 1..)
    if (state.cooldownSeconds && state.cooldownSeconds > 0) {
      cooldownTimerPill.classList.remove('hidden');
      cooldownSecondsText.textContent = state.cooldownSeconds;

      arenaCountdownOverlay.classList.remove('hidden');
      countdownBigNumber.textContent = state.cooldownSeconds;
      playTickSound();
    } else {
      cooldownTimerPill.classList.add('hidden');
      arenaCountdownOverlay.classList.add('hidden');
    }

    // Double-Click Protection: Disable evaluation buttons when evaluating
    const isEvaluating = !!state.isEvaluating;
    btnEvalWrong.disabled = isEvaluating;
    btnEvalSkip.disabled = isEvaluating;
    btnEvalCorrect.disabled = isEvaluating;
    btnEvalPerfect.disabled = isEvaluating;
    btnHitsterWrong.disabled = isEvaluating;
    btnHitsterSkip.disabled = isEvaluating;
    btnHitsterCorrect.disabled = isEvaluating;
    btnHitsterRevealCenter.disabled = isEvaluating;
    btnWpWrong.disabled = isEvaluating;
    btnWpSkip.disabled = isEvaluating;
    btnWpCorrect.disabled = isEvaluating;
    btnWpResolveCenter.disabled = isEvaluating;

    // Action buttons states
    btnToggleLock.disabled = !state.isRoundActive;
    btnEndRound.disabled = !state.isRoundActive;
    lblToggleLock.textContent = state.isLocked ? 'Buzzer freigeben' : 'Buzzer sperren';

    if (state.isLocked) {
      svgLockIcon.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>';
    } else {
      svgLockIcon.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>';
    }

    if (state.isRoundActive) {
      arenaStatusPill.className = state.isLocked ? 'arena-pill' : 'arena-pill active';
      arenaStatusPill.textContent = state.isLocked ? 'Gesperrt' : 'Runde Aktiv';
    } else {
      arenaStatusPill.className = 'arena-pill ready';
      arenaStatusPill.textContent = 'Bereit';
    }

    // Active Player (Buzzer Spotlight)
    if (state.activePlayer) {
      if (!lastActivePlayerId && localAudioPlayer && !localAudioPlayer.paused) {
        localAudioPlayer.pause();
        btnAudioPlayPause.textContent = '▶️';
        wasAudioPausedByBuzzer = true;
      }
      lastActivePlayerId = state.activePlayer.id;

      activeBuzzerCard.classList.remove('hidden');
      buzzerPlaceholder.classList.add('hidden');

      activePlayerAvatar.src = state.activePlayer.avatar || '../../App.png';
      activePlayerName.textContent = state.activePlayer.username || 'Unbekannt';
      activePlayerTime.textContent = state.activePlayer.timeOffset ? `⚡ ${state.activePlayer.timeOffset}` : '⚡ 1. Platz';

      const pScore = state.scores?.[state.activePlayer.id]?.points || 0;
      activePlayerScore.innerHTML = `${pScore} Punkte ${SVG_PENCIL}`;
      activePlayerScore.classList.add('tag-score-interactive');
      activePlayerScore.title = 'Klicke hier, um die Punkte direkt anzupassen!';

      const wrongCount = state.roundWrongAttempts?.[state.activePlayer.id] || 0;
      if (wrongCount >= 1) {
        lblWrongPenalty.textContent = `${config.points?.wrongRepeat || -2} Punkte (Wiederholt)`;
      } else {
        lblWrongPenalty.textContent = `${config.points?.wrongFirst || -1} Punkt`;
      }

      // 15s Buzzer Answer Timer
      if (state.answerTimer) {
        if (answerTimerBox) answerTimerBox.classList.remove('hidden');
        const rem = state.answerTimer.remaining !== undefined ? state.answerTimer.remaining : 15;
        const tot = state.answerTimer.total || 15;
        if (lblAnswerTimerSeconds) lblAnswerTimerSeconds.textContent = `${rem}s`;
        if (answerTimerBarFill) answerTimerBarFill.style.width = `${Math.max(0, Math.min(100, (rem / tot) * 100))}%`;

        if (state.answerTimer.expired) {
          if (answerExpiredAlert) answerExpiredAlert.classList.remove('hidden');
        } else {
          if (answerExpiredAlert) answerExpiredAlert.classList.add('hidden');
        }
      } else {
        if (answerTimerBox) answerTimerBox.classList.add('hidden');
        if (answerExpiredAlert) answerExpiredAlert.classList.add('hidden');
      }
    } else {
      lastActivePlayerId = null;
      activeBuzzerCard.classList.add('hidden');
      buzzerPlaceholder.classList.remove('hidden');
      if (answerTimerBox) answerTimerBox.classList.add('hidden');
      if (answerExpiredAlert) answerExpiredAlert.classList.add('hidden');
    }

    // Buzzer Queue
    const queue = state.queue || [];
    queueCountBadge.textContent = `${queue.length} Spieler`;
    if (queue.length === 0) {
      queueListContainer.innerHTML = '<div class="queue-empty">Keine weiteren Spieler in der Warteschlange</div>';
    } else {
      queueListContainer.innerHTML = queue.map((p, idx) => `
        <div class="queue-item" data-player-id="${p.id}" data-player-name="${escapeHtml(p.username)}">
          <div class="queue-player">
            <span class="queue-pos">#${idx + 2}</span>
            <img src="${p.avatar || '../../App.png'}" class="queue-avatar" alt="Avatar">
            <span class="queue-name">${escapeHtml(p.username)}</span>
          </div>
          <div class="queue-right">
            <span class="queue-time">${p.timeOffset || '+0s'}</span>
            <button class="queue-pick-btn" data-action="pick">Drannehmen</button>
            <button class="btn-queue-ban" data-action="ban" title="Spieler sperren">🚫</button>
          </div>
        </div>
      `).join('');

      queueListContainer.querySelectorAll('.queue-item').forEach((el) => {
        const playerId = el.getAttribute('data-player-id');
        const playerName = el.getAttribute('data-player-name');

        el.querySelector('[data-action="pick"]')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          await window.mannisBoxAPI.selectQueuePlayer(playerId);
        });

        el.querySelector('[data-action="ban"]')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (await showCustomConfirm(`Möchtest du ${playerName} wirklich für das Quiz sperren?`, 'Spieler sperren')) {
            await window.mannisBoxAPI.banPlayer(playerId, playerName);
          }
        });

        el.addEventListener('click', async () => {
          await window.mannisBoxAPI.selectQueuePlayer(playerId);
        });
      });
    }

    // Voice Members List
    const voiceMembers = state.voiceMembers || [];
    voiceMembersCountBadge.textContent = `${voiceMembers.length} im Voice`;
    if (voiceMembers.length === 0) {
      voiceMembersList.innerHTML = '<div class="queue-empty">Keine Mitspieler im Voice-Kanal</div>';
    } else {
      voiceMembersList.innerHTML = voiceMembers.map((m) => `
        <div class="voice-member-chip ${m.isBanned ? 'banned' : ''}" title="${m.isBanned ? 'Gebannter Spieler' : 'Mitspieler im Voice'}">
          <img src="${m.avatar || '../../App.png'}" class="chip-avatar" alt="Avatar">
          <span>${escapeHtml(m.username)}</span>
          ${m.isBanned 
            ? `<button class="btn-chip-ban" data-action="unban" data-id="${m.id}" title="Entbannen">✅</button>`
            : `<button class="btn-chip-ban" data-action="ban" data-id="${m.id}" data-name="${escapeHtml(m.username)}" title="Sperren">🚫</button>`
          }
        </div>
      `).join('');

      voiceMembersList.querySelectorAll('[data-action="ban"]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const name = btn.getAttribute('data-name');
          if (await showCustomConfirm(`Möchtest du ${name} vom Quiz sperren?`, 'Spieler sperren')) {
            await window.mannisBoxAPI.banPlayer(id, name);
          }
        });
      });

      voiceMembersList.querySelectorAll('[data-action="unban"]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          await window.mannisBoxAPI.unbanPlayer(id);
        });
      });
    }

    // Scoreboard with Slide-Down Drawer on Hover
    const scoreEntries = Object.values(state.scores || {}).sort((a, b) => b.points - a.points);
    playerCountBadge.textContent = `${scoreEntries.length} Spieler`;

    if (scoreEntries.length === 0) {
      scoreboardList.innerHTML = `
        <div class="scoreboard-empty">
          <svg class="empty-trophy-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34M18 2H6v7a6 6 0 0 0 12 0V2z"></path>
          </svg>
          <p>Noch keine Punkte vergeben.<br>Starte eine Runde!</p>
        </div>
      `;
    } else {
      scoreboardList.innerHTML = scoreEntries.map((p, idx) => {
        let rankClass = '';
        let medal = `#${idx + 1}`;
        if (idx === 0) { rankClass = 'rank-1'; medal = '🥇'; }
        else if (idx === 1) { rankClass = 'rank-2'; medal = '🥈'; }
        else if (idx === 2) { rankClass = 'rank-3'; medal = '🥉'; }

        return `
          <div class="scoreboard-item ${rankClass}" data-player-id="${p.id}" data-player-name="${escapeHtml(p.username)}">
            <div class="scoreboard-main-row">
              <div class="player-rank-info">
                <span class="rank-badge">${medal}</span>
                <img src="${p.avatar || '../../App.png'}" class="player-avatar-thumb" alt="Avatar">
                <div class="player-names-wrap">
                  <span class="player-uname" title="${escapeHtml(p.username)}">${escapeHtml(p.username)}</span>
                  <span class="player-substats">✅ ${p.correct || 0} | ❌ ${p.wrong || 0}</span>
                </div>
              </div>
              <div class="player-score-pill tag-score-interactive" title="Klicke hier, um Punkte direkt anzupassen">${p.points} Pkt. ${SVG_PENCIL}</div>
            </div>

            <!-- Slide-Down Hover Drawer -->
            <div class="scoreboard-action-drawer">
              <button class="btn-drawer-action btn-drawer-minus" data-action="minus" title="1 Punkt abziehen">-1</button>
              <button class="btn-drawer-action btn-drawer-plus" data-action="plus" title="1 Punkt hinzufügen">+1</button>
              <button class="btn-drawer-action btn-drawer-buzz" data-action="buzz" title="Für diesen Spieler buzzern">🚨 Buzz</button>
              <button class="btn-drawer-action" data-action="rename" title="Namen ändern">${SVG_PENCIL}</button>
              <button class="btn-drawer-action btn-drawer-ban" data-action="ban" title="Spieler sperren">🚫</button>
              <button class="btn-drawer-action btn-drawer-del" data-action="del" title="Spieler entfernen">🗑️</button>
            </div>
          </div>
        `;
      }).join('');

      // Add listeners for drawer buttons and interactive score pills
      scoreboardList.querySelectorAll('.scoreboard-item').forEach((el) => {
        const playerId = el.getAttribute('data-player-id');
        const playerName = el.getAttribute('data-player-name');

        el.querySelector('.player-score-pill')?.addEventListener('click', (e) => {
          e.stopPropagation();
          const p = state.scores?.[playerId];
          const pts = p ? p.points : 0;
          openQuickScorePopup({ id: playerId, name: playerName, points: pts }, e.currentTarget);
        });

        el.querySelector('[data-action="minus"]')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          await window.mannisBoxAPI.adjustPlayerScore(playerId, -1);
        });

        el.querySelector('[data-action="plus"]')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          await window.mannisBoxAPI.adjustPlayerScore(playerId, 1);
        });

        el.querySelector('[data-action="buzz"]')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          await window.mannisBoxAPI.manualBuzzPlayer(playerId);
        });

        el.querySelector('[data-action="rename"]')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          const newName = await showCustomPrompt(`Neuer Name für "${playerName}":`, playerName, 'Spieler umbenennen');
          if (newName && newName.trim() && newName.trim() !== playerName) {
            await window.mannisBoxAPI.renamePlayer(playerId, newName.trim());
          }
        });

        el.querySelector('[data-action="del"]')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (await showCustomConfirm(`Spieler "${playerName}" wirklich entfernen?`, 'Spieler entfernen')) {
            await window.mannisBoxAPI.removePlayer(playerId);
          }
        });

        el.querySelector('[data-action="ban"]')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (await showCustomConfirm(`Möchtest du ${playerName} wirklich für das Quiz sperren?`, 'Spieler sperren')) {
            await window.mannisBoxAPI.banPlayer(playerId, playerName);
          }
        });
      });
    }

    renderBannedListModal(state.bannedPlayers || {});
    updateChannelLabels();

    // Update Manni host score badge in bottom-left status card
    if (lblHostScore) {
      const hostId = config.hostId || '327863089796087809';
      const hostEntry = state.scores?.[hostId] || Object.values(state.scores || {}).find(p => /manni/i.test(p.username) || p.id === hostId);
      const hostPts = hostEntry ? hostEntry.points : 0;
      lblHostScore.innerHTML = `${hostPts} Pkt ${SVG_PENCIL}`;
    }
  }

  function renderBannedListModal(bannedObj) {
    const list = Object.values(bannedObj);
    if (list.length === 0) {
      bannedListContainer.innerHTML = '<div class="queue-empty">Keine Spieler gebannt.</div>';
      return;
    }

    bannedListContainer.innerHTML = list.map((b) => `
      <div class="banned-item">
        <div class="banned-user-info">
          <span>🚫</span>
          <strong>${escapeHtml(b.username)}</strong>
          <small class="help-text">(${b.id})</small>
        </div>
        <button class="btn-unban" data-id="${b.id}">Entbannen</button>
      </div>
    `).join('');

    bannedListContainer.querySelectorAll('.btn-unban').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await window.mannisBoxAPI.unbanPlayer(id);
      });
    });
  }

  function updateChannelLabels() {
    if (!config) return;
    updateHostDisplay();
    const currentGuild = availableGuilds.find(g => g.id === config.guildId);
    lblCurrentGuild.textContent = currentGuild ? currentGuild.name : (config.guildId ? 'Gewählt' : 'Nicht ausgewählt');

    const currentText = availableChannels.text.find(c => c.id === config.textChannelId);
    lblCurrentTextCh.textContent = currentText ? `#${currentText.name}` : (config.textChannelId ? 'Gewählt' : 'Nicht ausgewählt');

    const currentVoice = availableChannels.voice.find(c => c.id === config.voiceChannelId);
    lblCurrentVoiceCh.textContent = currentVoice ? `🔊 ${currentVoice.name}` : (config.voiceChannelId ? 'Gewählt' : 'Nicht ausgewählt');
  }

  // 5. Host Actions
  btnStartRound.addEventListener('click', async () => {
    const res = await window.mannisBoxAPI.startRound({
      guildId: config.guildId || null,
      textChannelId: config.textChannelId || null,
      voiceChannelId: config.voiceChannelId || null
    });
    if (!res.success) {
      await showCustomAlert('Fehler beim Starten der Runde: ' + res.error, 'Runden-Fehler');
    }
  });

  btnToggleLock.addEventListener('click', async () => {
    if (!currentGameState) return;
    const newLockState = !currentGameState.isLocked;
    await window.mannisBoxAPI.lockBuzzer(newLockState);
  });

  btnUndoAction.addEventListener('click', async () => {
    await window.mannisBoxAPI.undoLastAction();
  });

  btnEndRound.addEventListener('click', async () => {
    if (await showCustomConfirm('Möchtest du das gesamte Quiz beenden und das finale Ranking (Platz 1 bis X) im Discord veröffentlichen?', 'Quiz beenden')) {
      await window.mannisBoxAPI.endRound();
    }
  });

  btnToggleVoice.addEventListener('click', async () => {
    if (voiceStatusBadge.classList.contains('voice-connected')) {
      await window.mannisBoxAPI.leaveVoice();
    } else {
      if (!config.guildId || !config.voiceChannelId) {
        await showCustomAlert('Bitte wähle in den Einstellungen einen Server und Voice-Kanal aus!', 'Voice Setup');
        openSettingsModal();
        return;
      }
      const res = await window.mannisBoxAPI.joinVoice(config.guildId, config.voiceChannelId);
      if (!res.success) {
        await showCustomAlert('Fehler beim Verbinden mit dem Voice-Kanal: ' + res.error, 'Voice Fehler');
      }
    }
  });

  btnResetScores.addEventListener('click', async () => {
    if (await showCustomConfirm('Möchtest du alle Punktestände und die Runde komplett auf 0 zurücksetzen?', 'Punktestände zurücksetzen')) {
      await window.mannisBoxAPI.resetScores();
    }
  });

  // Player Management: Spieler manuell anlegen
  btnAddPlayer.addEventListener('click', async () => {
    const name = txtNewPlayerName.value.trim();
    if (name) {
      await window.mannisBoxAPI.addCustomPlayer(name);
      txtNewPlayerName.value = '';
    }
  });

  txtNewPlayerName.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const name = txtNewPlayerName.value.trim();
      if (name) {
        await window.mannisBoxAPI.addCustomPlayer(name);
        txtNewPlayerName.value = '';
      }
    }
  });

  // Ban Active Player
  btnBanActivePlayer.addEventListener('click', async () => {
    if (!currentGameState?.activePlayer) return;
    const player = currentGameState.activePlayer;
    if (await showCustomConfirm(`Möchtest du ${player.username} wirklich für das Quiz sperren?`, 'Spieler sperren')) {
      await window.mannisBoxAPI.banPlayer(player.id, player.username);
    }
  });

  // 6. Evaluation Decision Buttons with Double-Click Protection
  btnEvalWrong.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    playLocalSound('wrong');
    if (localAudioPlayer && localAudioPlayer.src) {
      localAudioPlayer.play().catch(e => console.warn(e));
      btnAudioPlayPause.textContent = '⏸️';
    }
    await window.mannisBoxAPI.evaluatePlayer('wrong');
  });

  btnEvalSkip.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    if (localAudioPlayer && localAudioPlayer.src) {
      localAudioPlayer.play().catch(e => console.warn(e));
      btnAudioPlayPause.textContent = '⏸️';
    }
    await window.mannisBoxAPI.evaluatePlayer('skip');
  });

  btnEvalCorrect.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    playLocalSound('correct');
    // Fall 1: Song resumes playing after correct answer
    if (localAudioPlayer && localAudioPlayer.src) {
      localAudioPlayer.play().catch(e => console.warn(e));
      btnAudioPlayPause.textContent = '⏸️';
    }
    await window.mannisBoxAPI.evaluatePlayer('correct');
  });

  btnEvalPerfect.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    playLocalSound('perfect');
    // Fall 1: Song resumes playing after perfect answer
    if (localAudioPlayer && localAudioPlayer.src) {
      localAudioPlayer.play().catch(e => console.warn(e));
      btnAudioPlayPause.textContent = '⏸️';
    }
    await window.mannisBoxAPI.evaluatePlayer('perfect');
  });

  if (btnResumeRound) {
    btnResumeRound.addEventListener('click', async () => {
      if (localAudioPlayer && localAudioPlayer.src) {
        localAudioPlayer.play().catch(e => console.warn(e));
        btnAudioPlayPause.textContent = '⏸️';
      }
      await window.mannisBoxAPI.resumeRound();
    });
  }

  if (btnAbortRound) {
    btnAbortRound.addEventListener('click', async () => {
      if (await showCustomConfirm('Möchtest du diese Runde vorzeitig abbrechen und auflösen?', 'Runde abbrechen')) {
        if (localAudioPlayer) {
          localAudioPlayer.pause();
          btnAudioPlayPause.textContent = '▶️';
        }
        await window.mannisBoxAPI.abortRound();
      }
    });
  }

  if (btnExpiredRelease) {
    btnExpiredRelease.addEventListener('click', async () => {
      if (localAudioPlayer && localAudioPlayer.src) {
        localAudioPlayer.play().catch(e => console.warn(e));
        btnAudioPlayPause.textContent = '⏸️';
      }
      await window.mannisBoxAPI.resumeRound();
    });
  }

  if (btnExpiredEndRound) {
    btnExpiredEndRound.addEventListener('click', async () => {
      if (localAudioPlayer) {
        localAudioPlayer.pause();
        btnAudioPlayPause.textContent = '▶️';
      }
      await window.mannisBoxAPI.abortRound();
    });
  }

  // 7. Bot Invite Link
  async function openInviteUrl() {
    const url = botInviteUrl || 'https://discord.com/oauth2/authorize?client_id=1530938008532946985&permissions=8&integration_type=0&scope=bot+applications.commands';
    await window.mannisBoxAPI.openExternal(url);
  }

  btnInviteBot.addEventListener('click', openInviteUrl);
  btnInviteFromSettings.addEventListener('click', openInviteUrl);

  // 8. Bans Modal
  btnOpenBans.addEventListener('click', () => {
    bannedModal.classList.remove('hidden');
  });
  btnCloseBans.addEventListener('click', () => {
    bannedModal.classList.add('hidden');
  });
  btnCloseBansFooter.addEventListener('click', () => {
    bannedModal.classList.add('hidden');
  });

  // 9. Settings Modal
  function openSettingsModal() {
    settingsModal.classList.remove('hidden');
    refreshGuildsAndChannels();
  }

  function closeSettingsModal() {
    settingsModal.classList.add('hidden');
  }

  btnOpenSettings.addEventListener('click', openSettingsModal);
  btnCloseSettings.addEventListener('click', closeSettingsModal);
  btnCancelSettings.addEventListener('click', closeSettingsModal);

  btnToggleTokenVisibility.addEventListener('click', () => {
    if (cfgToken.type === 'password') {
      cfgToken.type = 'text';
      svgEyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
      cfgToken.type = 'password';
      svgEyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
  });

  rngVolume.addEventListener('input', (e) => {
    lblVolumeVal.textContent = `${e.target.value}%`;
  });

  testSoundBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const soundType = btn.getAttribute('data-sound');
      btn.classList.add('playing');
      playLocalSound(soundType);
      await window.mannisBoxAPI.playTestSound(soundType);
      setTimeout(() => {
        btn.classList.remove('playing');
      }, 700);
    });
  });

  function populateSettingsForm(cfg) {
    cfgToken.value = cfg.token || '';
    cfgHostId.value = cfg.hostId || '327863089796087809';
    rngVolume.value = Math.round((cfg.soundVolume ?? 0.8) * 100);
    lblVolumeVal.textContent = `${rngVolume.value}%`;
    updateHostDisplay();
  }

  async function refreshGuildsAndChannels() {
    try {
      availableGuilds = await window.mannisBoxAPI.getGuilds();
      if (availableGuilds && availableGuilds.length > 0) {
        botOnline = true;
        botStatusBadge.className = 'status-badge online';
      }

      selGuild.innerHTML = '<option value="">-- Server wählen --</option>';
      availableGuilds.forEach((g) => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        if (g.id === config.guildId) opt.selected = true;
        selGuild.appendChild(opt);
      });

      // Automatically select guild if none set or invalid
      if ((!config.guildId || !availableGuilds.some(g => g.id === config.guildId)) && availableGuilds.length > 0) {
        config.guildId = availableGuilds[0].id;
        selGuild.value = config.guildId;
        await window.mannisBoxAPI.saveConfig(config);
      }

      if (config.guildId) {
        await loadChannelsForGuild(config.guildId);
      }
      updateChannelLabels();
    } catch (err) {
      console.error('Error refreshing guilds:', err);
    }
  }

  async function loadChannelsForGuild(guildId) {
    if (!guildId) {
      selTextChannel.innerHTML = '<option value="">-- Zuerst Server wählen --</option>';
      selVoiceChannel.innerHTML = '<option value="">-- Zuerst Server wählen --</option>';
      return;
    }

    try {
      availableChannels = await window.mannisBoxAPI.getChannels(guildId);

      selTextChannel.innerHTML = '<option value="">-- Textkanal wählen --</option>';
      availableChannels.text.forEach((ch) => {
        const opt = document.createElement('option');
        opt.value = ch.id;
        opt.textContent = `#${ch.name}`;
        if (ch.id === config.textChannelId) opt.selected = true;
        selTextChannel.appendChild(opt);
      });

      // Auto-select text channel if not set
      if (!config.textChannelId && availableChannels.text.length > 0) {
        config.textChannelId = availableChannels.text[0].id;
        selTextChannel.value = config.textChannelId;
        await window.mannisBoxAPI.saveConfig(config);
      }

      selVoiceChannel.innerHTML = '<option value="">-- Voice-Kanal wählen --</option>';
      availableChannels.voice.forEach((ch) => {
        const opt = document.createElement('option');
        opt.value = ch.id;
        opt.textContent = `🔊 ${ch.name}`;
        if (ch.id === config.voiceChannelId) opt.selected = true;
        selVoiceChannel.appendChild(opt);
      });

      // Auto-select voice channel if not set
      if (!config.voiceChannelId && availableChannels.voice.length > 0) {
        config.voiceChannelId = availableChannels.voice[0].id;
        selVoiceChannel.value = config.voiceChannelId;
        await window.mannisBoxAPI.saveConfig(config);
      }

      updateChannelLabels();
    } catch (err) {
      console.error('Error loading channels:', err);
    }
  }

  selGuild.addEventListener('change', async (e) => {
    const selectedGuildId = e.target.value;
    await loadChannelsForGuild(selectedGuildId);
  });

  btnSaveSettings.addEventListener('click', async () => {
    const newConfig = {
      ...config,
      token: cfgToken.value.trim(),
      hostId: cfgHostId.value.trim() || '327863089796087809',
      guildId: selGuild.value,
      textChannelId: selTextChannel.value,
      voiceChannelId: selVoiceChannel.value,
      soundVolume: parseInt(rngVolume.value, 10) / 100
    };

    config = await window.mannisBoxAPI.saveConfig(newConfig);
    updateHostDisplay();
    updateChannelLabels();
    closeSettingsModal();

    await window.mannisBoxAPI.startBot();
  });

  // --- BIG BIG UPDATE EVENT LISTENERS ---

  // 1. Mode Switching with Instant UI Transformation
  async function switchGameMode(mode) {
    if (!currentGameState) {
      currentGameState = {
        gameMode: mode,
        isRoundActive: false,
        isLocked: false,
        scores: {},
        voiceMembers: []
      };
    } else {
      currentGameState.gameMode = mode;
    }

    if (startupGateModal) {
      delete startupGateModal.dataset.manualOpen;
      startupGateModal.classList.add('hidden');
    }

    if (window.ue5StageInstance) {
      window.ue5StageInstance.setGameMode(mode);
    }

    // Instantly update active tabs
    btnModeSong.classList.toggle('active', mode === 'song');
    btnModeHitster.classList.toggle('active', mode === 'hitster');
    btnModeWallpaper.classList.toggle('active', mode === 'wallpaper');

    // Instantly toggle dynamic game boards
    if (arenaBoardSong) arenaBoardSong.classList.toggle('hidden', mode !== 'song');
    if (arenaBoardHitster) arenaBoardHitster.classList.toggle('hidden', mode !== 'hitster');
    if (arenaBoardWallpaper) arenaBoardWallpaper.classList.toggle('hidden', mode !== 'wallpaper');

    // Dynamic Arena Main Header
    if (arenaModeIconBadge && arenaMainTitle) {
      if (mode === 'wallpaper') {
        arenaModeIconBadge.textContent = '🎬';
        arenaMainTitle.textContent = 'Filme & Wallpaper Quiz';
      } else if (mode === 'hitster') {
        arenaModeIconBadge.textContent = '📻';
        arenaMainTitle.textContent = 'Hitster Zeitstrahl';
      } else {
        arenaModeIconBadge.textContent = '🎵';
        arenaMainTitle.textContent = 'Erkennst du den Song';
      }
    }

    // Instantly toggle Regie subpanels
    songRegiePanel.classList.toggle('hidden', mode !== 'song');
    hitsterRegiePanel.classList.toggle('hidden', mode !== 'hitster');
    wallpaperRegiePanel.classList.toggle('hidden', mode !== 'wallpaper');

    // Instantly toggle Arena Game Banners
    if (arenaSongBanner) arenaSongBanner.classList.toggle('hidden', mode !== 'song');
    if (arenaHitsterBanner) arenaHitsterBanner.classList.toggle('hidden', mode !== 'hitster');
    if (arenaHitsterTimelineDeck) arenaHitsterTimelineDeck.classList.toggle('hidden', mode !== 'hitster');
    if (arenaWallpaperBanner) arenaWallpaperBanner.classList.toggle('hidden', mode !== 'wallpaper');

    // Instantly toggle Evaluation Actions
    evalActionsSong.classList.toggle('hidden', mode !== 'song');
    evalActionsHitster.classList.toggle('hidden', mode !== 'hitster');
    evalActionsWallpaper.classList.toggle('hidden', mode !== 'wallpaper');

    renderGameState(currentGameState);

    try {
      await window.mannisBoxAPI.setGameMode(mode);
    } catch (e) {
      console.warn('Mode backend switch error:', e);
    }
  }

  btnModeSong.addEventListener('click', () => switchGameMode('song'));
  btnModeHitster.addEventListener('click', () => switchGameMode('hitster'));
  btnModeWallpaper.addEventListener('click', () => switchGameMode('wallpaper'));

  // 3D Startup Gate Card Selection
  if (cardSelectSong) cardSelectSong.addEventListener('click', () => switchGameMode('song'));
  if (cardSelectHitster) cardSelectHitster.addEventListener('click', () => switchGameMode('hitster'));
  if (cardSelectWallpaper) cardSelectWallpaper.addEventListener('click', () => switchGameMode('wallpaper'));

  if (btnOpenGamePicker) {
    btnOpenGamePicker.addEventListener('click', () => {
      if (startupGateModal) {
        startupGateModal.dataset.manualOpen = 'true';
        startupGateModal.classList.remove('hidden');
      }
    });
  }

  // Toggle 2X Boost Mode (/boost)
  if (btnToggleBoost) {
    btnToggleBoost.addEventListener('click', async () => {
      try {
        const willBeActive = !currentGameState?.isBoostActive;
        if (willBeActive && window.ue5StageInstance) {
          window.ue5StageInstance.triggerBoostSupercharge();
          document.body.classList.add('screen-shake-boost');
          setTimeout(() => document.body.classList.remove('screen-shake-boost'), 650);
          screenFlashLayer.className = 'screen-flash-layer flash-glow-boost';
          setTimeout(() => { screenFlashLayer.className = 'screen-flash-layer'; }, 850);
        }
        await window.mannisBoxAPI.toggleBoost();
      } catch (err) {
        console.error('Failed to toggle boost:', err);
      }
    });
  }

  // Set Target Goal (/goal)
  if (goalBadgeContainer) {
    goalBadgeContainer.addEventListener('click', async () => {
      const cur = currentGameState?.goal || (currentGameState?.gameMode === 'hitster' ? 10 : 50);
      const ans = await showCustomPrompt(`Neues Spielziel eingeben (aktuell: ${cur}):`, cur, 'Spielziel festlegen');
      if (ans !== null && ans.trim() !== '') {
        const val = parseInt(ans.trim(), 10);
        if (!isNaN(val) && val > 0) {
          await window.mannisBoxAPI.setGoal(val);
        }
      }
    });
  }

  // Grand Champion Victory Modal Actions
  if (btnVictoryClose) {
    btnVictoryClose.addEventListener('click', () => {
      if (victoryModal) victoryModal.classList.add('hidden');
    });
  }

  if (btnVictoryNewGame) {
    btnVictoryNewGame.addEventListener('click', async () => {
      if (victoryModal) victoryModal.classList.add('hidden');
      await window.mannisBoxAPI.resetScores();
    });
  }

  // Physical 3D Arcade Dome Buzzer Click
  if (btnPhysicalBuzzer) {
    btnPhysicalBuzzer.addEventListener('click', async () => {
      btnPhysicalBuzzer.classList.add('pressed');
      setTimeout(() => btnPhysicalBuzzer.classList.remove('pressed'), 250);
      playLocalSound('buzzer');
      if (window.ue5StageInstance) window.ue5StageInstance.triggerBuzzerShockwave();
      screenFlashLayer.className = 'screen-flash-layer flash-glow-red';
      setTimeout(() => { screenFlashLayer.className = 'screen-flash-layer'; }, 400);

      const regieName = hostDisplayName || 'Regie (Dome)';
      await window.mannisBoxAPI.manualBuzzPlayer('host-regie-buzzer', regieName);
    });
  }

  // 3D Hitster Flippable Card Click (Quick Year Reveal)
  if (sceneHitsterCard) {
    sceneHitsterCard.addEventListener('click', async () => {
      await window.mannisBoxAPI.resolveHitsterCard();
    });
  }

  // Seamless Drag & Drop for Folders and Media Files
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const filePath = file.path;
      if (!filePath) return;

      if (/\.(jpe?g|png|webp|bmp)$/i.test(filePath)) {
        await switchGameMode('wallpaper');
        const filename = file.name.replace(/\.[^/.]+$/, '');
        const res = await window.mannisBoxAPI.uploadWallpaper(filePath, filename);
        if (res && res.success) {
          await showCustomAlert('Wallpaper erfolgreich per Drag & Drop geladen:\n' + filename, 'Wallpaper geladen');
        }
      } else {
        // Direct audio folder scan
        await switchGameMode('song');
        const res = await window.mannisBoxAPI.scanMusicFolderDirect(filePath);
        if (res && res.success) {
          loadedMusicFiles = res.files || [];
          lblMusicFolderStatus.textContent = `${res.totalFiles} Songs gefunden (${res.folder})`;
          btnPickRandomSong.disabled = false;
          if (selMusicGenre) {
            selMusicGenre.innerHTML = '<option value="">Alle Genres</option>' + 
              (res.genres || []).map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
          }
          await showCustomAlert(`Musik-Ordner erfolgreich geladen: ${res.totalFiles} Songs!`, 'Musik-Ordner');
        }
      }
    }
  });

  // 2. Stream View & OBS Link
  btnToggleStreamView.addEventListener('click', async () => {
    await window.mannisBoxAPI.openStreamWindow();
  });
  btnCloseStreamView.addEventListener('click', () => {
    inAppStreamContainer.classList.add('hidden');
    inAppStreamContainer.style.display = 'none';
  });
  btnCopyObsLink.addEventListener('click', async () => {
    const url = await window.mannisBoxAPI.getStreamUrl();
    await navigator.clipboard.writeText(url);
    await showCustomAlert('OBS Browser-Source Link in Zwischenablage kopiert:\n' + url, 'OBS Browser-Source');
  });

  // 3. Song Quiz Controls
  async function handleMusicFolderSelection() {
    const res = await window.mannisBoxAPI.selectMusicFolder();
    if (res && res.success) {
      loadedMusicFiles = res.files || [];
      const statusText = `${res.totalFiles} Songs gefunden (${res.folder})`;
      if (lblMusicFolderStatus) lblMusicFolderStatus.textContent = statusText;
      if (lblHitsterFolderStatus) lblHitsterFolderStatus.textContent = statusText;
      btnPickRandomSong.disabled = false;
      if (selMusicGenre) {
        selMusicGenre.innerHTML = '<option value="">Alle Genres</option>' + 
          (res.genres || []).map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
      }
    }
  }

  btnSelectMusicFolder.addEventListener('click', handleMusicFolderSelection);
  if (btnSelectHitsterFolder) {
    btnSelectHitsterFolder.addEventListener('click', handleMusicFolderSelection);
  }

  if (btnPlaylistShuffle) {
    btnPlaylistShuffle.addEventListener('click', async () => {
      await window.mannisBoxAPI.setPlaylistMode('shuffle');
      btnPlaylistShuffle.classList.add('active');
      if (btnPlaylistNumbered) btnPlaylistNumbered.classList.remove('active');
    });
  }

  if (btnPlaylistNumbered) {
    btnPlaylistNumbered.addEventListener('click', async () => {
      await window.mannisBoxAPI.setPlaylistMode('numbered');
      btnPlaylistNumbered.classList.add('active');
      if (btnPlaylistShuffle) btnPlaylistShuffle.classList.remove('active');
    });
  }

  if (btnRerollNextSong) {
    btnRerollNextSong.addEventListener('click', async () => {
      const next = await window.mannisBoxAPI.prepareNextSong();
      if (next && lblNextSongTitle) {
        lblNextSongTitle.textContent = next.fullTitle || 'Kein Track vorgemerkt';
      }
    });
  }

  btnPickRandomSong.addEventListener('click', async () => {
    const res = await window.mannisBoxAPI.playNextSong();
    if (res && res.success && res.song) {
      lblAudioTrackTitle.textContent = res.song.fullTitle;
      const streamUrl = `http://localhost:8888/api/audio?path=${encodeURIComponent(res.song.filePath)}`;
      localAudioPlayer.src = streamUrl;
      localAudioPlayer.volume = parseFloat(rngAudioPlayerVolume.value);
      try {
        await localAudioPlayer.play();
        btnAudioPlayPause.textContent = '⏸️';
      } catch (e) {
        console.warn('Auto-play error:', e);
      }
      if (!currentGameState?.isRoundActive) {
        await window.mannisBoxAPI.startRound();
      }
    }
  });

  btnAudioPlayPause.addEventListener('click', () => {
    if (localAudioPlayer.paused) {
      localAudioPlayer.play();
      btnAudioPlayPause.textContent = '⏸️';
    } else {
      localAudioPlayer.pause();
      btnAudioPlayPause.textContent = '▶️';
    }
  });

  rngAudioPlayerVolume.addEventListener('input', () => {
    localAudioPlayer.volume = parseFloat(rngAudioPlayerVolume.value);
  });

  if (localAudioPlayer) {
    localAudioPlayer.addEventListener('play', () => {
      btnAudioPlayPause.textContent = '⏸️';
      if (window.ue5StageInstance) window.ue5StageInstance.setAudioPulse(1.0);
    });
    localAudioPlayer.addEventListener('pause', () => {
      btnAudioPlayPause.textContent = '▶️';
      if (window.ue5StageInstance) window.ue5StageInstance.setAudioPulse(0.0);
    });
    localAudioPlayer.addEventListener('timeupdate', () => {
      if (window.ue5StageInstance && !localAudioPlayer.paused) {
        const pulse = 0.7 + 0.3 * Math.sin(localAudioPlayer.currentTime * 7);
        window.ue5StageInstance.setAudioPulse(pulse);
      }
    });
  }

  // Smart Excel Copy-Paste auto-split
  function handleExcelPaste(e) {
    const text = (e.clipboardData || window.clipboardData)?.getData('text');
    if (!text) return;
    if (text.includes('\t') || text.includes(' - ') || text.includes(';') || text.includes(',')) {
      e.preventDefault();
      let parts = [];
      if (text.includes('\t')) parts = text.split('\t');
      else if (text.includes(' - ')) parts = text.split(' - ');
      else if (text.includes(';')) parts = text.split(';');
      else if (text.includes(',')) parts = text.split(',');

      if (parts.length >= 2) {
        txtExcelArtist.value = parts[0].trim();
        txtExcelTitle.value = parts.slice(1).join(' - ').trim();
      }
    }
  }

  if (txtExcelArtist) txtExcelArtist.addEventListener('paste', handleExcelPaste);
  if (txtExcelTitle) txtExcelTitle.addEventListener('paste', handleExcelPaste);

  btnApplyExcelSong.addEventListener('click', async () => {
    const artist = txtExcelArtist.value.trim();
    const title = txtExcelTitle.value.trim();
    if (!artist && !title) {
      await showCustomAlert('Bitte Titel oder Interpret eingeben!', 'Song fehlt');
      return;
    }
    const res = await window.mannisBoxAPI.setManualSong(artist, title);
    if (res && res.success) {
      lblAudioTrackTitle.textContent = res.song.fullTitle;
      await showCustomAlert(`Song für Runde übernommen:\n${res.song.fullTitle}`, 'Song übernommen');
    }
  });

  // 4. Wallpaper Quiz Controls
  btnSelectWpFolder.addEventListener('click', async () => {
    const res = await window.mannisBoxAPI.selectWallpaperFolder();
    if (res && res.success) {
      loadedWallpaperRounds = res.rounds || [];
      lblWpFolderStatus.textContent = `${res.count} Film-Runden geladen`;
    }
  });

  btnSelectWpImage.addEventListener('click', async () => {
    const filePath = await window.mannisBoxAPI.selectWallpaperFile();
    if (filePath) {
      selectedWpImagePath = filePath;
      btnUploadWp.disabled = false;
      btnSelectWpImage.textContent = '✓ Bild gewählt';
    }
  });

  btnUploadWp.addEventListener('click', async () => {
    if (!selectedWpImagePath) return;
    const title = txtWpMovieTitle.value.trim() || 'Film Aufgelöst';
    const res = await window.mannisBoxAPI.uploadWallpaper(selectedWpImagePath, title);
    if (res && res.success) {
      await showCustomAlert(`Wallpaper für Film "${title}" erfolgreich in die Box geladen!`, 'Wallpaper geladen');
    }
  });

  btnResolveWp.addEventListener('click', async () => {
    await window.mannisBoxAPI.resolveWallpaper();
  });

  // 5. Hitster Controls & Ratings
  btnPickHitsterSong.addEventListener('click', async () => {
    const res = await window.mannisBoxAPI.pickHitsterSong();
    if (res && res.success && res.card) {
      txtHitsterYear.value = res.card.year || '';
      txtHitsterArtist.value = res.card.artist || '';
      txtHitsterTitle.value = res.card.title || '';
      if (res.card.filePath) {
        const streamUrl = `http://localhost:8888/api/audio?path=${encodeURIComponent(res.card.filePath)}`;
        localAudioPlayer.src = streamUrl;
        localAudioPlayer.volume = parseFloat(rngAudioPlayerVolume.value);
        try {
          await localAudioPlayer.play();
          btnAudioPlayPause.textContent = '⏸️';
        } catch (e) {
          console.warn('Auto-play error:', e);
        }
      }
    } else {
      await showCustomAlert(res?.error || 'Bitte wähle zuerst links einen Ordner mit Musik aus.', 'Hitster Musik');
    }
  });

  btnApplyHitsterCard.addEventListener('click', async () => {
    const year = txtHitsterYear.value.trim();
    const artist = txtHitsterArtist.value.trim();
    const title = txtHitsterTitle.value.trim();
    if (!year) {
      await showCustomAlert('Bitte mindestens das Erscheinungsjahr angeben!', 'Hitster Karte');
      return;
    }
    const res = await window.mannisBoxAPI.setManualHitsterCard(year, artist, title);
    if (res && res.success) {
      await showCustomAlert(`Hitster-Karte aktiviert: ${res.card.artist} - ${res.card.title} (Jahr: ${res.card.year})`, 'Hitster Karte');
    }
  });

  btnResolveHitster.addEventListener('click', async () => {
    await window.mannisBoxAPI.resolveHitsterCard();
  });

  btnHitsterCorrect.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    playLocalSound('correct');

    // Add card to active player's shelf
    const card = currentGameState?.hitsterState?.currentCard;
    const targetPlayer = selHitsterActivePlayer?.value || currentGameState?.activePlayer?.username || 'Host';
    if (card && card.year) {
      if (!playerHitsterCards[targetPlayer]) {
        playerHitsterCards[targetPlayer] = [];
      }
      playerHitsterCards[targetPlayer].push({
        year: card.year,
        title: card.title || 'Song',
        artist: card.artist || ''
      });
      // Sort chronologically
      playerHitsterCards[targetPlayer].sort((a, b) => parseInt(a.year, 10) - parseInt(b.year, 10));
      renderHitsterPlayerShelves(currentGameState);
    }

    await window.mannisBoxAPI.evaluatePlayer('correct');
  });

  btnHitsterWrong.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    playLocalSound('wrong');
    await window.mannisBoxAPI.evaluatePlayer('wrong');
  });

  btnHitsterSkip.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    await window.mannisBoxAPI.evaluatePlayer('skip');
  });

  btnHitsterRevealCenter.addEventListener('click', async () => {
    await window.mannisBoxAPI.resolveHitsterCard();
  });

  // Quick 3D Flip Reveal in Hitster Board
  if (btnHitsterQuickReveal) {
    btnHitsterQuickReveal.addEventListener('click', async () => {
      await window.mannisBoxAPI.resolveHitsterCard();
    });
  }

  // 3D Turntable Play & Next Controls
  if (btnHitsterDeckPlay) {
    btnHitsterDeckPlay.addEventListener('click', () => {
      if (localAudioPlayer.paused) {
        localAudioPlayer.play();
        btnHitsterDeckPlay.textContent = '⏸️ Pause';
      } else {
        localAudioPlayer.pause();
        btnHitsterDeckPlay.textContent = '▶️ Play';
      }
    });
  }

  if (btnHitsterDeckNext) {
    btnHitsterDeckNext.addEventListener('click', () => {
      btnPickHitsterSong.click();
    });
  }

  // Master Decades Bar Chip Selection
  if (hitsterDecadesBar) {
    hitsterDecadesBar.querySelectorAll('.decade-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        hitsterDecadesBar.querySelectorAll('.decade-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });
  }

  // 6. Wallpaper Evaluation Buttons
  btnWpCorrect.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    playLocalSound('correct');
    await window.mannisBoxAPI.evaluatePlayer('correct');
  });

  btnWpWrong.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    playLocalSound('wrong');
    await window.mannisBoxAPI.evaluatePlayer('wrong');
  });

  btnWpSkip.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    await window.mannisBoxAPI.evaluatePlayer('skip');
  });

  btnWpResolveCenter.addEventListener('click', async () => {
    await window.mannisBoxAPI.resolveWallpaper();
  });



  // 8. Custom Titlebar Controls (Frameless Window)
  if (titlebarMin) {
    titlebarMin.addEventListener('click', () => {
      window.mannisBoxAPI.minimizeWindow();
    });
  }

  if (titlebarMax) {
    titlebarMax.addEventListener('click', async () => {
      const isMax = await window.mannisBoxAPI.maximizeWindow();
      titlebarIconMax?.classList.toggle('hidden', isMax);
      titlebarIconRestore?.classList.toggle('hidden', !isMax);
    });
  }

  if (titlebarClose) {
    titlebarClose.addEventListener('click', () => {
      window.mannisBoxAPI.closeWindow();
    });
  }

  if (window.mannisBoxAPI.onMaximizeChange) {
    window.mannisBoxAPI.onMaximizeChange((isMax) => {
      titlebarIconMax?.classList.toggle('hidden', isMax);
      titlebarIconRestore?.classList.toggle('hidden', !isMax);
    });
  }

  // 9. 10s Buzzer Answer Countdown Actions
  if (btnExpiredEndRound) {
    btnExpiredEndRound.addEventListener('click', async () => {
      await window.mannisBoxAPI.abortRound();
    });
  }

  if (btnExpiredRelease) {
    btnExpiredRelease.addEventListener('click', async () => {
      await window.mannisBoxAPI.resumeRound();
    });
  }

  // 10. Wallpaper Next Round Button
  if (btnPickNextWallpaper) {
    btnPickNextWallpaper.addEventListener('click', async () => {
      const res = await window.mannisBoxAPI.pickNextWallpaper();
      if (res && res.error) {
        await showCustomAlert(res.error, 'Wallpaper Fehler');
      }
    });
  }

  // 11. Hitster Dispute & Chip Adjustment Handlers
  if (hitsterPlayerShelvesContainer) {
    hitsterPlayerShelvesContainer.addEventListener('click', async (e) => {
      const throwBtn = e.target.closest('.btn-throw-chip');
      if (throwBtn) {
        e.stopPropagation();
        const player = throwBtn.getAttribute('data-player');
        if (player) {
          await window.mannisBoxAPI.challengeHitsterChip(player);
        }
        return;
      }
      const adjustBtn = e.target.closest('.btn-chip-adjust');
      if (adjustBtn) {
        e.stopPropagation();
        const player = adjustBtn.getAttribute('data-player');
        const delta = parseInt(adjustBtn.getAttribute('data-delta'), 10) || 0;
        if (player && delta) {
          await window.mannisBoxAPI.adjustPlayerChips(player, delta);
        }
        return;
      }
    });
  }

  // 12. Live Folder Search & Autocomplete
  function getCleanFileName(filePath) {
    if (!filePath) return '';
    const base = filePath.split(/[\\/]/).pop() || '';
    return base.replace(/\.[^/.]+$/, '');
  }

  // Song Quiz Live Search
  if (txtSearchSong && songSearchResults) {
    txtSearchSong.addEventListener('input', () => {
      const q = txtSearchSong.value.trim().toLowerCase();
      if (!q) {
        songSearchResults.classList.add('hidden');
        songSearchResults.innerHTML = '';
        return;
      }

      if (loadedMusicFiles.length === 0) {
        songSearchResults.innerHTML = '<div style="padding: 8px 10px; font-size: 11px; color: #94a3b8;">⚠️ Noch kein Musik-Ordner geladen. Wähle zuerst einen Ordner!</div>';
        songSearchResults.classList.remove('hidden');
        return;
      }

      const matches = loadedMusicFiles.filter(f => f.toLowerCase().includes(q)).slice(0, 20);
      if (matches.length === 0) {
        songSearchResults.innerHTML = '<div style="padding: 8px 10px; font-size: 11px; color: #94a3b8;">Keine Treffer gefunden.</div>';
        songSearchResults.classList.remove('hidden');
        return;
      }

      songSearchResults.innerHTML = matches.map(filePath => {
        const title = getCleanFileName(filePath);
        return `
          <div class="folder-search-item" data-path="${escapeHtml(filePath)}">
            <span class="folder-search-item-title" title="${escapeHtml(title)}">🎵 ${escapeHtml(title)}</span>
            <span style="font-size: 10px; color: #38bdf8; font-weight: 700; flex-shrink: 0;">Als Nächster ➔</span>
          </div>
        `;
      }).join('');
      songSearchResults.classList.remove('hidden');

      songSearchResults.querySelectorAll('.folder-search-item').forEach(item => {
        item.addEventListener('click', async (e) => {
          e.stopPropagation();
          const chosenPath = item.getAttribute('data-path');
          songSearchResults.classList.add('hidden');
          txtSearchSong.value = '';

          // Stage as Next Song (does not play directly)
          const res = await window.mannisBoxAPI.stageNextSong(chosenPath);
          if (res && res.success && res.nextSong) {
            if (lblNextSongTitle) lblNextSongTitle.textContent = res.nextSong.fullTitle;
            btnPickRandomSong.disabled = false;
          }
        });
      });
    });
  }

  // Hitster Quiz Live Search
  if (txtSearchHitster && hitsterSearchResults) {
    txtSearchHitster.addEventListener('input', () => {
      const q = txtSearchHitster.value.trim().toLowerCase();
      if (!q) {
        hitsterSearchResults.classList.add('hidden');
        hitsterSearchResults.innerHTML = '';
        return;
      }

      if (loadedMusicFiles.length === 0) {
        hitsterSearchResults.innerHTML = '<div style="padding: 8px 10px; font-size: 11px; color: #94a3b8;">⚠️ Noch kein Musik-Ordner geladen. Wähle zuerst einen Ordner!</div>';
        hitsterSearchResults.classList.remove('hidden');
        return;
      }

      const matches = loadedMusicFiles.filter(f => f.toLowerCase().includes(q)).slice(0, 20);
      if (matches.length === 0) {
        hitsterSearchResults.innerHTML = '<div style="padding: 8px 10px; font-size: 11px; color: #94a3b8;">Keine Treffer gefunden.</div>';
        hitsterSearchResults.classList.remove('hidden');
        return;
      }

      hitsterSearchResults.innerHTML = matches.map(filePath => {
        const title = getCleanFileName(filePath);
        return `
          <div class="folder-search-item" data-path="${escapeHtml(filePath)}">
            <span class="folder-search-item-title" title="${escapeHtml(title)}">📻 ${escapeHtml(title)}</span>
            <span style="font-size: 10px; color: #f59e0b; font-weight: 700; flex-shrink: 0;">Karte ➔</span>
          </div>
        `;
      }).join('');
      hitsterSearchResults.classList.remove('hidden');

      hitsterSearchResults.querySelectorAll('.folder-search-item').forEach(item => {
        item.addEventListener('click', async (e) => {
          e.stopPropagation();
          const chosenPath = item.getAttribute('data-path');
          hitsterSearchResults.classList.add('hidden');
          txtSearchHitster.value = '';

          const res = await window.mannisBoxAPI.selectSpecificHitster(chosenPath);
          if (res && res.success && res.card) {
            txtHitsterYear.value = res.card.year || '';
            txtHitsterArtist.value = res.card.artist || '';
            txtHitsterTitle.value = res.card.title || '';
            if (res.card.filePath) {
              const streamUrl = `http://localhost:8888/api/audio?path=${encodeURIComponent(res.card.filePath)}`;
              localAudioPlayer.src = streamUrl;
              localAudioPlayer.volume = parseFloat(rngAudioPlayerVolume.value);
              try {
                await localAudioPlayer.play();
                btnAudioPlayPause.textContent = '⏸️';
              } catch (err) {
                console.warn('Auto-play error:', err);
              }
            }
          }
        });
      });
    });
  }

  // Wallpaper Quiz Live Search
  if (txtSearchWallpaper && wpSearchResults) {
    txtSearchWallpaper.addEventListener('input', () => {
      const q = txtSearchWallpaper.value.trim().toLowerCase();
      if (!q) {
        wpSearchResults.classList.add('hidden');
        wpSearchResults.innerHTML = '';
        return;
      }

      if (loadedWallpaperRounds.length === 0) {
        wpSearchResults.innerHTML = '<div style="padding: 8px 10px; font-size: 11px; color: #94a3b8;">⚠️ Noch kein Wallpaper-Ordner geladen. Wähle zuerst einen Ordner!</div>';
        wpSearchResults.classList.remove('hidden');
        return;
      }

      const matches = loadedWallpaperRounds.filter(r => r.movieTitle && r.movieTitle.toLowerCase().includes(q)).slice(0, 20);
      if (matches.length === 0) {
        wpSearchResults.innerHTML = '<div style="padding: 8px 10px; font-size: 11px; color: #94a3b8;">Keine Treffer gefunden.</div>';
        wpSearchResults.classList.remove('hidden');
        return;
      }

      wpSearchResults.innerHTML = matches.map(r => {
        return `
          <div class="folder-search-item" data-title="${escapeHtml(r.movieTitle)}">
            <span class="folder-search-item-title" title="${escapeHtml(r.movieTitle)}">🎬 ${escapeHtml(r.movieTitle)}</span>
            <span style="font-size: 10px; color: #fbbf24; font-weight: 700; flex-shrink: 0;">Laden ➔</span>
          </div>
        `;
      }).join('');
      wpSearchResults.classList.remove('hidden');

      wpSearchResults.querySelectorAll('.folder-search-item').forEach(item => {
        item.addEventListener('click', async (e) => {
          e.stopPropagation();
          const chosenTitle = item.getAttribute('data-title');
          wpSearchResults.classList.add('hidden');
          txtSearchWallpaper.value = '';

          await window.mannisBoxAPI.selectSpecificWallpaper(chosenTitle);
        });
      });
    });
  }

  // 13. Interactive Animated Score Editor ("Links unten auf die Punkte" & Scoreboard)
  let editingScoreStage = null;

  function openQuickScorePopup(target, targetElement, isStage = false) {
    if (!quickScoreEditorPopup || !target) return;
    if (isStage) {
      editingScorePlayer = null;
      editingScoreStage = target;
      if (quickScorePlayerName) quickScorePlayerName.textContent = `Schärfe-Stufe ${target.stage} (${target.label})`;
      if (txtQuickScoreValue) {
        txtQuickScoreValue.value = target.points !== undefined ? target.points : 4;
      }
    } else {
      editingScoreStage = null;
      editingScorePlayer = target;
      if (quickScorePlayerName) quickScorePlayerName.textContent = target.name || 'Unbekannt';
      if (txtQuickScoreValue) {
        txtQuickScoreValue.value = target.points !== undefined ? target.points : 0;
      }
    }

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      let left = Math.max(12, Math.min(window.innerWidth - 250, rect.left));
      let top = rect.top - 150;
      if (top < 10) {
        top = rect.bottom + 10;
      }
      quickScoreEditorPopup.style.left = `${left}px`;
      quickScoreEditorPopup.style.top = `${top}px`;
    }

    quickScoreEditorPopup.classList.remove('hidden');
    if (txtQuickScoreValue) {
      txtQuickScoreValue.focus();
      txtQuickScoreValue.select();
    }
  }

  function closeQuickScorePopup() {
    if (quickScoreEditorPopup) {
      quickScoreEditorPopup.classList.add('hidden');
      editingScorePlayer = null;
      editingScoreStage = null;
    }
  }

  if (btnQuickScoreClose) {
    btnQuickScoreClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeQuickScorePopup();
    });
  }

  document.querySelectorAll('.btn-score-quick').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const delta = parseInt(btn.getAttribute('data-delta'), 10) || 0;
      const cur = parseInt(txtQuickScoreValue.value, 10) || 0;
      txtQuickScoreValue.value = Math.max(0, cur + delta);
    });
  });

  if (btnQuickScoreSave) {
    btnQuickScoreSave.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (editingScorePlayer) {
        const val = Math.max(0, parseInt(txtQuickScoreValue.value, 10) || 0);
        await window.mannisBoxAPI.setPlayerScore(editingScorePlayer.id, val);
      } else if (editingScoreStage) {
        const val = Math.max(0, parseInt(txtQuickScoreValue.value, 10) || 0);
        customWallpaperStagePoints[editingScoreStage.stage] = val;
        const el = document.getElementById(`lblWpStage${editingScoreStage.stage}Pts`);
        if (el) el.textContent = `${val} Pkt`;
        await window.mannisBoxAPI.setWallpaperStagePoints(customWallpaperStagePoints);
      }
      closeQuickScorePopup();
    });
  }

  if (txtQuickScoreValue) {
    txtQuickScoreValue.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        btnQuickScoreSave?.click();
      } else if (e.key === 'Escape') {
        closeQuickScorePopup();
      }
    });
  }

  // Interactive Stage Cards in Wallpaper Quiz ("Unten links bei Schärfestufen")
  document.querySelectorAll('.wp-stage-card.tag-score-interactive').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const stage = parseInt(card.getAttribute('data-stage'), 10) || 1;
      const label = card.getAttribute('data-label') || '';
      const curPts = customWallpaperStagePoints[stage] ?? (5 - stage);
      openQuickScorePopup({ stage, label, points: curPts }, card, true);
    });
  });

  if (lblHostScore) {
    lblHostScore.addEventListener('click', (e) => {
      e.stopPropagation();
      const hostId = config.hostId || '327863089796087809';
      const hostEntry = currentGameState?.scores?.[hostId] || Object.values(currentGameState?.scores || {}).find(p => /manni/i.test(p.username) || p.id === hostId);
      const hostPts = hostEntry ? hostEntry.points : 0;
      openQuickScorePopup({ id: hostId, name: `${hostDisplayName || 'Manni'} (Host)`, points: hostPts }, lblHostScore);
    });
  }

  if (activePlayerScore) {
    activePlayerScore.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!currentGameState?.activePlayer) return;
      const ap = currentGameState.activePlayer;
      const pScore = currentGameState.scores?.[ap.id]?.points || 0;
      openQuickScorePopup({ id: ap.id, name: ap.username, points: pScore }, activePlayerScore);
    });
  }

  // Global click outside to dismiss popups and search dropdowns
  document.addEventListener('click', (e) => {
    if (quickScoreEditorPopup && !quickScoreEditorPopup.classList.contains('hidden')) {
      if (!quickScoreEditorPopup.contains(e.target) && !e.target.closest('.tag-score-interactive')) {
        closeQuickScorePopup();
      }
    }
    if (songSearchResults && !songSearchResults.classList.contains('hidden')) {
      if (!songSearchResults.contains(e.target) && e.target !== txtSearchSong) {
        songSearchResults.classList.add('hidden');
      }
    }
    if (hitsterSearchResults && !hitsterSearchResults.classList.contains('hidden')) {
      if (!hitsterSearchResults.contains(e.target) && e.target !== txtSearchHitster) {
        hitsterSearchResults.classList.add('hidden');
      }
    }
    if (wpSearchResults && !wpSearchResults.classList.contains('hidden')) {
      if (!wpSearchResults.contains(e.target) && e.target !== txtSearchWallpaper) {
        wpSearchResults.classList.add('hidden');
      }
    }
  });

  // Helper
  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function (m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[m];
    });
  }
});
