const {
  Client,
  GatewayIntentBits,
  ChannelType,
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
  createRoundEndedEmbed
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

    // Game state
    this.gameState = {
      roundNumber: 1,
      isRoundActive: false,
      isLocked: false,
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
      cooldownSeconds: 0
    };
  }

  updateConfig(newConf) {
    this.config = saveConfig(newConf);
    if (this.config.soundVolume !== undefined) {
      audioManager.setVolume(this.config.soundVolume);
    }
    this.emitState();
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

    this.client.on('ready', () => {
      this.isReady = true;
      console.log(`[Bot] Logged in as ${this.client.user.tag}`);
      this.emit('status-changed', {
        online: true,
        user: {
          id: this.client.user.id,
          tag: this.client.user.tag,
          username: this.client.user.username,
          avatar: this.client.user.displayAvatarURL()
        },
        inviteUrl: this.getInviteUrl()
      });
      this.emitState();
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
      this.emit('voice-status', { connected: false });
    }
  }

  async handleBuzzerInteraction(interaction) {
    const userId = interaction.user.id;
    const username = interaction.member?.displayName || interaction.user.displayName || interaction.user.username;
    const avatar = interaction.user.displayAvatarURL({ size: 128 });

    // Host check
    if (userId === this.config.hostId) {
      return interaction.reply({
        content: `👑 Du bist als Host eingetragen und kannst nicht selbst mitbuzzern!`,
        ephemeral: true
      });
    }

    // Check if buzzer is locked or round inactive
    if (!this.gameState.isRoundActive || this.gameState.isLocked) {
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
      // Play epic buzzer sound in voice!
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
      this.gameState.activePlayer = null;
      this.gameState.queue = [];
      this.gameState.roundWrongAttempts = {};
      this.gameState.roundFirstBuzzTime = null;
      this.gameState.statusText = 'Drücke den Buzzer, wenn du die Antwort kennst!';
      this.gameState.currentTextChannelId = targetTextChannelId;
      this.gameState.currentGuildId = targetGuildId;
      this.gameState.cooldownSeconds = 0;

      const embed = createBuzzerEmbed({
        roundNumber: this.gameState.roundNumber,
        hostId: this.config.hostId,
        hostTag: 'Manni',
        isLocked: false,
        activePlayer: null,
        queue: [],
        scores: this.gameState.scores,
        statusText: this.gameState.statusText
      });

      const components = createBuzzerComponents(false, false);
      const msg = await channel.send({ embeds: [embed], components });
      this.gameState.currentMessage = msg;

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

  // Allow host to select any player in the queue directly
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
    this.gameState.isLocked = true;
    this.emitState();

    this.cooldownTimer = setInterval(async () => {
      this.gameState.cooldownSeconds -= 1;
      if (this.gameState.cooldownSeconds <= 0) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
        if (nextActionCallback) {
          await nextActionCallback();
        }
      }
      this.emitState();
    }, 1000);
  }

  async evaluateActivePlayer(action) {
    // action: 'wrong' | 'correct' | 'perfect' | 'skip'
    if (!this.gameState.activePlayer) {
      return { success: false, error: 'Kein aktiver Spieler zum Bewerten vorhanden.' };
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

      // Play epic wrong sound in voice!
      audioManager.playWrong();

      this.gameState.statusText = `❌ **${player.username}** lag falsch (${penalty} Pkt.)! Zug beendet.`;
      await this.updateDiscordMessage();
      this.emitState();

      // 3-second cooldown before next player or reopening buzzer!
      this.start3SecondCooldown(async () => {
        if (this.gameState.queue.length > 0) {
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

      // Play epic correct sound
      audioManager.playCorrect();

      this.gameState.statusText = `✅ **${player.username}** hat richtig geantwortet (+${gain} Pkt.)! 🎉`;
      await this.updateDiscordMessage();
      this.emitState();

      // 3-second cooldown after correct answer
      this.start3SecondCooldown(async () => {
        this.gameState.statusText = `✅ Runde gewonnen von **${player.username}**! Starte die nächste Runde oder beende das Spiel.`;
        this.gameState.isLocked = false;
        await this.updateDiscordMessage();
        this.emitState();
      });

    } else if (action === 'perfect') {
      const gain = this.config.points.perfect || 4;
      playerScore.points += gain;
      playerScore.correct = (playerScore.correct || 0) + 1;
      this.gameState.scores[userId] = playerScore;

      // Play epic fanfare sound
      audioManager.playPerfect();

      this.gameState.statusText = `🌟 **${player.username}** hat VOLLSTÄNDIG RICHTIG mit Songname geantwortet (+${gain} Pkt.)! 🏆`;
      await this.updateDiscordMessage();
      this.emitState();

      // 3-second cooldown
      this.start3SecondCooldown(async () => {
        this.gameState.statusText = `🌟 Perfekter Treffer von **${player.username}**! Bereit für nächste Runde.`;
        this.gameState.isLocked = false;
        await this.updateDiscordMessage();
        this.emitState();
      });

    } else if (action === 'skip') {
      // Immediate skip without 3-second penalty wait
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
    this.gameState.cooldownSeconds = 0;

    if (this.gameState.currentMessage) {
      try {
        const winner = this.gameState.activePlayer;
        const endEmbed = createRoundEndedEmbed({
          roundNumber: this.gameState.roundNumber,
          scores: this.gameState.scores,
          winner
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
    this.gameState.statusText = `Runde beendet! Bereit für Runde ${this.gameState.roundNumber}.`;

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
    this.gameState.statusText = 'Punktestand wurde auf 0 zurückgesetzt!';
    this.updateDiscordMessage();
    this.emitState();
    return { success: true };
  }

  async updateDiscordMessage() {
    if (!this.gameState.currentMessage) return;
    try {
      const embed = createBuzzerEmbed({
        roundNumber: this.gameState.roundNumber,
        hostId: this.config.hostId,
        hostTag: 'Manni',
        isLocked: this.gameState.isLocked,
        activePlayer: this.gameState.activePlayer,
        queue: this.gameState.queue,
        scores: this.gameState.scores,
        statusText: this.gameState.statusText
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
      activePlayer: this.gameState.activePlayer,
      queue: this.gameState.queue,
      scores: this.gameState.scores,
      statusText: this.gameState.statusText,
      voiceConnected: !!this.currentVoiceConnection,
      currentGuildId: this.gameState.currentGuildId,
      currentVoiceChannelId: this.gameState.currentVoiceChannelId,
      currentTextChannelId: this.gameState.currentTextChannelId,
      cooldownSeconds: this.gameState.cooldownSeconds,
      config: this.config
    };
    this.emit('game-state', payload);
  }

  getState() {
    return {
      roundNumber: this.gameState.roundNumber,
      isRoundActive: this.gameState.isRoundActive,
      isLocked: this.gameState.isLocked,
      activePlayer: this.gameState.activePlayer,
      queue: this.gameState.queue,
      scores: this.gameState.scores,
      statusText: this.gameState.statusText,
      voiceConnected: !!this.currentVoiceConnection,
      currentGuildId: this.gameState.currentGuildId,
      currentVoiceChannelId: this.gameState.currentVoiceChannelId,
      currentTextChannelId: this.gameState.currentTextChannelId,
      cooldownSeconds: this.gameState.cooldownSeconds,
      config: this.config
    };
  }

  playTestSound(type) {
    return audioManager.playSound(type);
  }
}

module.exports = new BotManager();
