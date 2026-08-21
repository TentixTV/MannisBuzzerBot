const {
  Client,
  GatewayIntentBits,
  ChannelType,
  ActivityType,
  PermissionsBitField
} = require('discord.js');
const {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const audioManager = require('./audioManager');
const {
  createBuzzerEmbed,
  createBuzzerComponents,
  createFinalGameEndEmbed
} = require('./embeds');
const { loadConfig, saveConfig } = require('../config/configManager');
const EventEmitter = require('events');

class BotManager extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.config = loadConfig();
    this.isReady = false;
    this.currentVoiceConnection = null;
    this.cooldownTimer = null;
    this.hostName = '';

    // Game state
    this.gameState = {
      roundNumber: 1,
      isRoundActive: false,
      isLocked: false,
      isEvaluating: false,
      activePlayer: null,
      queue: [],
      scores: {}, // playerId -> { id, username, avatar, points, correct, wrong }
      roundWrongAttempts: {}, // playerId -> count
      roundFirstBuzzTime: null,
      statusText: 'Warte auf den Start der nächsten Runde...',
      currentMessage: null,
      currentTextChannelId: null,
      currentVoiceChannelId: null,
      currentGuildId: null,
      cooldownSeconds: 0,
      bannedPlayers: {}, // playerId -> { id, username, timestamp }
      voiceMembers: [], // List of { id, username, avatar, isBanned }
      hostName: '',
      actionHistory: []
    };
  }

  updateConfig(newConf) {
    this.config = saveConfig(newConf);
    if (this.config.soundVolume !== undefined) {
      audioManager.setVolume(this.config.soundVolume);
    }
    this.resolveHostName();
    this.emitState();
  }

  async resolveHostName() {
    if (!this.client || !this.isReady || !this.config.hostId) return;
    try {
      const user = await this.client.users.fetch(this.config.hostId);
      if (user) {
        this.hostName = user.displayName || user.username;
        this.gameState.hostName = this.hostName;
      }
    } catch (err) {
      this.hostName = 'Manni';
      this.gameState.hostName = 'Manni';
    }
    this.emitState();
  }

  async updateRichPresence() {
    if (!this.client || !this.isReady || !this.client.user) return;
    try {
      const playersInVoice = this.gameState.voiceMembers.length;
      const round = this.gameState.roundNumber;
      
      this.client.user.setPresence({
        activities: [{
          name: `SongQuiz 🎵 | Runde ${round}`,
          type: ActivityType.Playing,
          state: `👥 ${playersInVoice} Mitspieler`
        }],
        status: 'online'
      });
    } catch (err) {
      console.error('[Bot] Error setting rich presence:', err);
    }
  }

  async updateVoiceMembers() {
    if (!this.client || !this.isReady || !this.gameState.currentGuildId || !this.gameState.currentVoiceChannelId) {
      this.gameState.voiceMembers = [];
      this.emitState();
      return;
    }

    try {
      const guild = await this.client.guilds.fetch(this.gameState.currentGuildId);
      if (!guild) return;

      const voiceChannel = await guild.channels.fetch(this.gameState.currentVoiceChannelId);
      if (!voiceChannel || !voiceChannel.members) return;

      const membersList = [];
      for (const [id, member] of voiceChannel.members) {
        // Exclude bot itself and Host from regular players list
        if (member.user.bot || id === this.client.user.id || id === this.config.hostId) continue;
        
        membersList.push({
          id: member.id,
          username: member.displayName || member.user.username,
          avatar: member.user.displayAvatarURL({ size: 64 }),
          isBanned: !!this.gameState.bannedPlayers[member.id]
        });
      }

      this.gameState.voiceMembers = membersList;
      this.updateRichPresence();
      this.emitState();
    } catch (err) {
      console.error('[Bot] Error updating voice members:', err);
    }
  }

  async start() {
    if (this.client) {
      await this.stop();
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
      ]
    });

    this.client.on('ready', async () => {
      this.isReady = true;
      console.log(`[Bot] Logged in as ${this.client.user.tag}`);
      await this.resolveHostName();
      this.updateRichPresence();

      this.emit('status-changed', {
        online: true,
        user: {
          id: this.client.user.id,
          tag: this.client.user.tag,
          username: this.client.user.username,
          avatar: this.client.user.displayAvatarURL()
        },
        hostName: this.hostName,
        inviteUrl: this.getInviteUrl()
      });
      this.emitState();
    });

    this.client.on('voiceStateUpdate', async () => {
      await this.updateVoiceMembers();
    });

    this.client.on('interactionCreate', async (interaction) => {
      try {
        if (interaction.isButton() && interaction.customId === 'mannisbox_buzzer') {
          await this.handleBuzzerInteraction(interaction);
        }
      } catch (err) {
        console.error('[Bot] Interaction Error:', err);
      }
    });

    this.client.on('error', (err) => {
      console.error('[Bot] Client Error:', err);
      this.emit('error', err.message);
    });

    try {
      await this.client.login(this.config.token);
      return { success: true };
    } catch (err) {
      console.error('[Bot] Login failed:', err);
      this.isReady = false;
      this.emit('status-changed', { online: false, error: err.message });
      return { success: false, error: err.message };
    }
  }

  async stop() {
    this.leaveVoice();
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
    if (this.client) {
      try {
        this.client.destroy();
      } catch (err) {
        console.error('[Bot] Error destroying client:', err);
      }
      this.client = null;
    }
    this.isReady = false;
    this.emit('status-changed', { online: false });
  }

  getInviteUrl() {
    const clientId = (this.client && this.client.user) ? this.client.user.id : '1530938008532946985';
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=bot+applications.commands`;
  }

  async getGuilds() {
    if (!this.client || !this.isReady) return [];
    try {
      const guilds = await this.client.guilds.fetch();
      const list = [];
      for (const [id, oauthGuild] of guilds) {
        const fullGuild = await oauthGuild.fetch();
        list.push({
          id: fullGuild.id,
          name: fullGuild.name,
          icon: fullGuild.iconURL()
        });
      }
      return list;
    } catch (err) {
      console.error('[Bot] Error fetching guilds:', err);
      return [];
    }
  }

  async getChannels(guildId) {
    if (!this.client || !this.isReady) return { text: [], voice: [] };
    try {
      const guild = await this.client.guilds.fetch(guildId);
      if (!guild) return { text: [], voice: [] };

      const channels = await guild.channels.fetch();
      const textChannels = [];
      const voiceChannels = [];

      for (const [id, ch] of channels) {
        if (!ch) continue;
        if (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildAnnouncement) {
          textChannels.push({ id: ch.id, name: ch.name });
        } else if (ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildStageVoice) {
          voiceChannels.push({ id: ch.id, name: ch.name });
        }
      }

      textChannels.sort((a, b) => a.name.localeCompare(b.name));
      voiceChannels.sort((a, b) => a.name.localeCompare(b.name));

      return { text: textChannels, voice: voiceChannels };
    } catch (err) {
      console.error(`[Bot] Error fetching channels for guild ${guildId}:`, err);
      return { text: [], voice: [] };
    }
  }

  async joinVoice(guildId, channelId) {
    if (!this.client || !this.isReady) return { success: false, error: 'Bot is not ready' };
    try {
      const guild = await this.client.guilds.fetch(guildId);
      if (!guild) return { success: false, error: 'Guild not found' };

      const connection = joinVoiceChannel({
        channelId: channelId,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: false
      });

      this.currentVoiceConnection = connection;
      audioManager.setConnection(connection);
      this.gameState.currentGuildId = guildId;
      this.gameState.currentVoiceChannelId = channelId;

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          this.leaveVoice();
        }
      });

      await this.updateVoiceMembers();
      this.emit('voice-status', { connected: true, guildId, channelId });
      return { success: true };
    } catch (err) {
      console.error('[Bot] Join voice error:', err);
      return { success: false, error: err.message };
    }
  }

  leaveVoice() {
    if (this.currentVoiceConnection) {
      try {
        this.currentVoiceConnection.destroy();
      } catch (err) {
        console.error('[Bot] Error leaving voice:', err);
      }
      this.currentVoiceConnection = null;
      audioManager.setConnection(null);
      this.gameState.currentVoiceChannelId = null;
      this.gameState.voiceMembers = [];
      this.emit('voice-status', { connected: false });
    }
  }

  // --- PLAYER BANNING & UNBANNING ---
  banPlayer(playerId, username) {
    this.gameState.bannedPlayers[playerId] = {
      id: playerId,
      username: username || this.gameState.scores[playerId]?.username || 'Unbekannt',
      timestamp: Date.now()
    };

    // Remove from active player if currently active
    if (this.gameState.activePlayer && this.gameState.activePlayer.id === playerId) {
      if (this.gameState.queue.length > 0) {
        this.gameState.activePlayer = this.gameState.queue.shift();
      } else {
        this.gameState.activePlayer = null;
        this.gameState.isLocked = false;
      }
    }

    // Remove from queue
    this.gameState.queue = this.gameState.queue.filter((p) => p.id !== playerId);

    this.gameState.statusText = `⛔ **${this.gameState.bannedPlayers[playerId].username}** wurde für das Quiz gebannt!`;
    this.updateVoiceMembers();
    this.updateDiscordMessage();
    this.emitState();
    return { success: true };
  }

  unbanPlayer(playerId) {
    if (this.gameState.bannedPlayers[playerId]) {
      const name = this.gameState.bannedPlayers[playerId].username;
      delete this.gameState.bannedPlayers[playerId];
      this.gameState.statusText = `✅ **${name}** wurde entbannt.`;
      this.updateVoiceMembers();
      this.emitState();
      return { success: true };
    }
    return { success: false, error: 'Spieler nicht gebannt' };
  }

  // --- SCORE ADJUSTMENT ON HOVER ---
  adjustPlayerScore(playerId, delta) {
    if (!this.gameState.scores[playerId]) {
      // Create player entry if from voice list
      const voiceUser = this.gameState.voiceMembers.find(m => m.id === playerId);
      if (voiceUser) {
        this.gameState.scores[playerId] = {
          id: playerId,
          username: voiceUser.username,
          avatar: voiceUser.avatar,
          points: 0,
          correct: 0,
          wrong: 0
        };
      } else {
        return { success: false, error: 'Spieler nicht gefunden' };
      }
    }

    this.gameState.scores[playerId].points += delta;
    this.gameState.actionHistory.push({
      type: 'manual_adjust',
      roundNumber: this.gameState.roundNumber,
      playerId,
      scoreDelta: delta,
      wrongDelta: 0,
      correctDelta: 0,
      prevStatus: this.gameState.statusText
    });

    this.gameState.statusText = `✏️ Punkte für **${this.gameState.scores[playerId].username}** angepasst (${delta >= 0 ? '+' : ''}${delta} Pkt.)!`;
    this.updateDiscordMessage();
    this.emitState();
    return { success: true, newPoints: this.gameState.scores[playerId].points };
  }

  // --- UNDO LAST ACTION / ROUND ROLLBACK ---
  undoLastAction() {
    if (this.gameState.actionHistory.length === 0) {
      return { success: false, error: 'Keine vorherige Aktion zum Rückgängigmachen vorhanden.' };
    }

    const lastAction = this.gameState.actionHistory.pop();
    const { playerId, scoreDelta, wrongDelta, correctDelta, prevStatus } = lastAction;

    if (this.gameState.scores[playerId]) {
      this.gameState.scores[playerId].points -= scoreDelta;
      this.gameState.scores[playerId].wrong = Math.max(0, (this.gameState.scores[playerId].wrong || 0) - wrongDelta);
      this.gameState.scores[playerId].correct = Math.max(0, (this.gameState.scores[playerId].correct || 0) - correctDelta);
    }

    if (wrongDelta > 0 && this.gameState.roundWrongAttempts[playerId]) {
      this.gameState.roundWrongAttempts[playerId] = Math.max(0, this.gameState.roundWrongAttempts[playerId] - 1);
    }

    this.gameState.statusText = `↩️ Letzte Punktevergabe rückgängig gemacht (${scoreDelta >= 0 ? '-' : '+'}${Math.abs(scoreDelta)} Pkt.)!`;
    this.updateDiscordMessage();
    this.emitState();
    return { success: true };
  }

  async handleBuzzerInteraction(interaction) {
    const userId = interaction.user.id;
    const username = interaction.member?.displayName || interaction.user.displayName || interaction.user.username;
    const avatar = interaction.user.displayAvatarURL({ size: 128 });

    // Ban check
    if (this.gameState.bannedPlayers[userId]) {
      return interaction.reply({
        content: '⛔ Du wurdest vom Spielleiter für dieses Quiz gesperrt!',
        ephemeral: true
      });
    }

    // Host check
    if (userId === this.config.hostId) {
      return interaction.reply({
        content: `👑 Du bist als Host eingetragen und kannst nicht selbst mitbuzzern!`,
        ephemeral: true
      });
    }

    // Check if buzzer is locked or round inactive or in evaluation cooldown
    if (!this.gameState.isRoundActive || this.gameState.isLocked || this.gameState.isEvaluating) {
      return interaction.reply({
        content: '🔒 Der Buzzer ist derzeit gesperrt!',
        ephemeral: true
      });
    }

    // Check if already in queue or active
    const alreadyInQueue =
      (this.gameState.activePlayer && this.gameState.activePlayer.id === userId) ||
      this.gameState.queue.some((p) => p.id === userId);

    if (alreadyInQueue) {
      return interaction.reply({
        content: '⚠️ Du bist bereits im Buzzer-Ablauf!',
        ephemeral: true
      });
    }

    // Ensure player score entry exists
    if (!this.gameState.scores[userId]) {
      this.gameState.scores[userId] = {
        id: userId,
        username,
        avatar,
        points: 0,
        correct: 0,
        wrong: 0
      };
    } else {
      this.gameState.scores[userId].username = username;
      this.gameState.scores[userId].avatar = avatar;
    }

    // Timing calculation
    const now = Date.now();
    let timeOffset = '1. Platz (0.00s)';
    if (!this.gameState.roundFirstBuzzTime) {
      this.gameState.roundFirstBuzzTime = now;
    } else {
      const diffMs = now - this.gameState.roundFirstBuzzTime;
      timeOffset = `+${(diffMs / 1000).toFixed(2)}s`;
    }

    const player = {
      id: userId,
      username,
      avatar,
      timeOffset,
      timestamp: now
    };

    if (!this.gameState.activePlayer) {
      this.gameState.activePlayer = player;
      this.gameState.statusText = `🔔 **${username}** hat zuerst gebuzzert und antwortet jetzt!`;
      audioManager.playBuzzer();
      await interaction.reply({
        content: `🎉 **Buzzer ausgelöst!** Du bist als 1. dran! Antworte jetzt im Voice-Chat!`,
        ephemeral: true
      });
    } else {
      this.gameState.queue.push(player);
      const pos = this.gameState.queue.length + 1;
      await interaction.reply({
        content: `⏱️ Gebuzzert! Du bist auf **Platz #${pos}** in der Warteschlange (${timeOffset}).`,
        ephemeral: true
      });
    }

    this.updateDiscordMessage();
    this.emitState();
  }

  async startRound({ textChannelId, voiceChannelId, guildId }) {
    if (!this.client || !this.isReady) {
      return { success: false, error: 'Discord-Bot ist nicht verbunden.' };
    }

    const targetGuildId = guildId || this.config.guildId;
    const targetTextChannelId = textChannelId || this.config.textChannelId;
    const targetVoiceChannelId = voiceChannelId || this.config.voiceChannelId;

    if (!targetTextChannelId) {
      return { success: false, error: 'Kein Text-Channel für den Buzzer ausgewählt!' };
    }

    // Auto connect voice if not connected
    if (targetGuildId && targetVoiceChannelId && (!this.currentVoiceConnection || this.gameState.currentVoiceChannelId !== targetVoiceChannelId)) {
      await this.joinVoice(targetGuildId, targetVoiceChannelId);
    }

    try {
      const channel = await this.client.channels.fetch(targetTextChannelId);
      if (!channel) {
        return { success: false, error: 'Textkanal konnte nicht gefunden werden.' };
      }

      this.gameState.isRoundActive = true;
      this.gameState.isLocked = false;
      this.gameState.isEvaluating = false;
      this.gameState.activePlayer = null;
      this.gameState.queue = [];
      this.gameState.roundWrongAttempts = {};
      this.gameState.roundFirstBuzzTime = null;
      this.gameState.statusText = 'Drücke den Buzzer, wenn du die Antwort kennst!';
      this.gameState.currentTextChannelId = targetTextChannelId;
      this.gameState.currentGuildId = targetGuildId;
      this.gameState.cooldownSeconds = 0;

      await this.resolveHostName();
      await this.updateVoiceMembers();

      const embed = createBuzzerEmbed({
        roundNumber: this.gameState.roundNumber,
        hostId: this.config.hostId,
        hostName: this.hostName,
        isLocked: false,
        activePlayer: null,
        queue: [],
        scores: this.gameState.scores,
        statusText: this.gameState.statusText,
        channelPlayerCount: this.gameState.voiceMembers.length
      });

      const components = createBuzzerComponents(false, false);
      const msg = await channel.send({ embeds: [embed], components });
      this.gameState.currentMessage = msg;

      this.updateRichPresence();
      this.emitState();
      return { success: true, messageId: msg.id };
    } catch (err) {
      console.error('[Bot] Start round error:', err);
      return { success: false, error: err.message };
    }
  }

  async setBuzzerLocked(locked) {
    this.gameState.isLocked = locked;
    this.gameState.statusText = locked ? 'Buzzer wurde vorübergehend gesperrt.' : 'Buzzer ist freigegeben!';
    await this.updateDiscordMessage();
    this.emitState();
    return { success: true };
  }

  async selectQueuePlayer(playerId) {
    const idx = this.gameState.queue.findIndex((p) => p.id === playerId);
    if (idx === -1) return { success: false, error: 'Spieler nicht in der Queue gefunden.' };

    const selectedPlayer = this.gameState.queue.splice(idx, 1)[0];
    if (this.gameState.activePlayer) {
      this.gameState.queue.unshift(this.gameState.activePlayer);
    }
    this.gameState.activePlayer = selectedPlayer;
    this.gameState.statusText = `👉 **${selectedPlayer.username}** wurde ausgewählt und ist jetzt am Zug!`;
    
    await this.updateDiscordMessage();
    this.emitState();
    return { success: true };
  }

  start3SecondCooldown(nextActionCallback) {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }

    this.gameState.cooldownSeconds = 3;
    this.gameState.isEvaluating = true;
    this.gameState.isLocked = true;
    this.emitState();

    this.cooldownTimer = setInterval(async () => {
      this.gameState.cooldownSeconds -= 1;
      if (this.gameState.cooldownSeconds <= 0) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
        this.gameState.isEvaluating = false;
        if (nextActionCallback) {
          await nextActionCallback();
        }
      }
      this.emitState();
    }, 1000);
  }

  async evaluateActivePlayer(action) {
    // Prevent double clicking while evaluating
    if (this.gameState.isEvaluating) {
      return { success: false, error: 'Bereits in der Auswertung.' };
    }

    if (!this.gameState.activePlayer) {
      return { success: false, error: 'Kein aktiver Spieler vorhanden.' };
    }

    const player = this.gameState.activePlayer;
    const userId = player.id;
    const playerScore = this.gameState.scores[userId] || {
      id: userId,
      username: player.username,
      avatar: player.avatar,
      points: 0,
      correct: 0,
      wrong: 0
    };

    if (action === 'wrong') {
      const attempts = this.gameState.roundWrongAttempts[userId] || 0;
      const penalty = attempts >= 1 ? (this.config.points.wrongRepeat || -2) : (this.config.points.wrongFirst || -1);

      this.gameState.roundWrongAttempts[userId] = attempts + 1;
      playerScore.points += penalty;
      playerScore.wrong = (playerScore.wrong || 0) + 1;
      this.gameState.scores[userId] = playerScore;

      this.gameState.actionHistory.push({
        type: 'wrong',
        roundNumber: this.gameState.roundNumber,
        playerId: userId,
        scoreDelta: penalty,
        wrongDelta: 1,
        correctDelta: 0,
        prevStatus: this.gameState.statusText
      });

      audioManager.playWrong();

      this.gameState.statusText = `❌ **${player.username}** lag falsch (${penalty} Pkt.)! Zug beendet.`;
      await this.updateDiscordMessage();
      this.emitState();

      // 3-second animated countdown
      this.start3SecondCooldown(async () => {
        if (this.gameState.queue.length > 0) {
          // Next player in queue slides up
          const nextPlayer = this.gameState.queue.shift();
          this.gameState.activePlayer = nextPlayer;
          this.gameState.statusText = `➔ **${nextPlayer.username}** ist jetzt an der Reihe!`;
          this.gameState.isLocked = false;
        } else {
          this.gameState.activePlayer = null;
          this.gameState.statusText = `Buzzer ist wieder frei für alle!`;
          this.gameState.isLocked = false;
        }
        await this.updateDiscordMessage();
        this.emitState();
      });

    } else if (action === 'correct') {
      const gain = this.config.points.correct || 3;
      playerScore.points += gain;
      playerScore.correct = (playerScore.correct || 0) + 1;
      this.gameState.scores[userId] = playerScore;

      this.gameState.actionHistory.push({
        type: 'correct',
        roundNumber: this.gameState.roundNumber,
        playerId: userId,
        scoreDelta: gain,
        wrongDelta: 0,
        correctDelta: 1,
        prevStatus: this.gameState.statusText
      });

      audioManager.playCorrect();

      this.gameState.statusText = `✅ **${player.username}** hat richtig geantwortet (+${gain} Pkt.)! 🎉`;
      await this.updateDiscordMessage();
      this.emitState();

      // Reset queue on correct answer and start 3s countdown
      this.start3SecondCooldown(async () => {
        this.gameState.queue = []; // Clear queue on correct
        this.gameState.activePlayer = null;
        this.gameState.statusText = `✅ Frage gelöst von **${player.username}**! Starte nächste Runde für den nächsten Song.`;
        this.gameState.isLocked = false;
        await this.updateDiscordMessage();
        this.emitState();
      });

    } else if (action === 'perfect') {
      const gain = this.config.points.perfect || 4;
      playerScore.points += gain;
      playerScore.correct = (playerScore.correct || 0) + 1;
      this.gameState.scores[userId] = playerScore;

      this.gameState.actionHistory.push({
        type: 'perfect',
        roundNumber: this.gameState.roundNumber,
        playerId: userId,
        scoreDelta: gain,
        wrongDelta: 0,
        correctDelta: 1,
        prevStatus: this.gameState.statusText
      });

      audioManager.playPerfect();

      this.gameState.statusText = `🌟 **${player.username}** hat VOLLSTÄNDIG RICHTIG mit Songname geantwortet (+${gain} Pkt.)! 🏆`;
      await this.updateDiscordMessage();
      this.emitState();

      // Reset queue on perfect answer
      this.start3SecondCooldown(async () => {
        this.gameState.queue = []; // Clear queue
        this.gameState.activePlayer = null;
        this.gameState.statusText = `🌟 Perfekter Treffer von **${player.username}**! Starte nächste Runde für den nächsten Song.`;
        this.gameState.isLocked = false;
        await this.updateDiscordMessage();
        this.emitState();
      });

    } else if (action === 'skip') {
      if (this.gameState.queue.length > 0) {
        const nextPlayer = this.gameState.queue.shift();
        this.gameState.activePlayer = nextPlayer;
        this.gameState.statusText = `⏭️ **${player.username}** übersprungen. ➔ **${nextPlayer.username}** ist jetzt an der Reihe!`;
      } else {
        this.gameState.activePlayer = null;
        this.gameState.statusText = `⏭️ **${player.username}** übersprungen. Buzzer ist wieder frei!`;
      }
      await this.updateDiscordMessage();
      this.emitState();
    }

    return { success: true };
  }

  async endRound() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }

    this.gameState.isRoundActive = false;
    this.gameState.isLocked = true;
    this.gameState.isEvaluating = false;
    this.gameState.cooldownSeconds = 0;

    if (this.gameState.currentMessage) {
      try {
        const endEmbed = createFinalGameEndEmbed({
          roundNumber: this.gameState.roundNumber,
          scores: this.gameState.scores,
          hostId: this.config.hostId,
          hostName: this.hostName,
          totalRounds: this.gameState.roundNumber
        });
        const components = createBuzzerComponents(true, true);
        await this.gameState.currentMessage.edit({ embeds: [endEmbed], components });
      } catch (err) {
        console.error('[Bot] Error editing end round message:', err);
      }
    }

    this.gameState.roundNumber += 1;
    this.gameState.activePlayer = null;
    this.gameState.queue = [];
    this.gameState.statusText = `Quiz-Runde offiziell beendet! Endstand in Discord gesendet.`;

    this.updateRichPresence();
    this.emitState();
    return { success: true, nextRound: this.gameState.roundNumber };
  }

  resetScores() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
    this.gameState.scores = {};
    this.gameState.roundWrongAttempts = {};
    this.gameState.roundNumber = 1;
    this.gameState.activePlayer = null;
    this.gameState.queue = [];
    this.gameState.cooldownSeconds = 0;
    this.gameState.isEvaluating = false;
    this.gameState.actionHistory = [];
    this.gameState.statusText = 'Punktestand wurde auf 0 zurückgesetzt!';
    this.updateDiscordMessage();
    this.updateRichPresence();
    this.emitState();
    return { success: true };
  }

  async updateDiscordMessage() {
    if (!this.gameState.currentMessage) return;
    try {
      const embed = createBuzzerEmbed({
        roundNumber: this.gameState.roundNumber,
        hostId: this.config.hostId,
        hostName: this.hostName,
        isLocked: this.gameState.isLocked,
        activePlayer: this.gameState.activePlayer,
        queue: this.gameState.queue,
        scores: this.gameState.scores,
        statusText: this.gameState.statusText,
        channelPlayerCount: this.gameState.voiceMembers.length
      });
      const components = createBuzzerComponents(this.gameState.isLocked, !this.gameState.isRoundActive);
      await this.gameState.currentMessage.edit({ embeds: [embed], components });
    } catch (err) {
      // Message may have expired
    }
  }

  emitState() {
    const payload = {
      roundNumber: this.gameState.roundNumber,
      isRoundActive: this.gameState.isRoundActive,
      isLocked: this.gameState.isLocked,
      isEvaluating: this.gameState.isEvaluating,
      activePlayer: this.gameState.activePlayer,
      queue: this.gameState.queue,
      scores: this.gameState.scores,
      statusText: this.gameState.statusText,
      voiceConnected: !!this.currentVoiceConnection,
      currentGuildId: this.gameState.currentGuildId,
      currentVoiceChannelId: this.gameState.currentVoiceChannelId,
      currentTextChannelId: this.gameState.currentTextChannelId,
      cooldownSeconds: this.gameState.cooldownSeconds,
      bannedPlayers: this.gameState.bannedPlayers,
      voiceMembers: this.gameState.voiceMembers,
      hostName: this.hostName,
      canUndo: this.gameState.actionHistory.length > 0,
      config: this.config
    };
    this.emit('game-state', payload);
  }

  getState() {
    return {
      roundNumber: this.gameState.roundNumber,
      isRoundActive: this.gameState.isRoundActive,
      isLocked: this.gameState.isLocked,
      isEvaluating: this.gameState.isEvaluating,
      activePlayer: this.gameState.activePlayer,
      queue: this.gameState.queue,
      scores: this.gameState.scores,
      statusText: this.gameState.statusText,
      voiceConnected: !!this.currentVoiceConnection,
      currentGuildId: this.gameState.currentGuildId,
      currentVoiceChannelId: this.gameState.currentVoiceChannelId,
      currentTextChannelId: this.gameState.currentTextChannelId,
      cooldownSeconds: this.gameState.cooldownSeconds,
      bannedPlayers: this.gameState.bannedPlayers,
      voiceMembers: this.gameState.voiceMembers,
      hostName: this.hostName,
      canUndo: this.gameState.actionHistory.length > 0,
      config: this.config
    };
  }

  playTestSound(type) {
    return audioManager.playSound(type);
  }
}

module.exports = new BotManager();
