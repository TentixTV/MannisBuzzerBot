// ==========================================================================
// MANNISBOX — CLIENT APPLICATION LOGIC (v1.1.0 - DELUXE ARENA & VOICE TRACK)
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const botStatusBadge = document.getElementById('botStatusBadge');
  const voiceStatusBadge = document.getElementById('voiceStatusBadge');
  const voiceStatusText = document.getElementById('voiceStatusText');
  const roundNumberBadge = document.getElementById('roundNumberBadge');

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
    botOnline = status.online;
    if (status.online) {
      botStatusBadge.className = 'status-badge online';
      botStatusBadge.querySelector('.status-text').textContent = 'Bot Online (' + (status.user?.tag || 'Connected') + ')';
      if (status.inviteUrl) botInviteUrl = status.inviteUrl;
      if (status.hostName) hostDisplayName = status.hostName;
      updateHostDisplay();
      await refreshGuildsAndChannels();
    } else {
      botStatusBadge.className = 'status-badge offline';
      botStatusBadge.querySelector('.status-text').textContent = status.error ? 'Fehler beim Starten' : 'Bot Offline';
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

  window.mannisBoxAPI.onError((err) => {
    alert('Discord Bot Fehler: ' + err);
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

  // 4. Render Game State
  function renderGameState(state) {
    if (!state) return;

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
      activeBuzzerCard.classList.remove('hidden');
      buzzerPlaceholder.classList.add('hidden');

      activePlayerAvatar.src = state.activePlayer.avatar || '../../App.png';
      activePlayerName.textContent = state.activePlayer.username || 'Unbekannt';
      activePlayerTime.textContent = state.activePlayer.timeOffset ? `⚡ ${state.activePlayer.timeOffset}` : '⚡ 1. Platz';

      const pScore = state.scores?.[state.activePlayer.id]?.points || 0;
      activePlayerScore.textContent = `${pScore} Punkte`;

      const wrongCount = state.roundWrongAttempts?.[state.activePlayer.id] || 0;
      if (wrongCount >= 1) {
        lblWrongPenalty.textContent = `${config.points?.wrongRepeat || -2} Punkte (Wiederholt)`;
      } else {
        lblWrongPenalty.textContent = `${config.points?.wrongFirst || -1} Punkt`;
      }
    } else {
      activeBuzzerCard.classList.add('hidden');
      buzzerPlaceholder.classList.remove('hidden');
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
          if (confirm(`Möchtest du ${playerName} wirklich für das Quiz sperren?`)) {
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
          if (confirm(`Möchtest du ${name} vom Quiz sperren?`)) {
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
              <div class="player-score-pill">${p.points} Pkt.</div>
            </div>

            <!-- Slide-Down Hover Drawer -->
            <div class="scoreboard-action-drawer">
              <button class="btn-drawer-action btn-drawer-minus" data-action="minus" title="1 Punkt abziehen">-1 Punkt</button>
              <button class="btn-drawer-action btn-drawer-plus" data-action="plus" title="1 Punkt hinzufügen">+1 Punkt</button>
              <button class="btn-drawer-action btn-drawer-ban" data-action="ban" title="Spieler sperren">🚫 Sperren</button>
            </div>
          </div>
        `;
      }).join('');

      // Add listeners for drawer buttons
      scoreboardList.querySelectorAll('.scoreboard-item').forEach((el) => {
        const playerId = el.getAttribute('data-player-id');
        const playerName = el.getAttribute('data-player-name');

        el.querySelector('[data-action="minus"]')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          await window.mannisBoxAPI.adjustPlayerScore(playerId, -1);
        });

        el.querySelector('[data-action="plus"]')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          await window.mannisBoxAPI.adjustPlayerScore(playerId, 1);
        });

        el.querySelector('[data-action="ban"]')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`Möchtest du ${playerName} wirklich für das Quiz sperren?`)) {
            await window.mannisBoxAPI.banPlayer(playerId, playerName);
          }
        });
      });
    }

    renderBannedListModal(state.bannedPlayers || {});
    updateChannelLabels();
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
    if (!config.textChannelId) {
      alert('Bitte wähle zuerst in den Einstellungen (⚙️) einen Textkanal für den Buzzer aus!');
      openSettingsModal();
      return;
    }
    const res = await window.mannisBoxAPI.startRound({
      guildId: config.guildId,
      textChannelId: config.textChannelId,
      voiceChannelId: config.voiceChannelId
    });
    if (!res.success) {
      alert('Fehler beim Starten der Runde: ' + res.error);
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
    if (confirm('Möchtest du das gesamte Quiz beenden und das finale Ranking (Platz 1 bis X) im Discord veröffentlichen?')) {
      await window.mannisBoxAPI.endRound();
    }
  });

  btnToggleVoice.addEventListener('click', async () => {
    if (voiceStatusBadge.classList.contains('voice-connected')) {
      await window.mannisBoxAPI.leaveVoice();
    } else {
      if (!config.guildId || !config.voiceChannelId) {
        alert('Bitte wähle in den Einstellungen (⚙️) einen Server und Voice-Kanal aus!');
        openSettingsModal();
        return;
      }
      const res = await window.mannisBoxAPI.joinVoice(config.guildId, config.voiceChannelId);
      if (!res.success) {
        alert('Fehler beim Verbinden mit dem Voice-Kanal: ' + res.error);
      }
    }
  });

  btnResetScores.addEventListener('click', async () => {
    if (confirm('Möchtest du alle Punktestände und die Runde komplett auf 0 zurücksetzen?')) {
      await window.mannisBoxAPI.resetScores();
    }
  });

  // Ban Active Player
  btnBanActivePlayer.addEventListener('click', async () => {
    if (!currentGameState?.activePlayer) return;
    const player = currentGameState.activePlayer;
    if (confirm(`Möchtest du ${player.username} wirklich für das Quiz sperren?`)) {
      await window.mannisBoxAPI.banPlayer(player.id, player.username);
    }
  });

  // 6. Evaluation Decision Buttons with Double-Click Protection
  btnEvalWrong.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    playLocalSound('wrong');
    await window.mannisBoxAPI.evaluatePlayer('wrong');
  });

  btnEvalSkip.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    await window.mannisBoxAPI.evaluatePlayer('skip');
  });

  btnEvalCorrect.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    playLocalSound('correct');
    await window.mannisBoxAPI.evaluatePlayer('correct');
  });

  btnEvalPerfect.addEventListener('click', async () => {
    if (currentGameState?.isEvaluating) return;
    playLocalSound('perfect');
    await window.mannisBoxAPI.evaluatePlayer('perfect');
  });

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
    if (!botOnline) return;
    try {
      availableGuilds = await window.mannisBoxAPI.getGuilds();
      selGuild.innerHTML = '<option value="">-- Server wählen --</option>';
      availableGuilds.forEach((g) => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        if (g.id === config.guildId) opt.selected = true;
        selGuild.appendChild(opt);
      });

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

    availableChannels = await window.mannisBoxAPI.getChannels(guildId);

    selTextChannel.innerHTML = '<option value="">-- Textkanal wählen --</option>';
    availableChannels.text.forEach((ch) => {
      const opt = document.createElement('option');
      opt.value = ch.id;
      opt.textContent = `#${ch.name}`;
      if (ch.id === config.textChannelId) opt.selected = true;
      selTextChannel.appendChild(opt);
    });

    selVoiceChannel.innerHTML = '<option value="">-- Voice-Kanal wählen --</option>';
    availableChannels.voice.forEach((ch) => {
      const opt = document.createElement('option');
      opt.value = ch.id;
      opt.textContent = `🔊 ${ch.name}`;
      if (ch.id === config.voiceChannelId) opt.selected = true;
      selVoiceChannel.appendChild(opt);
    });

    updateChannelLabels();
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
