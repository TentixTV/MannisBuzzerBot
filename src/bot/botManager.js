const fs = require('fs');
const path = require('path');
const os = require('os');
let nativeImage = null;
try {
  const electron = require('electron');
  nativeImage = electron.nativeImage;
} catch (e) {}
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  ActivityType,
  PermissionsBitField,
  AttachmentBuilder
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
  createBuzzNotificationEmbed,
  createFinalGameEndEmbed,
  createVictoryEmbed,
  createHelpEmbed
} = require('./embeds');
const {
  cleanMetadata,
  censorText,
  calculateWallpaperPoints,
  getWallpaperStage,
  scanAudioFolder,
  extractAudioTags,
  scanWallpaperFolder
} = require('./gameModes');
const { loadConfig, saveConfig } = require('../config/configManager');
const EventEmitter = require('events');

class BotManager extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.config = loadConfig();
    this.isReady = false;
    this.currentVoiceConnection = null;
    this.voiceJoinPromise = null;
    this.voiceReconnectTimeout = null;
    this.isVoiceIntentionallyLeft = false;
    this.voiceWatchdogInterval = null;
    this.modeGoals = {
      song: 50,
      wallpaper: 50,
      hitster: 10
    };
    this.cooldownTimer = null;
    this.roundTicker = null;
    this.hostName = '';

    // Music & Wallpaper storage
    this.availableMusicFiles = [];
    this.currentMusicFolder = '';
    this.playlistMode = 'shuffle'; // 'shuffle' | 'numbered'
    this.currentSongIndex = -1;
    this.manuallyStagedNextSong = false;
    this.availableWallpaperRounds = [];
    this.currentWallpaperRound = null;
    this.answerCountdownInterval = null;

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
      roundLockedPlayers: {}, // playerId -> true (locked for current round after wrong answer)
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
      actionHistory: [],

      // Big Big Update States:
      gameMode: null, // null (standby on startup), 'song', 'hitster', 'wallpaper'
      screenFlash: null, // 'green' | 'red' | null
      roundTimer: {
        active: false,
        paused: false,
        elapsed: 0,
        remaining: 30,
        duration: 30
      },
      answerTimer: null, // { total: 15, remaining: 15, expired: false, activePlayerId: null }
      playlistMode: 'shuffle',
      nextSong: null, // { filePath, title, artist, fullTitle, censoredTitle }
      songState: {
        title: '',
        artist: '',
        fullTitle: '',
        censoredTitle: '',
        revealed: false,
        filePath: ''
      },
      wallpaperState: {
        currentImage: '',
        stage: 1,
        points: 4,
        movieTitle: '',
        sharpImage: '',
        resolved: false,
        stages: {}
      },
      wallpaperStagePoints: { 1: 4, 2: 3, 3: 2, 4: 1 },
      wallpaperStageTimes: { 1: 10, 2: 10, 3: 10, 4: 10 },
      hitsterState: {
        currentCard: {
          title: '',
          artist: '',
          year: '',
          revealed: false,
          filePath: ''
        },
        timeline: [],
        playerShelves: {}
      },
      goal: 50,
      isBoostActive: false,
      boostPlayerId: null,
      winner: null
    };
  }

  updateConfig(newConf) {
    const oldVoiceId = this.config.voiceChannelId;
    const oldGuildId = this.config.guildId;
    this.config = saveConfig(newConf);
    if (this.config.soundVolume !== undefined) {
      audioManager.setVolume(this.config.soundVolume);
    }
    this.resolveHostName();
    this.emitState();

    if (this.isReady && this.config.guildId && this.config.voiceChannelId) {
      if (this.config.voiceChannelId !== oldVoiceId || this.config.guildId !== oldGuildId) {
        this.isVoiceIntentionallyLeft = false;
        this.joinVoice(this.config.guildId, this.config.voiceChannelId).catch(() => {});
      }
    }
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

  isHost(userOrMemberOrId) {
    if (!userOrMemberOrId) return false;
    const uid = typeof userOrMemberOrId === 'string'
      ? userOrMemberOrId
      : (userOrMemberOrId.id || userOrMemberOrId.user?.id);
    const configuredHostId = this.config.hostId || '327863089796087809';

    if (uid && (uid === configuredHostId || uid === '327863089796087809')) {
      return true;
    }

    if (uid && typeof uid === 'string' && uid.startsWith('host-')) {
      return true;
    }

    const username = typeof userOrMemberOrId === 'object'
      ? (userOrMemberOrId.displayName || userOrMemberOrId.user?.displayName || userOrMemberOrId.username || userOrMemberOrId.user?.username || '')
      : String(userOrMemberOrId);

    const cleanName = username.trim().toLowerCase();
    if (cleanName === 'thismanniguy' || cleanName === 'manni' || (this.hostName && cleanName === this.hostName.trim().toLowerCase())) {
      return true;
    }

    return false;
  }

  async sendBuzzAnnouncement({ userId, username, avatar, timeOffset, potentialPoints, isBoostActive, gameMode }) {
    const targetTextChannelId = this.gameState.currentTextChannelId || this.config.textChannelId;
    if (!this.client || !this.isReady || !targetTextChannelId) return;

    try {
      const channel = await this.client.channels.fetch(targetTextChannelId).catch(() => null);
      if (!channel || !channel.isTextBased()) return;

      const buzzEmbed = createBuzzNotificationEmbed({
        username,
        userId,
        avatar,
        timeOffset,
        potentialPoints,
        isBoostActive,
        gameMode
      });

      const mention = userId ? `<@${userId}>` : `**${username}**`;
      const boostText = isBoostActive ? ' 🔥 *(2X BOOST AKTIV!)*' : '';
      await channel.send({
        content: `🚨 ${mention} hat als **Erster gebuzzert!**${boostText}`,
        embeds: [buzzEmbed]
      });
    } catch (err) {
      console.warn('[Bot] Failed to send buzz announcement to text channel:', err.message);
    }
  }

  startStandbyPresence() {
    if (this.standbyInterval) {
      clearInterval(this.standbyInterval);
      this.standbyInterval = null;
    }
    this.standbyDots = 1;

    const tick = () => {
      if (!this.client || !this.isReady || !this.client.user) return;
      if (this.gameState.gameMode && this.gameState.gameMode !== 'standby') {
        clearInterval(this.standbyInterval);
        this.standbyInterval = null;
        return;
      }

      const dots = '.'.repeat(this.standbyDots);
      this.standbyDots = (this.standbyDots % 3) + 1;

      try {
        this.client.user.setPresence({
          activities: [{
            name: `Wählt das Spiel aus${dots}`,
            type: ActivityType.Watching,
            state: `🎮 Standby — Wählt das Spiel aus${dots}`
          }],
          status: 'idle'
        });
      } catch (err) {
        console.error('[Bot] Standby presence error:', err);
      }
    };

    tick();
    this.standbyInterval = setInterval(tick, 1500);
  }

  setGameMode(mode) {
    if (!mode || mode === 'standby') {
      this.gameState.gameMode = null;
      this.gameState.isLocked = true;
      this.gameState.activePlayer = null;
      this.gameState.queue = [];
      this.stopRoundTimer();
      this.startStandbyPresence();
      this.updateDiscordMessage();
      this.emitState();
      return { success: true, mode: 'standby' };
    }

    if (this.standbyInterval) {
      clearInterval(this.standbyInterval);
      this.standbyInterval = null;
    }

    this.gameState.gameMode = mode;
    if (!this.modeGoals) {
      this.modeGoals = { song: 50, wallpaper: 50, hitster: 10 };
    }
    if (this.modeGoals[mode]) {
      this.gameState.goal = this.modeGoals[mode];
    } else {
      this.gameState.goal = (mode === 'hitster' ? 10 : 50);
    }
    this.gameState.isLocked = false;
    this.gameState.activePlayer = null;
    this.gameState.queue = [];
    this.gameState.winner = null;
    this.stopRoundTimer();
    this.updateRichPresence();
    this.updateDiscordMessage();
    this.emitState();

    // Ensure bot stays connected to voice when game starts
    this.isVoiceIntentionallyLeft = false;
    if (this.isReady && this.config.guildId && this.config.voiceChannelId) {
      const existing = getVoiceConnection(this.config.guildId) || this.currentVoiceConnection;
      if (!existing || existing.state.status !== VoiceConnectionStatus.Ready) {
        this.joinVoice(this.config.guildId, this.config.voiceChannelId).catch(() => {});
      }
    }

    return { success: true, mode };
  }

  toggleBoost(forcedState) {
    const next = (forcedState !== undefined) ? !!forcedState : !this.gameState.isBoostActive;
    this.gameState.isBoostActive = next;
    if (next) {
      this.gameState.statusText = '🔥 **BOOST-RUNDE AKTIVIERT!** Die Punkte der nächsten richtigen Antwort zählen DOPPELT (2x)!';
      audioManager.playSound('buzzer');
      this.gameState.screenFlash = 'green';
      setTimeout(() => { if (this.gameState.screenFlash === 'green') this.gameState.screenFlash = null; this.emitState(); }, 1000);
    } else {
      this.gameState.statusText = '❄️ Boost-Runde beendet.';
    }
    this.updateDiscordMessage();
    this.emitState();
    return { success: true, isBoostActive: this.gameState.isBoostActive };
  }

  setGoal(target) {
    const num = Math.max(1, parseInt(target, 10) || 50);
    const mode = this.gameState.gameMode || 'song';
    if (!this.modeGoals) {
      this.modeGoals = { song: 50, wallpaper: 50, hitster: 10 };
    }
    this.modeGoals[mode] = num;
    this.gameState.goal = num;
    this.gameState.statusText = `🎯 Spielziel wurde auf ${num} ${this.gameState.gameMode === 'hitster' ? 'Karten' : 'Punkte'} gesetzt!`;

    // Bug 3: Immediate victory check for all players
    if (this.gameState.scores && !this.gameState.winner) {
      const isHitster = this.gameState.gameMode === 'hitster';
      const sorted = Object.values(this.gameState.scores).sort((a, b) => {
        if (isHitster) {
          const aCards = (a.cards && Array.isArray(a.cards)) ? a.cards.length : (typeof a.cards === 'number' ? a.cards : (a.points || 0));
          const bCards = (b.cards && Array.isArray(b.cards)) ? b.cards.length : (typeof b.cards === 'number' ? b.cards : (b.points || 0));
          return bCards - aCards;
        }
        return (b.points || 0) - (a.points || 0);
      });
      for (const player of sorted) {
        if (this.checkVictory(player)) {
          break;
        }
      }
    }

    this.updateDiscordMessage();
    this.emitState();
    return { success: true, goal: num };
  }

  checkVictory(player) {
    if (!player) return false;
    const isHitster = this.gameState.gameMode === 'hitster';
    const target = this.gameState.goal || (isHitster ? 10 : 50);
    const cardCount = (player.cards && Array.isArray(player.cards)) ? player.cards.length : (player.cards || 0);
    const current = isHitster ? Math.max(cardCount, player.points || 0) : (player.points || 0);

    if (current >= target && !this.gameState.winner) {
      this.gameState.winner = {
        ...player,
        cards: cardCount,
        points: player.points || 0
      };
      const scoreUnit = isHitster ? 'Karten' : 'Punkte';
      this.gameState.statusText = `👑 **${player.username}** hat das Spielziel von ${target} ${scoreUnit} erreicht und das Quiz GEWONNEN! 🏆`;
      this.gameState.isLocked = true;
      this.gameState.screenFlash = 'green';
      audioManager.playPerfect();

      if (this.gameState.currentMessage && this.gameState.currentMessage.channel) {
        try {
          const victoryEmbed = createVictoryEmbed(this.gameState.winner, {
            roundNumber: this.gameState.roundNumber,
            scores: this.gameState.scores,
            gameMode: this.gameState.gameMode,
            goal: target
          });
          this.gameState.currentMessage.channel.send({ embeds: [victoryEmbed] });
        } catch (err) {
          console.error('[Bot] Failed to send victory embed:', err);
        }
      }

      this.emitState();
      return true;
    }
    return false;
  }

  async updateRichPresence() {
    if (!this.client || !this.isReady || !this.client.user) return;
    if (!this.gameState.gameMode || this.gameState.gameMode === 'standby') {
      this.startStandbyPresence();
      return;
    }

    if (this.standbyInterval) {
      clearInterval(this.standbyInterval);
      this.standbyInterval = null;
    }

    try {
      const playersInVoice = this.gameState.voiceMembers.length;
      const round = this.gameState.roundNumber;
      const mode = this.gameState.gameMode;
      
      let activityName = `SongQuiz 🎵 | Runde ${round}`;
      if (mode === 'wallpaper') {
        activityName = `Filme / Wallpaper erkennen 🎬 | Runde ${round}`;
      } else if (mode === 'hitster') {
        activityName = `Hitster Zeitstrahl 📻 | Runde ${round}`;
      }

      this.client.user.setPresence({
        activities: [{
          name: activityName,
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
      if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) return;

      const members = [];
      voiceChannel.members.forEach((member) => {
        if (!member.user.bot) {
          const uid = member.id;

          // IMPORTANT: The Host (Spielleiter) is NEVER a contestant/player!
          if (this.isHost(member)) {
            if (this.gameState.scores[uid]) {
              delete this.gameState.scores[uid];
            }
            return;
          }

          const uname = member.displayName || member.user.displayName || member.user.username;
          const avatar = member.user.displayAvatarURL({ size: 128 });
          const isBanned = !!this.gameState.bannedPlayers[uid];

          members.push({ id: uid, username: uname, avatar, isBanned });

          if (!this.gameState.scores[uid]) {
            this.gameState.scores[uid] = {
              id: uid,
              username: uname,
              avatar,
              points: 0,
              correct: 0,
              wrong: 0
            };
          } else {
            this.gameState.scores[uid].username = uname;
            this.gameState.scores[uid].avatar = avatar;
          }
        }
      });

      // Purge any lingering host entry from scores by ID or name
      const hostId = this.config.hostId || '327863089796087809';
      delete this.gameState.scores[hostId];
      delete this.gameState.scores['327863089796087809'];
      Object.keys(this.gameState.scores).forEach(key => {
        if (this.isHost(this.gameState.scores[key])) {
          delete this.gameState.scores[key];
        }
      });

      this.gameState.voiceMembers = members;
      this.emitState();
    } catch (err) {
      console.error('[Bot] Error fetching voice members:', err);
    }
  }

  async start() {
    if (this.client) {
      await this.stop();
    }

    if (!this.config.token || this.config.token.trim().length < 20) {
      this.emit('status-changed', { connected: false, error: 'Ungültiger oder fehlender Bot-Token.' });
      return { success: false, error: 'Ungültiger Token' };
    }

    // Non-privileged intents: 100% reliable without 'Used disallowed intents' error
    const intents = [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages
    ];

    this.client = new Client({ intents });

    this.client.on('ready', async () => {
      console.log(`[Bot] Logged in as ${this.client.user.tag}`);
      this.isReady = true;

      // Register Slash Commands
      try {
        const commands = [
          {
            name: 'buzzer',
            description: '🔔 Betätige den MannisBox Buzzer!'
          },
          {
            name: 'goal',
            description: '🎯 Zeige oder setze das Punkte-Spielziel für den Sieg',
            options: [
              {
                name: 'target',
                type: 4, // Integer
                description: 'Punkte-Ziel (z.B. 30, 50, 100)',
                required: false
              }
            ]
          },
          {
            name: 'boost',
            description: '🔥 Aktiviere den 2x Multiplikator (Doppelte Punkte auf nächste Antwort)!'
          },
          {
            name: 'score',
            description: '📊 Zeige die aktuelle Live-Rangliste an'
          },
          {
            name: 'help',
            description: '📖 Zeige alle Spielregeln und Befehle an'
          }
        ];
        if (this.client.application) {
          await this.client.application.commands.set(commands);
        }
        if (this.config.guildId) {
          try {
            const g = await this.client.guilds.fetch(this.config.guildId).catch(() => null);
            if (g) await g.commands.set(commands).catch(() => null);
          } catch (e) {}
        }
        console.log('[Bot] Registered slash commands (global + guild): /buzzer, /goal, /boost, /score, /help');
      } catch (cmdErr) {
        console.warn('[Bot] Slash command registration notice:', cmdErr.message);
      }

      // Automatically fetch and recognize existing guilds the bot is on
      try {
        await this.client.guilds.fetch();
      } catch (err) {
        console.warn('[Bot] Failed to pre-fetch guilds:', err.message);
      }

      // Auto-select existing server if none configured or invalid
      if (!this.config.guildId || !this.client.guilds.cache.has(this.config.guildId)) {
        const firstGuild = this.client.guilds.cache.first();
        if (firstGuild) {
          this.config.guildId = firstGuild.id;
          saveConfig(this.config);
          console.log(`[Bot] Auto-selected existing guild: ${firstGuild.name} (${firstGuild.id})`);
        }
      }

      // Auto-select channels if missing
      if (this.config.guildId) {
        try {
          const guild = await this.client.guilds.fetch(this.config.guildId);
          const channels = await guild.channels.fetch();
          if (!this.config.textChannelId) {
            const firstText = channels.find(c => c && c.type === ChannelType.GuildText);
            if (firstText) {
              this.config.textChannelId = firstText.id;
              saveConfig(this.config);
            }
          }
          if (!this.config.voiceChannelId) {
            const firstVoice = channels.find(c => c && c.type === ChannelType.GuildVoice);
            if (firstVoice) {
              this.config.voiceChannelId = firstVoice.id;
              saveConfig(this.config);
            }
          }
        } catch (e) {}
      }

      await this.resolveHostName();
      if (!this.gameState.currentTextChannelId && this.config.textChannelId) {
        this.gameState.currentTextChannelId = this.config.textChannelId;
      }
      const hostId = this.config.hostId || '327863089796087809';
      delete this.gameState.scores[hostId];
      delete this.gameState.scores['327863089796087809'];
      Object.keys(this.gameState.scores).forEach(id => {
        if (this.isHost(this.gameState.scores[id])) {
          delete this.gameState.scores[id];
        }
      });
      await this.updateRichPresence();

      this.emit('status-changed', {
        online: true,
        connected: true,
        tag: this.client.user.tag,
        id: this.client.user.id,
        user: { tag: this.client.user.tag, id: this.client.user.id },
        inviteUrl: `https://discord.com/oauth2/authorize?client_id=${this.client.user.id}&permissions=8&integration_type=0&scope=bot+applications.commands`,
        hostName: this.hostName
      });

      this.isVoiceIntentionallyLeft = false;
      this.emitState();

      if (this.config.guildId && this.config.voiceChannelId) {
        await this.joinVoice(this.config.guildId, this.config.voiceChannelId).catch(() => {});
      }

      this.startVoiceWatchdog();
    });

    this.client.on('voiceStateUpdate', async (oldState, newState) => {
      // Check if the bot itself was affected
      if (this.client?.user && newState.id === this.client.user.id) {
        if (!newState.channelId) {
          // Bot was disconnected from voice channel
          console.warn('[Bot] Bot was disconnected from voice channel.');
          this.emit('voice-status', { connected: false });
          if (!this.isVoiceIntentionallyLeft && this.config.guildId && this.config.voiceChannelId) {
            this.scheduleVoiceReconnect(1500);
          }
        } else if (newState.channelId !== this.gameState.currentVoiceChannelId) {
          // Bot was moved to a different voice channel
          console.log(`[Bot] Bot was moved to voice channel ${newState.channelId}`);
          this.gameState.currentVoiceChannelId = newState.channelId;
          this.config.voiceChannelId = newState.channelId;
          saveConfig(this.config);
          await this.updateVoiceMembers();
          await this.updateRichPresence();
          this.emit('voice-status', { connected: true, guildId: newState.guild.id, channelId: newState.channelId });
        }
      }

      const channelId = this.gameState.currentVoiceChannelId;
      if (!channelId) return;

      if (oldState.channelId === channelId || newState.channelId === channelId) {
        await this.updateVoiceMembers();
        await this.updateRichPresence();
      }
    });

    this.client.on('interactionCreate', async (interaction) => {
      try {
        const sendReply = async (opts) => {
          const data = typeof opts === 'string' ? { content: opts } : opts;
          try {
            if (interaction.deferred) {
              return await interaction.editReply(data);
            } else if (interaction.replied) {
              return await interaction.followUp(data);
            } else {
              return await interaction.reply(data);
            }
          } catch (e) {
            console.warn('[Bot] Failed to send interaction reply:', e.message);
          }
        };

        if (interaction.isButton()) {
          if (interaction.customId === 'mannisbox_buzzer') {
            await this.handleBuzzerInteraction(interaction);
          } else if (interaction.customId === 'mannisbox_boost') {
            const isHost = !this.config.hostId || interaction.user.id === this.config.hostId || interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
            if (!isHost) {
              await sendReply({
                content: '⛔ Nur der Spielleiter (Host) kann den 2X Boost aktivieren oder deaktivieren!',
                ephemeral: true
              });
              return;
            }
            const res = this.toggleBoost();
            const standbyNote = (!this.gameState.gameMode || this.gameState.gameMode === 'standby') 
              ? '\n*(Hinweis: Aktuell im Standby. Bitte wähle in der App ein Spiel aus!)*' : '';
            await sendReply({
              content: (res.isBoostActive 
                ? '🔥 **BOOST AKTIVIERT!** Die Punkte der nächsten korrekten Antwort zählen DOPPELT (2x)!' 
                : '❄️ Boost wurde deaktiviert.') + standbyNote,
              ephemeral: true
            });
          } else if (interaction.customId === 'mannisbox_goal') {
            const unit = this.gameState.gameMode === 'hitster' ? 'Karten' : 'Punkte';
            await sendReply({
              content: `🎯 **Aktuelles Spielziel:** \`${this.gameState.goal} ${unit}\`\nWer dieses Ziel zuerst erreicht, holt sich den Champion-Sieg!`,
              ephemeral: true
            });
          } else if (interaction.customId === 'mannisbox_score') {
            const { formatDiscordLeaderboard } = require('./embeds');
            const unit = this.gameState.gameMode === 'hitster' ? 'Karten' : 'Punkte';
            await sendReply({
              content: `📊 **Live-Rangliste (Ziel: ${this.gameState.goal} ${unit}):**\n${formatDiscordLeaderboard(this.gameState.scores, this.gameState.goal, this.gameState.gameMode)}`,
              ephemeral: true
            });
          } else if (interaction.customId === 'mannisbox_hitster_chip') {
            const userId = interaction.user.id;
            const username = interaction.member?.displayName || interaction.user.username;
            const avatar = interaction.user.displayAvatarURL({ extension: 'png', size: 128 });
            const res = this.challengeHitsterChip(userId, username, avatar);
            if (res.success) {
              await sendReply({
                content: `⚔️ **[CHIP GEWORFEN]** <@${userId}> hat als ERSTER den Spielchip geworfen und fechtet an!\n⏱️ Zeit: \`${res.challenge.timeFormatted}\` | Verbleibende Chips: **${res.challenge.remainingChips}**`,
                ephemeral: false
              });
            } else {
              await sendReply({
                content: `⚠️ ${res.error || 'Aktion nicht möglich.'}`,
                ephemeral: true
              });
            }
          }
        } else if (interaction.isChatInputCommand()) {
          const { commandName } = interaction;
          const isHost = !this.config.hostId || interaction.user.id === this.config.hostId || interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);

          // Bug 4: Immediate deferReply to immune against Discord 3s token timeout
          let ephemeral = true;
          if (commandName === 'score') {
            ephemeral = false;
          } else if (commandName === 'boost' && isHost) {
            ephemeral = false;
          } else if (commandName === 'goal' && isHost && interaction.options.getInteger('target') > 0) {
            ephemeral = false;
          }

          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral }).catch(() => {});
          }

          if (commandName === 'buzzer') {
            await this.handleBuzzerInteraction(interaction);
          } else if (commandName === 'boost') {
            if (!isHost) {
              await sendReply({
                content: '⛔ Nur der Spielleiter (Host) kann den 2X Boost steuern!',
                ephemeral: true
              });
              return;
            }
            const res = this.toggleBoost();
            const standbyNote = (!this.gameState.gameMode || this.gameState.gameMode === 'standby') 
              ? '\n*(Hinweis: Aktuell im Standby. Bitte wähle in der App ein Spiel aus!)*' : '';
            await sendReply({
              content: (res.isBoostActive 
                ? '🔥 **BOOST-RUNDE AKTIVIERT!** Alle Punkte auf die nächste richtige Antwort zählen DOPPELT (2x)!' 
                : '❄️ Boost deaktiviert.') + standbyNote,
              ephemeral: false
            });
          } else if (commandName === 'goal') {
            const target = interaction.options.getInteger('target');
            if (target && target > 0) {
              if (!isHost) {
                await sendReply({
                  content: '⛔ Nur der Spielleiter (Host) kann das Spielziel verändern!',
                  ephemeral: true
                });
                return;
              }
              this.setGoal(target);
              const unit = this.gameState.gameMode === 'hitster' ? 'Karten' : 'Punkte';
              const standbyNote = (!this.gameState.gameMode || this.gameState.gameMode === 'standby') 
                ? ' *(Hinweis: MannisBox befindet sich im Standby)*' : '';
              await sendReply({
                content: `🎯 **Neues Spielziel gesetzt:** \`${target} ${unit}\`! Möge der Beste gewinnen!${standbyNote}`,
                ephemeral: false
              });
            } else {
              const unit = this.gameState.gameMode === 'hitster' ? 'Karten' : 'Punkte';
              await sendReply({
                content: `🎯 **Aktuelles Spielziel:** \`${this.gameState.goal} ${unit}\``,
                ephemeral: true
              });
            }
          } else if (commandName === 'score') {
            const { formatDiscordLeaderboard } = require('./embeds');
            const unit = this.gameState.gameMode === 'hitster' ? 'Karten' : 'Punkte';
            await sendReply({
              content: `🏆 **Aktuelle Rangliste (Ziel: ${this.gameState.goal} ${unit}):**\n${formatDiscordLeaderboard(this.gameState.scores, this.gameState.goal, this.gameState.gameMode)}`,
              ephemeral: false
            });
          } else if (commandName === 'help') {
            await sendReply({ embeds: [createHelpEmbed(this.gameState)], ephemeral: true });
          }
        }
      } catch (err) {
        console.error('[Bot] Interaction error:', err);
      }
    });

    this.client.on('messageCreate', async (msg) => {
      if (!msg.guild || msg.author.bot) return;
      const content = msg.content.trim();
      if (!content.startsWith('!')) return;

      const [cmd, ...args] = content.slice(1).split(/\s+/);
      const lower = (cmd || '').toLowerCase();

      try {
        if (lower === 'buzzer' || lower === 'buzz') {
          await this.handleUserBuzz({
            userId: msg.author.id,
            username: msg.member?.displayName || msg.author.displayName || msg.author.username,
            avatar: msg.author.displayAvatarURL({ size: 128 }),
            replyFn: (opts) => msg.reply(typeof opts === 'string' ? opts : opts.content)
          });
        } else if (lower === 'boost') {
          const isHost = !this.config.hostId || msg.author.id === this.config.hostId || msg.member?.permissions.has(PermissionsBitField.Flags.Administrator);
          if (!isHost) {
            await msg.reply('⛔ Nur der Spielleiter kann den Boost steuern!');
            return;
          }
          const res = this.toggleBoost();
          await msg.reply(res.isBoostActive ? '🔥 **BOOST AKTIV! (2x Punkte auf nächste richtige Antwort)**' : '❄️ Boost deaktiviert.');
        } else if (lower === 'goal') {
          const target = parseInt(args[0], 10);
          if (target > 0) {
            const isHost = !this.config.hostId || msg.author.id === this.config.hostId || msg.member?.permissions.has(PermissionsBitField.Flags.Administrator);
            if (!isHost) {
              await msg.reply('⛔ Nur der Spielleiter kann das Spielziel anpassen!');
              return;
            }
            this.setGoal(target);
            const unit = this.gameState.gameMode === 'hitster' ? 'Karten' : 'Punkte';
            await msg.reply(`🎯 **Neues Spielziel gesetzt:** \`${target} ${unit}\`!`);
          } else {
            const unit = this.gameState.gameMode === 'hitster' ? 'Karten' : 'Punkte';
            await msg.reply(`🎯 **Aktuelles Spielziel:** \`${this.gameState.goal} ${unit}\``);
          }
        } else if (lower === 'score' || lower === 'punkte') {
          const { formatDiscordLeaderboard } = require('./embeds');
          await msg.reply(`🏆 **Live-Rangliste:**\n${formatDiscordLeaderboard(this.gameState.scores, this.gameState.goal, this.gameState.gameMode)}`);
        } else if (lower === 'help') {
          await msg.reply({ embeds: [createHelpEmbed(this.gameState)] });
        }
      } catch (mErr) {
        console.error('[Bot] Message command error:', mErr);
      }
    });

    this.client.on('error', (err) => {
      console.error('[Bot] Client error:', err);
      this.emit('error', err.message);
    });

    try {
      await this.client.login(this.config.token);
      return { success: true };
    } catch (err) {
      console.error('[Bot] Login failed:', err);
      this.isReady = false;
      this.emit('status-changed', { connected: false, error: err.message });
      return { success: false, error: err.message };
    }
  }

  async stop() {
    this.stopVoiceWatchdog();
    if (this.voiceReconnectTimeout) {
      clearTimeout(this.voiceReconnectTimeout);
      this.voiceReconnectTimeout = null;
    }
    this.stopRoundTimer();
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
    this.leaveVoice();

    if (this.client) {
      try {
        await this.client.destroy();
      } catch (err) {}
      this.client = null;
    }
    this.isReady = false;
    this.emit('status-changed', { connected: false });
  }

  async getGuilds() {
    if (!this.client || !this.isReady) return [];
    try {
      const fetched = await this.client.guilds.fetch();
      const list = [];
      for (const [id, g] of fetched) {
        list.push({
          id: g.id,
          name: g.name,
          icon: typeof g.iconURL === 'function' ? g.iconURL() : (g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null)
        });
      }
      return list;
    } catch (e) {
      return this.client.guilds.cache.map((g) => ({
        id: g.id,
        name: g.name,
        icon: typeof g.iconURL === 'function' ? g.iconURL() : null
      }));
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

      channels.forEach((ch) => {
        if (!ch) return;
        if (ch.type === ChannelType.GuildText) {
          textChannels.push({ id: ch.id, name: ch.name });
        } else if (ch.type === ChannelType.GuildVoice) {
          voiceChannels.push({ id: ch.id, name: ch.name });
        }
      });

      return {
        text: textChannels.sort((a, b) => a.name.localeCompare(b.name)),
        voice: voiceChannels.sort((a, b) => a.name.localeCompare(b.name))
      };
    } catch (err) {
      console.error('[Bot] Get channels error:', err);
      return { text: [], voice: [] };
    }
  }

  scheduleVoiceReconnect(delayMs = 2000) {
    if (this.isVoiceIntentionallyLeft) return;
    if (this.voiceReconnectTimeout) {
      clearTimeout(this.voiceReconnectTimeout);
    }
    this.voiceReconnectTimeout = setTimeout(async () => {
      this.voiceReconnectTimeout = null;
      if (this.isVoiceIntentionallyLeft || !this.isReady) return;
      const targetGuildId = this.config.guildId;
      const targetChannelId = this.config.voiceChannelId;
      if (targetGuildId && targetChannelId) {
        console.log(`[Bot] Executing scheduled voice reconnect to channel ${targetChannelId}...`);
        await this.joinVoice(targetGuildId, targetChannelId).catch(err => {
          console.warn('[Bot] Scheduled voice reconnect error:', err.message);
        });
      }
    }, delayMs);
  }

  startVoiceWatchdog() {
    this.stopVoiceWatchdog();
    this.voiceWatchdogInterval = setInterval(async () => {
      if (!this.client || !this.isReady || this.isVoiceIntentionallyLeft) return;
      if (this.voiceJoinPromise) return; // Connection attempt already in progress
      const targetGuildId = this.config.guildId;
      const targetChannelId = this.config.voiceChannelId;
      if (!targetGuildId || !targetChannelId) return;

      try {
        const existing = getVoiceConnection(targetGuildId) || this.currentVoiceConnection;

        // If in handshake (Signalling or Connecting), do NOT touch or destroy the connection!
        if (existing && (
          existing.state.status === VoiceConnectionStatus.Signalling ||
          existing.state.status === VoiceConnectionStatus.Connecting
        )) {
          return;
        }

        // If Ready, verify channel matches
        if (existing && existing.state.status === VoiceConnectionStatus.Ready) {
          if (existing.joinConfig?.channelId === targetChannelId) {
            return; // Healthy and connected to the configured channel
          }
        }

        // Connection dropped, missing, or mismatched channel
        console.log('[Bot Watchdog] Voice connection dropped or out of sync. Scheduling reconnect...');
        this.scheduleVoiceReconnect(1000);
      } catch (err) {
        console.warn('[Bot Watchdog] Heartbeat check warning:', err.message);
      }
    }, 15000);
  }

  stopVoiceWatchdog() {
    if (this.voiceWatchdogInterval) {
      clearInterval(this.voiceWatchdogInterval);
      this.voiceWatchdogInterval = null;
    }
  }

  async joinVoice(guildId, channelId) {
    if (this.voiceJoinPromise) {
      console.log('[Bot] Voice join already in progress, awaiting existing promise...');
      return this.voiceJoinPromise;
    }

    this.voiceJoinPromise = (async () => {
      if (!this.client || !this.isReady) {
        return { success: false, error: 'Bot nicht bereit' };
      }
      if (!guildId || !channelId) {
        return { success: false, error: 'Server oder Voice-Kanal nicht angegeben' };
      }

      this.isVoiceIntentionallyLeft = false;

      // Check if an existing connection for this guild is already active and healthy in the target channel
      const existing = getVoiceConnection(guildId) || this.currentVoiceConnection;
      if (existing && existing.state.status === VoiceConnectionStatus.Ready) {
        if (this.gameState.currentVoiceChannelId === channelId && existing.joinConfig?.channelId === channelId) {
          this.currentVoiceConnection = existing;
          audioManager.setConnection(existing);
          await this.updateVoiceMembers();
          await this.updateRichPresence();
          this.emit('voice-status', { connected: true, guildId, channelId });
          return { success: true, reused: true };
        }
      }

      try {
        const guild = await this.client.guilds.fetch(guildId);
        const voiceChannel = await guild.channels.fetch(channelId);
        if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
          return { success: false, error: 'Voice-Kanal nicht gefunden' };
        }

        // If an existing connection exists and is in a different channel, clean it
        if (existing && existing !== this.currentVoiceConnection && existing.joinConfig?.channelId !== channelId) {
          try { existing.destroy(); } catch (e) {}
        }

        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
          selfDeaf: false,
          selfMute: false
        });

        // Assign immediately so other checks don't see it as null during handshake
        this.currentVoiceConnection = connection;
        audioManager.setConnection(connection);
        this.gameState.currentVoiceChannelId = channelId;
        this.gameState.currentGuildId = guildId;

        if (!connection._mannisListenersAttached) {
          connection._mannisListenersAttached = true;

          connection.on('error', (err) => {
            console.warn('[Bot] Voice Connection error:', err.message);
          });

          connection.on(VoiceConnectionStatus.Ready, async () => {
            console.log('[Bot] Voice connection state: READY.');
            audioManager.setConnection(connection);
            await this.updateVoiceMembers();
            await this.updateRichPresence();
            this.emit('voice-status', { connected: true, guildId, channelId });
          });

          connection.on(VoiceConnectionStatus.Disconnected, async () => {
            console.warn('[Bot] Voice connection disconnected. Evaluating reconnection...');
            this.emit('voice-status', { connected: false });
            if (this.isVoiceIntentionallyLeft) return;

            try {
              // Give Discord gateway a short window to automatically recover
              await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
              ]);
              console.log('[Bot] Voice connection recovered signaling/connecting automatically.');
            } catch (error) {
              if (this.isVoiceIntentionallyLeft) return;
              console.warn('[Bot] Voice connection did not recover within 5s. Scheduling reconnect...');
              try {
                if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                  connection.destroy();
                }
              } catch (e) {}
              this.scheduleVoiceReconnect(1500);
            }
          });

          connection.on(VoiceConnectionStatus.Destroyed, () => {
            this.emit('voice-status', { connected: false });
            if (this.currentVoiceConnection === connection) {
              this.currentVoiceConnection = null;
              audioManager.setConnection(null);
            }
            if (!this.isVoiceIntentionallyLeft) {
              console.warn('[Bot] Voice connection destroyed. Scheduling debounced reconnect...');
              this.scheduleVoiceReconnect(2000);
            }
          });
        }

        try {
          await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
          this.emit('voice-status', { connected: true, guildId, channelId });
          await this.updateVoiceMembers();
          await this.updateRichPresence();
          return { success: true };
        } catch (timeoutErr) {
          console.warn('[Bot] Voice Connection ready wait timeout:', timeoutErr.message);
          if (connection.state.status === VoiceConnectionStatus.Ready) {
            this.emit('voice-status', { connected: true, guildId, channelId });
            return { success: true };
          }
          this.emit('voice-status', { connected: false });
          return { success: false, error: 'Voice Timeout' };
        }
      } catch (err) {
        console.error('[Bot] Join voice error:', err);
        this.emit('voice-status', { connected: false });
        return { success: false, error: err.message };
      }
    })();

    try {
      return await this.voiceJoinPromise;
    } finally {
      this.voiceJoinPromise = null;
    }
  }

  leaveVoice() {
    this.isVoiceIntentionallyLeft = true;
    if (this.voiceReconnectTimeout) {
      clearTimeout(this.voiceReconnectTimeout);
      this.voiceReconnectTimeout = null;
    }
    const conn = this.currentVoiceConnection || (this.config.guildId ? getVoiceConnection(this.config.guildId) : null);
    if (conn) {
      try {
        conn.destroy();
      } catch (err) {}
    }
    this.currentVoiceConnection = null;
    audioManager.setConnection(null);
    this.gameState.currentVoiceChannelId = null;
    this.gameState.voiceMembers = [];
    this.emit('voice-status', { connected: false });
  }

  // --- ROUND TIMER SYSTEM ---
  startRoundTimer(durationSeconds = 30) {
    this.stopRoundTimer();

    this.gameState.roundTimer = {
      active: true,
      paused: false,
      elapsed: 0,
      remaining: durationSeconds,
      duration: durationSeconds
    };

    this.roundTicker = setInterval(() => {
      const t = this.gameState.roundTimer;
      if (!t.active || t.paused || this.gameState.isEvaluating || this.gameState.activePlayer) {
        return;
      }

      t.elapsed += 0.5;
      t.remaining = Math.max(0, t.duration - t.elapsed);

      // Wallpaper stage progression
      if (this.gameState.gameMode === 'wallpaper') {
        const prevStage = this.gameState.wallpaperState.stage;
        const stage = this.getWallpaperStage(t.elapsed);
        const points = this.getWallpaperPoints(t.elapsed);
        this.gameState.wallpaperState.stage = stage;
        this.gameState.wallpaperState.points = points;

        if (this.currentWallpaperRound?.stages) {
          this.gameState.wallpaperState.currentImage = this.currentWallpaperRound.stages[stage] || this.currentWallpaperRound.sharpImage;
        }

        if (stage !== prevStage) {
          this.updateDiscordMessage();
        }

        // Auto resolve when total stage time elapsed
        const totalWpTime = this.getWallpaperTotalDuration();
        if (t.elapsed >= totalWpTime && !this.gameState.wallpaperState.resolved) {
          this.resolveWallpaper();
          this.setBuzzerLocked(true);
        }
      }

      if (t.remaining <= 0) {
        if (this.gameState.gameMode === 'wallpaper') {
          this.setBuzzerLocked(true);
        }
        this.stopRoundTimer();
      }

      this.emitState();
    }, 500);
  }

  stopRoundTimer() {
    if (this.roundTicker) {
      clearInterval(this.roundTicker);
      this.roundTicker = null;
    }
    if (this.gameState.roundTimer) {
      this.gameState.roundTimer.active = false;
    }
  }

  // --- BUZZER INTERACTION ---
  async handleUserBuzz({ userId, username, avatar, replyFn }) {
    if (this.isHost(userId)) {
      return replyFn({ content: `👑 Du bist als Spielleiter (Host) eingetragen und kannst nicht selbst mitbuzzern!`, ephemeral: true });
    }
    if (this.gameState.bannedPlayers[userId]) {
      return replyFn({ content: '⛔ Du wurdest vom Spielleiter gesperrt!', ephemeral: true });
    }
    if (!this.gameState.isRoundActive || this.gameState.isLocked || this.gameState.isEvaluating) {
      return replyFn({ content: '🔒 Der Buzzer ist derzeit gesperrt!', ephemeral: true });
    }

    if (this.gameState.roundLockedPlayers && this.gameState.roundLockedPlayers[userId]) {
      return replyFn({ content: '❌ Du hast in dieser Runde bereits geantwortet und bist für diesen Song gesperrt!', ephemeral: true });
    }

    if (this.gameState.activePlayer) {
      return replyFn({ content: `⏱️ **${this.gameState.activePlayer.username}** ist gerade am Zug! Bitte warte, bis der Buzzer wieder frei gegeben wird.`, ephemeral: true });
    }

    if (!this.gameState.scores[userId]) {
      this.gameState.scores[userId] = { id: userId, username, avatar, points: 0, correct: 0, wrong: 0 };
    } else {
      this.gameState.scores[userId].username = username;
      this.gameState.scores[userId].avatar = avatar;
    }

    const now = Date.now();
    let timeOffset = '1. Platz (0.00s)';
    if (!this.gameState.roundFirstBuzzTime) {
      this.gameState.roundFirstBuzzTime = now;
    } else {
      const diffMs = now - this.gameState.roundFirstBuzzTime;
      timeOffset = `+${(diffMs / 1000).toFixed(2)}s`;
    }

    // Calculate potential points for Wallpaper mode
    let potentialPoints = 20;
    if (this.gameState.gameMode === 'wallpaper') {
      const elapsed = this.gameState.roundTimer ? this.gameState.roundTimer.elapsed : 0;
      potentialPoints = this.getWallpaperPoints(elapsed);
    } else if (this.gameState.gameMode === 'song') {
      potentialPoints = 3;
    } else if (this.gameState.gameMode === 'hitster') {
      potentialPoints = 1;
    }

    const player = { id: userId, username, avatar, timeOffset, timestamp: now, potentialPoints };

    this.gameState.activePlayer = player;
    this.gameState.queue = [];
    const boostBadge = this.gameState.isBoostActive ? ' 🔥 (2X BOOST)' : '';
    this.gameState.statusText = `🔔 **${username}** hat zuerst gebuzzert!${boostBadge}`;
    this.gameState.isLocked = true;
    if (this.gameState.roundTimer) {
      this.gameState.roundTimer.paused = true;
    }
    audioManager.pauseSong();
    if (this.gameState.songState) {
      this.gameState.songState.isPlaying = false;
    }
    audioManager.playBuzzer();
    this.startAnswerCountdown(15);
    await replyFn({ content: `🎉 **GEBUZZERT!** Du bist dran! Antworte jetzt im Voice-Chat!${boostBadge}`, ephemeral: true });

    // Send public announcement message into the selected Discord text channel!
    await this.sendBuzzAnnouncement({
      userId,
      username,
      avatar,
      timeOffset,
      potentialPoints,
      isBoostActive: this.gameState.isBoostActive,
      gameMode: this.gameState.gameMode
    });

    this.updateDiscordMessage();
    this.emitState();
  }

  async handleBuzzerInteraction(interaction) {
    if (interaction.channelId && !this.gameState.currentTextChannelId) {
      this.gameState.currentTextChannelId = interaction.channelId;
    }
    const userId = interaction.user.id;
    const username = interaction.member?.displayName || interaction.user.displayName || interaction.user.username;
    const avatar = interaction.user.displayAvatarURL({ size: 128 });
    await this.handleUserBuzz({
      userId,
      username,
      avatar,
      replyFn: async (opts) => {
        const data = typeof opts === 'string' ? { content: opts } : opts;
        try {
          if (interaction.deferred) {
            return await interaction.editReply(data);
          } else if (interaction.replied) {
            return await interaction.followUp(data);
          } else {
            return await interaction.reply(data);
          }
        } catch (e) {
          console.warn('[Bot] Failed to reply to buzzer interaction:', e.message);
        }
      }
    });
  }

  // --- ROUND LIFECYCLE ---
  async startRound({ textChannelId, voiceChannelId, guildId, duration = 30 } = {}) {
    const targetGuildId = guildId || this.config.guildId;
    const targetTextChannelId = textChannelId || this.config.textChannelId;
    const targetVoiceChannelId = voiceChannelId || this.config.voiceChannelId;

    this.isVoiceIntentionallyLeft = false;
    this.gameState.isRoundActive = true;
    this.gameState.isLocked = false;
    this.gameState.isEvaluating = false;
    this.gameState.activePlayer = null;
    this.gameState.queue = [];
    this.gameState.roundWrongAttempts = {};
    this.gameState.roundLockedPlayers = {};
    this.gameState.screenFlash = null;
    this.gameState.roundFirstBuzzTime = null;
    this.gameState.statusText = 'Drücke den Buzzer, wenn du die Antwort kennst!';
    this.gameState.currentTextChannelId = targetTextChannelId;
    this.gameState.currentGuildId = targetGuildId;
    this.gameState.cooldownSeconds = 0;

    // Mode-specific reset
    if (this.gameState.gameMode === 'wallpaper') {
      duration = this.getWallpaperTotalDuration();
      this.gameState.wallpaperState.resolved = false;
      this.gameState.wallpaperState.stage = 1;
      this.gameState.wallpaperState.points = (this.gameState.wallpaperStagePoints && this.gameState.wallpaperStagePoints[1] !== undefined)
        ? this.gameState.wallpaperStagePoints[1]
        : 4;
      if (this.currentWallpaperRound?.stages) {
        this.gameState.wallpaperState.currentImage = this.currentWallpaperRound.stages[1] || this.currentWallpaperRound.sharpImage;
      }
    } else if (this.gameState.gameMode === 'song') {
      this.gameState.songState.revealed = false;
      if (duration === 30) duration = 180;
    } else if (this.gameState.gameMode === 'hitster') {
      if (this.gameState.hitsterState.currentCard) {
        this.gameState.hitsterState.currentCard.revealed = false;
      }
      this.gameState.hitsterState.lastChallenge = null;
      if (duration === 30) duration = 180;
    }

    // Always start timer & update local state
    this.startRoundTimer(duration);
    this.emitState();

    // If Discord is connected and configured, dispatch to channel
    let messageId = null;
    if (this.client && this.isReady && targetTextChannelId) {
      try {
        if (targetGuildId && targetVoiceChannelId) {
          const existing = getVoiceConnection(targetGuildId) || this.currentVoiceConnection;
          const isReadyInChannel = existing && 
            existing.state.status === VoiceConnectionStatus.Ready && 
            this.gameState.currentVoiceChannelId === targetVoiceChannelId &&
            existing.joinConfig?.channelId === targetVoiceChannelId;

          if (!isReadyInChannel) {
            await this.joinVoice(targetGuildId, targetVoiceChannelId).catch(() => {});
          }
        }

        const channel = await this.client.channels.fetch(targetTextChannelId).catch(() => null);
        if (channel) {
          await this.resolveHostName();
          await this.updateVoiceMembers();

          let files = [];
          let imageAttachmentName = null;
          // Wallpaper image is stream/in-app exclusive and must NEVER be uploaded to Discord

          const embed = createBuzzerEmbed({
            roundNumber: this.gameState.roundNumber,
            hostId: this.config.hostId,
            hostName: this.hostName,
            isLocked: false,
            activePlayer: null,
            queue: [],
            scores: this.gameState.scores,
            statusText: this.gameState.statusText,
            channelPlayerCount: this.gameState.voiceMembers.length,
            gameMode: this.gameState.gameMode,
            wallpaperState: this.gameState.wallpaperState,
            songState: this.gameState.songState,
            hitsterState: this.gameState.hitsterState,
            goal: this.gameState.goal,
            isBoostActive: this.gameState.isBoostActive,
            imageAttachmentName
          });

          const components = createBuzzerComponents(false, false, this.gameState.gameMode, this.gameState.isBoostActive, this.gameState.goal);
          const sendOpts = { embeds: [embed], components };
          if (files.length > 0) sendOpts.files = files;
          const msg = await channel.send(sendOpts);
          this.gameState.currentMessage = msg;
          messageId = msg.id;
          this.updateRichPresence();
        }
      } catch (err) {
        console.warn('[Bot] Discord dispatch warning in startRound:', err.message);
      }
    }

    this.emitState();
    return { success: true, messageId };
  }

  async setBuzzerLocked(locked) {
    this.gameState.isLocked = locked;
    this.gameState.statusText = locked ? 'Buzzer wurde vorübergehend gesperrt.' : 'Buzzer ist freigegeben!';
    if (this.gameState.roundTimer) {
      this.gameState.roundTimer.paused = locked;
    }
    await this.updateDiscordMessage();
    this.emitState();
    return { success: true };
  }

  // --- 15-SECOND BUZZER ANSWER TIMER ---
  startAnswerCountdown(seconds = 15) {
    this.stopAnswerCountdown();
    this.gameState.answerTimer = {
      total: seconds,
      remaining: seconds,
      expired: false,
      activePlayerId: this.gameState.activePlayer ? this.gameState.activePlayer.id : null
    };
    this.emitState();

    this.answerCountdownInterval = setInterval(() => {
      if (!this.gameState.activePlayer || !this.gameState.answerTimer) {
        this.stopAnswerCountdown();
        return;
      }
      this.gameState.answerTimer.remaining -= 1;
      if (this.gameState.answerTimer.remaining <= 0) {
        this.gameState.answerTimer.remaining = 0;
        this.gameState.answerTimer.expired = true;
        this.gameState.statusText = '⚠️ 15 Sekunden Antwortzeit abgelaufen! Bitte Runde auflösen oder freigeben.';
        clearInterval(this.answerCountdownInterval);
        this.answerCountdownInterval = null;
      }
      this.emitState();
    }, 1000);
  }

  stopAnswerCountdown() {
    if (this.answerCountdownInterval) {
      clearInterval(this.answerCountdownInterval);
      this.answerCountdownInterval = null;
    }
    if (this.gameState.answerTimer) {
      this.gameState.answerTimer = null;
      this.emitState();
    }
  }

  resumeRound() {
    this.stopAnswerCountdown();
    this.gameState.activePlayer = null;
    this.gameState.queue = [];
    this.gameState.isLocked = false;
    this.gameState.isEvaluating = false;
    if (this.gameState.roundTimer) {
      this.gameState.roundTimer.paused = false;
    }
    audioManager.resumeSong();
    if (this.gameState.songState) {
      this.gameState.songState.isPlaying = true;
    }
    this.gameState.statusText = 'Buzzer ist wieder frei!';
    this.updateDiscordMessage();
    this.emitState();
    return { success: true };
  }

  abortRound() {
    this.stopAnswerCountdown();
    this.stopRoundTimer();
    this.gameState.isLocked = true;
    this.gameState.activePlayer = null;
    this.gameState.queue = [];

    audioManager.stop();
    if (this.gameState.songState) {
      this.gameState.songState.isPlaying = false;
    }

    if (this.gameState.gameMode === 'wallpaper') {
      this.resolveWallpaper();
    } else if (this.gameState.gameMode === 'hitster') {
      this.resolveHitsterCard();
    } else {
      this.gameState.songState.revealed = true;
    }

    this.gameState.statusText = '⏹️ Runde wurde vom Spielleiter abgebrochen. Lösung aufgedeckt!';
    this.updateDiscordMessage();
    this.emitState();
    return { success: true };
  }

  // --- EVALUATION ---
  async evaluateActivePlayer(action, targetPlayerName = null) {
    let player = this.gameState.activePlayer;
    if (!player && targetPlayerName) {
      player = this.gameState.scores[targetPlayerName] ||
        Object.values(this.gameState.scores).find(p => p.username === targetPlayerName || p.id === targetPlayerName);
    }
    if (this.gameState.isEvaluating || !player) {
      return { success: false, error: 'Kein Spieler zum Bewerten.' };
    }

    this.stopAnswerCountdown();

    const userId = player.id;
    const playerScore = this.gameState.scores[userId] || {
      id: userId,
      username: player.username,
      avatar: player.avatar,
      points: 0,
      correct: 0,
      wrong: 0,
      cards: []
    };

    if (!this.gameState.roundLockedPlayers) {
      this.gameState.roundLockedPlayers = {};
    }

    if (action === 'wrong' || action === 'skip') {
      // Fall 2: Player answered incorrectly
      // Auto-lock player who answered wrongly for the remainder of this song/round
      this.gameState.roundLockedPlayers[userId] = true;

      let penalty = 0;
      if (action === 'wrong') {
        const attempts = this.gameState.roundWrongAttempts[userId] || 0;
        penalty = attempts >= 1 ? (this.config.points.wrongRepeat || -2) : (this.config.points.wrongFirst || -1);
        if (this.gameState.gameMode === 'hitster') {
          penalty = 0;
        }
        this.gameState.roundWrongAttempts[userId] = attempts + 1;
        playerScore.points += penalty;
        playerScore.wrong = (playerScore.wrong || 0) + 1;
      }

      this.gameState.scores[userId] = playerScore;

      // Screen Flash RED
      this.gameState.screenFlash = 'red';
      this.gameState.flashId = Date.now();
      setTimeout(() => {
        if (this.gameState.screenFlash === 'red') {
          this.gameState.screenFlash = null;
          this.emitState();
        }
      }, 1500);

      audioManager.playWrong();
      audioManager.resumeSong();
      if (this.gameState.songState) {
        this.gameState.songState.isPlaying = true;
      }

      if (this.gameState.queue && this.gameState.queue.length > 0) {
        const nextPlayer = this.gameState.queue.shift();
        this.gameState.activePlayer = nextPlayer;
        this.gameState.isLocked = true;
        this.gameState.isEvaluating = false;
        this.startAnswerCountdown(10);
        this.gameState.statusText = `⏭️ Nächster Herausforderer an der Reihe: **${nextPlayer.username}**!`;
      } else {
        // Free the buzzer for remaining eligible players; song continues playing
        this.gameState.activePlayer = null;
        this.gameState.queue = [];
        this.gameState.isLocked = false;
        this.gameState.isEvaluating = false;
        if (this.gameState.roundTimer) {
          this.gameState.roundTimer.paused = false;
        }

        if (action === 'wrong') {
          this.gameState.statusText = `❌ **${player.username}** lag falsch (${penalty} Pkt.)! Song läuft weiter, Buzzer ist wieder frei.`;
        } else {
          this.gameState.statusText = `⏭️ **${player.username}** lag falsch (kein Abzug). Song läuft weiter, Buzzer ist wieder frei.`;
        }
      }

      // Post result to channel
      const targetTextChannelId = this.gameState.currentTextChannelId || this.config.textChannelId;
      if (this.client && this.isReady && targetTextChannelId) {
        this.client.channels.fetch(targetTextChannelId).then(ch => {
          if (ch && ch.isTextBased()) {
            const mention = userId ? `<@${userId}>` : `**${player.username}**`;
            ch.send(`❌ ${mention} lag leider **falsch** (${penalty} Pkt.)! Buzzer ist wieder frei.`);
          }
        }).catch(() => {});
      }

      await this.updateDiscordMessage();
      this.emitState();

    } else if (action === 'correct' || action === 'perfect') {
      // Fall 1: Correct answer
      let gain = this.config.points.correct || 3;
      if (this.gameState.gameMode === 'wallpaper') {
        gain = player.potentialPoints || 4;
        this.resolveWallpaper();
      } else if (this.gameState.gameMode === 'song' || !this.gameState.gameMode) {
        this.gameState.songState.revealed = true;
        if (action === 'perfect') gain = this.config.points.perfect || 4;
      } else if (this.gameState.gameMode === 'hitster') {
        gain = (typeof action === 'number') ? action : (action === 'perfect' ? 4 : 1);
        this.resolveHitsterCard(playerScore);
      }

      let wasBoosted = false;
      if (this.gameState.isBoostActive) {
        gain *= 2;
        wasBoosted = true;
        this.gameState.isBoostActive = false;
      }

      playerScore.points += gain;
      playerScore.correct = (playerScore.correct || 0) + 1;
      this.gameState.scores[userId] = playerScore;

      // Screen Flash GREEN
      this.gameState.screenFlash = 'green';
      this.gameState.flashId = Date.now();
      setTimeout(() => {
        if (this.gameState.screenFlash === 'green') {
          this.gameState.screenFlash = null;
          this.emitState();
        }
      }, 1500);

      this.stopRoundTimer();
      audioManager.playCorrect();
      audioManager.resumeSong();
      if (this.gameState.songState) {
        this.gameState.songState.isPlaying = true;
      }

      const boostTag = wasBoosted ? ' 🔥 (2X BOOST!)' : '';
      this.gameState.statusText = `✅ **${player.username}** hat richtig geantwortet (+${gain} Pkt.${boostTag})! Song läuft weiter.`;

      // Clear active player, lock buzzer because round is resolved, song keeps playing until host manually advances
      this.gameState.activePlayer = null;
      this.gameState.queue = [];
      this.gameState.isLocked = true;
      this.gameState.isEvaluating = false;

      this.checkVictory(playerScore);

      // Post result to channel
      const targetTextChannelId = this.gameState.currentTextChannelId || this.config.textChannelId;
      if (this.client && this.isReady && targetTextChannelId) {
        this.client.channels.fetch(targetTextChannelId).then(ch => {
          if (ch && ch.isTextBased()) {
            const mention = userId ? `<@${userId}>` : `**${player.username}**`;
            const boostTag = wasBoosted ? ' 🔥 **(2X BOOST!)**' : '';
            ch.send(action === 'perfect'
              ? `🌟 ${mention} hat **VOLLSTÄNDIG RICHTIG** geantwortet! (+${gain} Pkt.${boostTag}) 🏆`
              : `✅ ${mention} hat **RICHTIG** geantwortet! (+${gain} Pkt.${boostTag}) 🎉`
            );
          }
        }).catch(() => {});
      }

      await this.updateDiscordMessage();
      this.emitState();
    }

    return { success: true };
  }

  start3SecondCooldown(nextActionCallback) {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
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
        if (nextActionCallback) await nextActionCallback();
      }
      this.emitState();
    }, 1000);
  }

  // --- SONG MODE HELPERS ---
  async scanMusicFolder(folderPath) {
    const res = await scanAudioFolder(folderPath);
    if (res.success && res.files) {
      res.files.sort((a, b) => {
        const baseA = path.basename(a);
        const baseB = path.basename(b);
        return baseA.localeCompare(baseB, undefined, { numeric: true, sensitivity: 'base' });
      });
      this.currentMusicFolder = folderPath;
      this.availableMusicFiles = res.files;
      this.currentSongIndex = -1;
      await this.prepareNextSong();
    }
    return res;
  }

  setPlaylistMode(mode) {
    const validMode = (mode === 'numbered') ? 'numbered' : 'shuffle';
    this.playlistMode = validMode;
    this.gameState.playlistMode = validMode;
    if (!this.manuallyStagedNextSong) {
      this.prepareNextSong();
    } else {
      this.emitState();
    }
    return { success: true, mode: validMode };
  }

  async prepareNextSong(forcedFilePath = null) {
    let targetFile = null;
    if (forcedFilePath) {
      if (!this.availableMusicFiles) this.availableMusicFiles = [];
      const normForced = path.normalize(forcedFilePath).toLowerCase();
      const match = this.availableMusicFiles.find(f => path.normalize(f).toLowerCase() === normForced);
      if (match) {
        targetFile = match;
      } else if (fs.existsSync(forcedFilePath)) {
        targetFile = forcedFilePath;
        this.availableMusicFiles.push(forcedFilePath);
      }
      if (targetFile) {
        this.manuallyStagedNextSong = true;
        this.currentSongIndex = this.availableMusicFiles.indexOf(targetFile);
      }
    }

    if (!targetFile) {
      if (!this.availableMusicFiles || this.availableMusicFiles.length === 0) {
        this.gameState.nextSong = null;
        this.emitState();
        return null;
      }
      this.manuallyStagedNextSong = false;
      if (this.playlistMode === 'numbered') {
        this.currentSongIndex = (this.currentSongIndex + 1) % this.availableMusicFiles.length;
        targetFile = this.availableMusicFiles[this.currentSongIndex];
      } else {
        let randomIdx = Math.floor(Math.random() * this.availableMusicFiles.length);
        if (this.availableMusicFiles.length > 1 && randomIdx === this.currentSongIndex) {
          randomIdx = (randomIdx + 1) % this.availableMusicFiles.length;
        }
        this.currentSongIndex = randomIdx;
        targetFile = this.availableMusicFiles[randomIdx];
      }
    }

    if (!targetFile) return null;

    const tags = await extractAudioTags(targetFile);
    this.gameState.nextSong = {
      filePath: targetFile,
      title: tags.title,
      artist: tags.artist,
      fullTitle: tags.fullTitle,
      censoredTitle: tags.censoredTitle
    };

    this.emitState();
    return this.gameState.nextSong;
  }

  async stageSpecificNextSong(filePath) {
    const res = await this.prepareNextSong(filePath);
    return { success: !!res, nextSong: res };
  }

  async playNextSong() {
    if (!this.gameState.nextSong && this.availableMusicFiles.length > 0) {
      await this.prepareNextSong();
    }

    if (!this.gameState.nextSong) {
      return { success: false, error: 'Kein nächster Song vorhanden.' };
    }

    const currentToPlay = this.gameState.nextSong;
    this.gameState.songState = {
      title: currentToPlay.title,
      artist: currentToPlay.artist,
      fullTitle: currentToPlay.fullTitle,
      censoredTitle: currentToPlay.censoredTitle,
      revealed: false,
      filePath: currentToPlay.filePath,
      isPlaying: true
    };

    // Play in Discord Voice if connected
    audioManager.playSong(currentToPlay.filePath);

    // Auto-advance subsequent preview
    this.manuallyStagedNextSong = false;
    await this.prepareNextSong();

    // Reset round states for the new song
    this.gameState.roundLockedPlayers = {};
    this.gameState.activePlayer = null;
    this.gameState.queue = [];
    this.gameState.isLocked = false;
    this.gameState.screenFlash = null;
    this.gameState.statusText = '🎵 Song läuft! Drücke den Buzzer, wenn du die Antwort kennst!';

    this.emitState();
    return { success: true, song: this.gameState.songState, nextSong: this.gameState.nextSong };
  }

  pauseSong() {
    audioManager.pauseSong();
    if (this.gameState.songState) {
      this.gameState.songState.isPlaying = false;
    }
    this.emitState();
    return { success: true };
  }

  resumeSong() {
    audioManager.resumeSong();
    if (this.gameState.songState) {
      this.gameState.songState.isPlaying = true;
    }
    this.emitState();
    return { success: true };
  }

  stopSong() {
    audioManager.stop();
    if (this.gameState.songState) {
      this.gameState.songState.isPlaying = false;
    }
    this.emitState();
    return { success: true };
  }

  async pickRandomSong(genre = null) {
    return await this.playNextSong();
  }

  setManualSong(artist, title) {
    const cleanArt = cleanMetadata(artist) || 'Unbekannt';
    const cleanTit = cleanMetadata(title) || 'Unbekannter Song';

    this.gameState.songState = {
      title: cleanTit,
      artist: cleanArt,
      fullTitle: `${cleanArt} - ${cleanTit}`,
      censoredTitle: `${censorText(cleanArt)} - ${censorText(cleanTit)}`,
      revealed: false,
      filePath: ''
    };

    this.emitState();
    return { success: true, song: this.gameState.songState };
  }

  generatePixelatedStages(imagePath) {
    if (!imagePath || !fs.existsSync(imagePath)) {
      return { 1: imagePath, 2: imagePath, 3: imagePath, 4: imagePath, 5: imagePath };
    }
    if (!nativeImage) {
      return { 1: imagePath, 2: imagePath, 3: imagePath, 4: imagePath, 5: imagePath };
    }
    try {
      const cacheDir = path.join(os.tmpdir(), 'mannisbox_wp_stages');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const img = nativeImage.createFromPath(imagePath);
      const size = img.getSize();
      if (size.width === 0 || size.height === 0) {
        return { 1: imagePath, 2: imagePath, 3: imagePath, 4: imagePath, 5: imagePath };
      }

      const fileBase = path.basename(imagePath, path.extname(imagePath)).replace(/[^a-zA-Z0-9_-]/g, '_');
      const hash = `${fileBase}_${size.width}x${size.height}`;

      const s1Path = path.join(cacheDir, `${hash}_stage1.jpg`);
      const s2Path = path.join(cacheDir, `${hash}_stage2.jpg`);
      const s3Path = path.join(cacheDir, `${hash}_stage3.jpg`);
      const s4Path = path.join(cacheDir, `${hash}_stage4.jpg`);

      // Stage 1 (0-10s): Extreme pixelation
      if (!fs.existsSync(s1Path)) {
        const p1 = img.resize({ width: 24, height: Math.max(14, Math.round(24 * (size.height / size.width))), quality: 'low' })
                      .resize({ width: 640, height: 360, quality: 'low' });
        fs.writeFileSync(s1Path, p1.toJPEG(85));
      }
      // Stage 2 (10-20s): Heavy pixelation
      if (!fs.existsSync(s2Path)) {
        const p2 = img.resize({ width: 48, height: Math.max(27, Math.round(48 * (size.height / size.width))), quality: 'low' })
                      .resize({ width: 640, height: 360, quality: 'low' });
        fs.writeFileSync(s2Path, p2.toJPEG(85));
      }
      // Stage 3 (20-30s): Medium pixelation
      if (!fs.existsSync(s3Path)) {
        const p3 = img.resize({ width: 96, height: Math.max(54, Math.round(96 * (size.height / size.width))), quality: 'low' })
                      .resize({ width: 640, height: 360, quality: 'low' });
        fs.writeFileSync(s3Path, p3.toJPEG(88));
      }
      // Stage 4 (30-40s): Light pixelation
      if (!fs.existsSync(s4Path)) {
        const p4 = img.resize({ width: 200, height: Math.max(112, Math.round(200 * (size.height / size.width))), quality: 'low' })
                      .resize({ width: 640, height: 360, quality: 'low' });
        fs.writeFileSync(s4Path, p4.toJPEG(90));
      }

      return {
        1: s1Path,
        2: s2Path,
        3: s3Path,
        4: s4Path,
        5: imagePath
      };
    } catch (err) {
      console.warn('[Bot] generatePixelatedStages error:', err.message);
      return { 1: imagePath, 2: imagePath, 3: imagePath, 4: imagePath, 5: imagePath };
    }
  }

  // --- WALLPAPER MODE HELPERS ---
  scanWallpaperFolder(folderPath) {
    const res = scanWallpaperFolder(folderPath);
    if (res.success && res.rounds.length > 0) {
      this.availableWallpaperRounds = res.rounds;
      this.setWallpaperRound(res.rounds[0]);
    }
    return res;
  }

  setWallpaperRound(roundData) {
    if (!roundData.stages || roundData.stages[1] === roundData.sharpImage) {
      roundData.stages = this.generatePixelatedStages(roundData.sharpImage);
    }
    this.currentWallpaperRound = roundData;
    this.gameState.wallpaperState = {
      currentImage: roundData.stages[1] || roundData.sharpImage,
      stage: 1,
      points: 4,
      movieTitle: roundData.movieTitle,
      sharpImage: roundData.sharpImage,
      resolved: false,
      stages: roundData.stages
    };
    this.emitState();
  }

  pickNextWallpaper() {
    if (!this.availableWallpaperRounds || this.availableWallpaperRounds.length === 0) {
      return { success: false, error: 'Keine Wallpaper-Runden im Ordner geladen.' };
    }
    const curIdx = this.availableWallpaperRounds.findIndex(r => r === this.currentWallpaperRound);
    const nextIdx = (curIdx + 1) % this.availableWallpaperRounds.length;
    this.setWallpaperRound(this.availableWallpaperRounds[nextIdx]);
    return { success: true, round: this.gameState.wallpaperState };
  }

  pickRandomWallpaper() {
    if (!this.availableWallpaperRounds || this.availableWallpaperRounds.length === 0) {
      return { success: false, error: 'Keine Wallpaper-Runden im Ordner geladen.' };
    }
    const idx = Math.floor(Math.random() * this.availableWallpaperRounds.length);
    this.setWallpaperRound(this.availableWallpaperRounds[idx]);
    return { success: true, round: this.gameState.wallpaperState };
  }

  uploadWallpaper(imagePath, movieTitle) {
    const stages = this.generatePixelatedStages(imagePath);
    const round = {
      movieTitle: movieTitle || 'Unbekannter Film',
      stages,
      sharpImage: imagePath
    };
    this.setWallpaperRound(round);
    return { success: true, round: this.gameState.wallpaperState };
  }

  resolveWallpaper() {
    this.gameState.wallpaperState.resolved = true;
    if (this.currentWallpaperRound?.sharpImage) {
      this.gameState.wallpaperState.currentImage = this.currentWallpaperRound.sharpImage;
    }
    this.emitState();
  }

  getWallpaperTotalDuration() {
    const times = this.gameState.wallpaperStageTimes || { 1: 10, 2: 10, 3: 10, 4: 10 };
    return (times[1] || 10) + (times[2] || 10) + (times[3] || 10) + (times[4] || 10);
  }

  getWallpaperStage(elapsedSeconds) {
    return getWallpaperStage(elapsedSeconds, this.gameState.wallpaperStageTimes);
  }

  getWallpaperPoints(elapsedSeconds) {
    return calculateWallpaperPoints(elapsedSeconds, this.gameState.wallpaperStagePoints, this.gameState.wallpaperStageTimes);
  }

  setWallpaperStagePoints(pointsObj) {
    if (!this.gameState.wallpaperStagePoints) {
      this.gameState.wallpaperStagePoints = { 1: 4, 2: 3, 3: 2, 4: 1 };
    }
    if (pointsObj && typeof pointsObj === 'object') {
      this.gameState.wallpaperStagePoints = { ...this.gameState.wallpaperStagePoints, ...pointsObj };
      if (this.gameState.gameMode === 'wallpaper') {
        const elapsed = this.gameState.roundTimer ? this.gameState.roundTimer.elapsed : 0;
        this.gameState.wallpaperState.points = this.getWallpaperPoints(elapsed);
        if (this.gameState.activePlayer) {
          this.gameState.activePlayer.potentialPoints = this.gameState.wallpaperState.points;
        }
      }
      this.emitState();
      return { success: true, points: this.gameState.wallpaperStagePoints };
    }
    return { success: false };
  }

  setWallpaperStageTimes(timesObj) {
    if (!this.gameState.wallpaperStageTimes) {
      this.gameState.wallpaperStageTimes = { 1: 10, 2: 10, 3: 10, 4: 10 };
    }
    if (timesObj && typeof timesObj === 'object') {
      this.gameState.wallpaperStageTimes = { ...this.gameState.wallpaperStageTimes, ...timesObj };
      if (this.gameState.gameMode === 'wallpaper') {
        const elapsed = this.gameState.roundTimer ? this.gameState.roundTimer.elapsed : 0;
        this.gameState.wallpaperState.stage = this.getWallpaperStage(elapsed);
        this.gameState.wallpaperState.points = this.getWallpaperPoints(elapsed);
        if (this.gameState.roundTimer && this.gameState.roundTimer.active) {
          this.gameState.roundTimer.duration = this.getWallpaperTotalDuration();
          this.gameState.roundTimer.remaining = Math.max(0, this.gameState.roundTimer.duration - elapsed);
        }
        if (this.gameState.activePlayer) {
          this.gameState.activePlayer.potentialPoints = this.gameState.wallpaperState.points;
        }
      }
      this.emitState();
      return { success: true, times: this.gameState.wallpaperStageTimes };
    }
    return { success: false };
  }

  // --- HITSTER CHIPS & DISPUTE HELPERS ---
  challengeHitsterChip(userIdOrName, displayName = null, avatarUrl = null) {
    if (this.gameState.gameMode !== 'hitster') return { success: false, error: 'Nicht im Hitster-Modus aktiv.' };

    let player = this.gameState.scores[userIdOrName] ||
      Object.values(this.gameState.scores).find(p => p.username.toLowerCase() === String(userIdOrName).toLowerCase() || p.id === userIdOrName);

    if (!player) {
      player = {
        id: userIdOrName,
        username: displayName || userIdOrName,
        avatar: avatarUrl || '../../App.png',
        points: 0,
        chips: 3,
        correct: 0,
        wrong: 0,
        cards: []
      };
      this.gameState.scores[player.id] = player;
    }

    if (player.chips === undefined) player.chips = 3;

    if (player.chips <= 0) {
      return { success: false, error: `${player.username} hat keine Hitster-Chips mehr!` };
    }

    player.chips = Math.max(0, player.chips - 1);
    const now = new Date();
    const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

    this.gameState.hitsterState.lastChallenge = {
      userId: player.id,
      username: player.username,
      avatar: player.avatar,
      remainingChips: player.chips,
      timeFormatted,
      timestamp: Date.now()
    };

    audioManager.playBuzzer();
    this.gameState.screenFlash = 'yellow';
    setTimeout(() => { this.gameState.screenFlash = null; this.emitState(); }, 1500);

    this.gameState.statusText = `⚔️ **${player.username}** hat als ERSTER den Hitster-Chip geworfen! (Verbleibend: ${player.chips} Chips)`;

    this.emitState();
    this.updateDiscordMessage();
    return { success: true, challenge: this.gameState.hitsterState.lastChallenge };
  }

  adjustPlayerChips(userIdOrName, delta) {
    if (!userIdOrName) return { success: false };
    let player = this.gameState.scores[userIdOrName] ||
      Object.values(this.gameState.scores).find(p => p.username.toLowerCase() === String(userIdOrName).toLowerCase() || p.id === userIdOrName);
    if (!player) {
      player = {
        id: userIdOrName,
        username: userIdOrName,
        avatar: '../../App.png',
        points: 0,
        chips: 3,
        correct: 0,
        wrong: 0,
        cards: []
      };
      this.gameState.scores[player.id] = player;
    }
    if (player.chips === undefined) player.chips = 3;
    player.chips = Math.max(0, player.chips + delta);

    if (!this.gameState.hitsterState.playerShelves) {
      this.gameState.hitsterState.playerShelves = {};
    }
    if (!this.gameState.hitsterState.playerShelves[player.username]) {
      this.gameState.hitsterState.playerShelves[player.username] = { cards: player.cards || [], chips: player.chips };
    } else {
      this.gameState.hitsterState.playerShelves[player.username].chips = player.chips;
    }

    this.emitState();
    return { success: true, chips: player.chips };
  }

  async selectSpecificSong(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: 'Datei nicht gefunden.' };
    }
    const tags = await extractAudioTags(filePath);
    this.gameState.songState = {
      title: tags.title,
      artist: tags.artist,
      fullTitle: tags.fullTitle,
      censoredTitle: tags.censoredTitle,
      revealed: false,
      filePath: tags.filePath,
      isPlaying: true
    };
    audioManager.playSong(filePath);
    this.emitState();
    return { success: true, song: this.gameState.songState };
  }

  async selectSpecificHitster(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: 'Datei nicht gefunden.' };
    }
    const tags = await extractAudioTags(filePath);
    this.gameState.hitsterState.currentCard = {
      title: tags.title,
      artist: tags.artist,
      year: tags.year,
      revealed: false,
      filePath: tags.filePath
    };
    audioManager.playSong(filePath);
    this.emitState();
    return { success: true, card: this.gameState.hitsterState.currentCard };
  }

  selectSpecificWallpaper(titleOrIndex) {
    if (!this.availableWallpaperRounds || this.availableWallpaperRounds.length === 0) {
      return { success: false, error: 'Keine Wallpaper geladen.' };
    }
    let round = null;
    if (typeof titleOrIndex === 'number') {
      round = this.availableWallpaperRounds[titleOrIndex];
    } else {
      round = this.availableWallpaperRounds.find(r => r.movieTitle.toLowerCase() === String(titleOrIndex).toLowerCase()) ||
              this.availableWallpaperRounds.find(r => r.movieTitle.toLowerCase().includes(String(titleOrIndex).toLowerCase()));
    }
    if (round) {
      this.setWallpaperRound(round);
      return { success: true, round: this.gameState.wallpaperState };
    }
    return { success: false, error: 'Wallpaper nicht gefunden.' };
  }

  // --- HITSTER MODE HELPERS ---
  async pickHitsterSong(genre = null) {
    let pool = this.availableMusicFiles;
    if (genre && this.currentMusicFolder) {
      const genrePath = path.join(this.currentMusicFolder, genre);
      pool = this.availableMusicFiles.filter(f => f.startsWith(genrePath));
    }

    if (!pool || pool.length === 0) {
      return { success: false, error: 'Keine Musikdateien geladen. Bitte wähle zuerst einen Ordner mit Musik aus.' };
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    const tags = await extractAudioTags(chosen);

    this.gameState.hitsterState.currentCard = {
      title: tags.title,
      artist: tags.artist,
      year: tags.year !== 'Unbekannt' ? tags.year : '1995',
      revealed: false,
      filePath: chosen
    };

    audioManager.playSong(chosen);
    this.emitState();
    return { success: true, card: this.gameState.hitsterState.currentCard };
  }

  setManualHitsterCard(year, artist, title) {
    this.gameState.hitsterState.currentCard = {
      title: cleanMetadata(title) || 'Unbekannter Song',
      artist: cleanMetadata(artist) || 'Unbekannter Interpret',
      year: String(year || '1990').trim(),
      revealed: false,
      filePath: ''
    };
    this.emitState();
    return { success: true, card: this.gameState.hitsterState.currentCard };
  }

  resolveHitsterCard(targetPlayer = null) {
    const card = this.gameState.hitsterState.currentCard;
    if (!card || !card.year) return { success: false };
    card.revealed = true;
    const year = parseInt(card.year, 10) || 1990;
    const exists = this.gameState.hitsterState.timeline.some(c => c.title === card.title && c.year === card.year);
    if (!exists) {
      this.gameState.hitsterState.timeline.push({
        year,
        title: card.title,
        artist: card.artist || '',
        revealed: true
      });
      this.gameState.hitsterState.timeline.sort((a, b) => a.year - b.year);
    }

    if (targetPlayer) {
      if (!Array.isArray(targetPlayer.cards)) {
        const count = typeof targetPlayer.cards === 'number' ? targetPlayer.cards : 0;
        targetPlayer.cards = [];
        for (let i = 0; i < count; i++) {
          targetPlayer.cards.push({ year: 1970 + i * 5, title: `Karte ${i + 1}`, artist: '' });
        }
      }
      const hasCard = targetPlayer.cards.some(c => c.title === card.title && c.year === year);
      if (!hasCard) {
        targetPlayer.cards.push({ year, title: card.title, artist: card.artist || '' });
        targetPlayer.cards.sort((a, b) => a.year - b.year);
      }
      if (!this.gameState.hitsterState.playerShelves) this.gameState.hitsterState.playerShelves = {};
      this.gameState.hitsterState.playerShelves[targetPlayer.username] = {
        id: targetPlayer.id,
        username: targetPlayer.username,
        avatar: targetPlayer.avatar,
        cards: [...targetPlayer.cards]
      };
      this.checkVictory(targetPlayer);
    }

    this.emitState();
    return { success: true, timeline: this.gameState.hitsterState.timeline };
  }

  // --- DISCORD EMBED SYNC ---
  async updateDiscordMessage() {
    if (!this.gameState.currentMessage) return;
    try {
      let files = [];
      let imageAttachmentName = null;
      // Wallpaper image is stream/in-app exclusive and must NEVER be uploaded to Discord

      const embed = createBuzzerEmbed({
        roundNumber: this.gameState.roundNumber,
        hostId: this.config.hostId,
        hostName: this.hostName,
        isLocked: this.gameState.isLocked,
        activePlayer: this.gameState.activePlayer,
        queue: this.gameState.queue,
        scores: this.gameState.scores,
        statusText: this.gameState.statusText,
        channelPlayerCount: this.gameState.voiceMembers.length,
        gameMode: this.gameState.gameMode,
        wallpaperState: this.gameState.wallpaperState,
        songState: this.gameState.songState,
        hitsterState: this.gameState.hitsterState,
        goal: this.gameState.goal,
        isBoostActive: this.gameState.isBoostActive,
        imageAttachmentName
      });

      const components = createBuzzerComponents(
        this.gameState.isLocked,
        false,
        this.gameState.gameMode,
        this.gameState.isBoostActive,
        this.gameState.goal
      );

      const editOpts = { embeds: [embed], components };
      if (files.length > 0) editOpts.files = files;
      await this.gameState.currentMessage.edit(editOpts);
    } catch (err) {
      console.error('[Bot] Failed to update Discord message:', err.message);
    }
  }

  async endRound() {
    this.stopAnswerCountdown();
    this.stopRoundTimer();
    this.gameState.isRoundActive = false;
    this.gameState.isLocked = true;
    this.gameState.activePlayer = null;
    this.gameState.queue = [];

    if (this.gameState.currentMessage) {
      try {
        const finalEmbed = createFinalGameEndEmbed({
          roundNumber: this.gameState.roundNumber,
          scores: this.gameState.scores,
          hostId: this.config.hostId,
          hostName: this.hostName,
          gameMode: this.gameState.gameMode
        });
        await this.gameState.currentMessage.edit({ embeds: [finalEmbed], components: [] });
      } catch (err) {}
    }

    this.gameState.roundNumber += 1;
    this.gameState.statusText = '🏁 Die Runde wurde beendet!';
    this.emitState();
    return { success: true };
  }

  resetScores() {
    this.stopAnswerCountdown();
    this.gameState.scores = {};
    this.gameState.actionHistory = [];
    this.gameState.roundNumber = 1;
    this.gameState.roundWrongAttempts = {};
    this.gameState.statusText = '🔄 Alle Punkte und Runden wurden zurückgesetzt.';
    this.gameState.winner = null;
    this.gameState.activePlayer = null;
    this.gameState.queue = [];
    this.gameState.isLocked = false;
    this.gameState.isEvaluating = false;
    this.gameState.isBoostActive = false;
    this.gameState.hitsterState.timeline = [];
    this.gameState.hitsterState.playerShelves = {};
    this.gameState.hitsterState.currentCard = {
      title: '',
      artist: '',
      year: '',
      revealed: false,
      filePath: ''
    };
    this.gameState.wallpaperState.resolved = false;
    this.gameState.wallpaperState.stage = 1;
    this.gameState.wallpaperState.points = 4;
    this.gameState.songState.revealed = false;
    this.stopRoundTimer();
    this.updateVoiceMembers();
    this.updateDiscordMessage();
    this.emitState();
    return { success: true };
  }

  // --- PLAYER & SCOREBOARD MANAGEMENT ---
  adjustPlayerScore(playerId, delta) {
    if (!playerId) return { success: false, error: 'Keine Spieler-ID angegeben' };
    if (this.isHost(playerId)) return { success: false, error: 'Der Spielleiter ist kein Mitspieler.' };
    if (!this.gameState.scores[playerId]) {
      this.gameState.scores[playerId] = {
        id: playerId,
        username: 'Spieler',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(playerId)}`,
        points: 0,
        correct: 0,
        wrong: 0
      };
    }
    const oldPoints = this.gameState.scores[playerId].points || 0;
    this.gameState.scores[playerId].points = Math.max(0, oldPoints + delta);

    if (!this.gameState.actionHistory) this.gameState.actionHistory = [];
    this.gameState.actionHistory.push({
      type: 'score_adjust',
      playerId,
      oldPoints,
      delta
    });
    this.gameState.canUndo = true;
    this.checkVictory(this.gameState.scores[playerId]);
    this.emitState();
    return { success: true, score: this.gameState.scores[playerId] };
  }

  setPlayerScore(playerId, newPoints) {
    if (!playerId) return { success: false, error: 'Keine Spieler-ID angegeben' };
    if (this.isHost(playerId)) return { success: false, error: 'Der Spielleiter ist kein Mitspieler.' };
    let player = this.gameState.scores[playerId] ||
      Object.values(this.gameState.scores).find(p => p.username.toLowerCase() === String(playerId).toLowerCase() || p.id === playerId);
    if (!player) {
      player = {
        id: playerId,
        username: String(playerId),
        avatar: '../../App.png',
        points: 0,
        correct: 0,
        wrong: 0
      };
      this.gameState.scores[player.id] = player;
    }
    const oldPoints = player.points || 0;
    player.points = Math.max(0, parseInt(newPoints, 10) || 0);

    if (!this.gameState.actionHistory) this.gameState.actionHistory = [];
    this.gameState.actionHistory.push({
      type: 'score_adjust',
      playerId: player.id,
      oldPoints,
      delta: player.points - oldPoints
    });
    this.gameState.canUndo = true;
    this.checkVictory(player);
    this.emitState();
    return { success: true, score: player };
  }

  addCustomPlayer(username) {
    const cleanName = (username || '').trim() || `Spieler ${Object.keys(this.gameState.scores).length + 1}`;
    const id = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;

    this.gameState.scores[id] = {
      id,
      username: cleanName,
      avatar,
      points: 0,
      correct: 0,
      wrong: 0,
      isCustom: true
    };

    this.emitState();
    return { success: true, player: this.gameState.scores[id] };
  }

  removePlayer(playerId) {
    if (this.gameState.scores[playerId]) {
      delete this.gameState.scores[playerId];
    }
    if (this.gameState.activePlayer && this.gameState.activePlayer.id === playerId) {
      this.gameState.activePlayer = null;
    }
    this.gameState.queue = this.gameState.queue.filter(p => p.id !== playerId);
    this.emitState();
    return { success: true };
  }

  renamePlayer(playerId, newName) {
    const clean = (newName || '').trim();
    if (clean && this.gameState.scores[playerId]) {
      this.gameState.scores[playerId].username = clean;
      if (this.gameState.activePlayer && this.gameState.activePlayer.id === playerId) {
        this.gameState.activePlayer.username = clean;
      }
      this.emitState();
      return { success: true };
    }
    return { success: false, error: 'Ungültiger Name' };
  }

  manualBuzzPlayer(playerId, username = null) {
    const isRegie = playerId === 'host-regie-buzzer';
    if (!isRegie && this.isHost(playerId)) {
      return { success: false, error: 'Der Spielleiter kann nicht mitbuzzern.' };
    }
    if (this.gameState.roundLockedPlayers && this.gameState.roundLockedPlayers[playerId]) {
      return { success: false, error: 'Spieler ist für diese Runde gesperrt.' };
    }

    let player = isRegie ? null : this.gameState.scores[playerId];
    if (!player) {
      const displayName = username || (isRegie ? 'Regie' : 'Spieler');
      player = {
        id: playerId || 'host-regie-buzzer',
        username: displayName,
        avatar: '../../App.png',
        points: 0,
        correct: 0,
        wrong: 0,
        cards: [],
        isCustom: true
      };
      if (!isRegie) {
        this.gameState.scores[player.id] = player;
      }
    }

    audioManager.pauseSong();
    if (this.gameState.songState) {
      this.gameState.songState.isPlaying = false;
    }

    if (this.gameState.roundTimer) {
      this.gameState.roundTimer.paused = true;
    }
    const elapsed = this.gameState.roundTimer ? this.gameState.roundTimer.elapsed : 0;
    let potentialPoints = 3;
    if (this.gameState.gameMode === 'wallpaper') {
      potentialPoints = this.getWallpaperPoints(elapsed);
    } else if (this.gameState.gameMode === 'hitster') {
      potentialPoints = 1;
    }

    this.gameState.activePlayer = {
      id: player.id,
      username: player.username,
      avatar: player.avatar,
      buzzedAt: Date.now(),
      potentialPoints,
      timeOffset: `nach ${elapsed.toFixed(1)}s`
    };
    this.gameState.isLocked = true;
    const boostTag = this.gameState.isBoostActive ? ' [2X BOOST]' : '';
    this.gameState.statusText = `**${player.username}** hat gebuzzert!${boostTag}`;

    audioManager.playSound('buzzer');
    this.startAnswerCountdown(15);

    // Send public announcement to the selected text channel!
    this.sendBuzzAnnouncement({
      userId: player.id && !player.id.startsWith('host-') ? player.id : null,
      username: player.username,
      avatar: player.avatar,
      timeOffset: `nach ${elapsed.toFixed(1)}s`,
      potentialPoints,
      isBoostActive: this.gameState.isBoostActive,
      gameMode: this.gameState.gameMode
    });

    this.emitState();
    this.updateDiscordMessage();
    return { success: true, player: this.gameState.activePlayer };
  }

  banPlayer(playerId, username) {
    if (!this.gameState.bannedPlayers) this.gameState.bannedPlayers = {};
    this.gameState.bannedPlayers[playerId] = {
      id: playerId,
      username: username || 'Unbekannt',
      bannedAt: Date.now()
    };
    if (this.gameState.activePlayer && this.gameState.activePlayer.id === playerId) {
      this.gameState.activePlayer = null;
    }
    this.gameState.queue = this.gameState.queue.filter(p => p.id !== playerId);
    this.emitState();
    return { success: true };
  }

  unbanPlayer(playerId) {
    if (this.gameState.bannedPlayers && this.gameState.bannedPlayers[playerId]) {
      delete this.gameState.bannedPlayers[playerId];
    }
    this.emitState();
    return { success: true };
  }

  selectQueuePlayer(playerId) {
    const idx = this.gameState.queue.findIndex(p => p.id === playerId);
    if (idx !== -1) {
      const player = this.gameState.queue.splice(idx, 1)[0];
      this.gameState.activePlayer = player;
      this.startAnswerCountdown(15);
      this.emitState();
      return { success: true, player };
    }
    return { success: false, error: 'Spieler nicht in Queue' };
  }

  undoLastAction() {
    if (!this.gameState.actionHistory || this.gameState.actionHistory.length === 0) {
      return { success: false, error: 'Keine Aktionen zum Rückgängigmachen' };
    }
    const last = this.gameState.actionHistory.pop();
    if (last.type === 'score_adjust' && this.gameState.scores[last.playerId]) {
      this.gameState.scores[last.playerId].points = last.oldPoints;
    }
    this.gameState.canUndo = this.gameState.actionHistory.length > 0;
    this.emitState();
    return { success: true };
  }

  playTestSound(type) {
    try {
      if (audioManager) {
        audioManager.playSound(type);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  placeHitsterCard(targetSlot, targetPlayerIdOrName = null) {
    const card = this.gameState.hitsterState.currentCard;
    if (!card || !card.year) return { success: false, error: 'Keine aktive Hitster-Karte' };

    const year = parseInt(card.year, 10);
    const timeline = this.gameState.hitsterState.timeline || [];

    const prevYear = targetSlot > 0 ? timeline[targetSlot - 1].year : -Infinity;
    const nextYear = targetSlot < timeline.length ? timeline[targetSlot].year : Infinity;

    const isCorrect = year >= prevYear && year <= nextYear;

    // Resolve target player
    let targetPlayer = null;
    if (targetPlayerIdOrName) {
      targetPlayer = this.gameState.scores[targetPlayerIdOrName] ||
        Object.values(this.gameState.scores).find(p => p.username.toLowerCase() === String(targetPlayerIdOrName).toLowerCase() || p.id === targetPlayerIdOrName);
    }
    if (!targetPlayer && this.gameState.activePlayer) {
      targetPlayer = this.gameState.scores[this.gameState.activePlayer.id];
    }
    if (!targetPlayer && Object.keys(this.gameState.scores).length > 0) {
      targetPlayer = Object.values(this.gameState.scores)[0];
    }
    if (!targetPlayer) {
      const defName = typeof targetPlayerIdOrName === 'string' && targetPlayerIdOrName ? targetPlayerIdOrName : 'Spieler 1';
      targetPlayer = {
        id: `hitster_p_${Date.now()}`,
        username: defName,
        avatar: '../../App.png',
        points: 0,
        chips: 3,
        correct: 0,
        wrong: 0,
        cards: []
      };
      this.gameState.scores[targetPlayer.id] = targetPlayer;
    }

    if (targetPlayer.chips === undefined) targetPlayer.chips = 3;

    if (!Array.isArray(targetPlayer.cards)) {
      const count = typeof targetPlayer.cards === 'number' ? targetPlayer.cards : 0;
      targetPlayer.cards = [];
      for (let i = 0; i < count; i++) {
        targetPlayer.cards.push({ year: 1970 + i * 5, title: `Karte ${i + 1}`, artist: '' });
      }
    }
    if (!this.gameState.hitsterState.playerShelves) this.gameState.hitsterState.playerShelves = {};
    if (!this.gameState.hitsterState.playerShelves[targetPlayer.username]) {
      this.gameState.hitsterState.playerShelves[targetPlayer.username] = {
        id: targetPlayer.id,
        username: targetPlayer.username,
        avatar: targetPlayer.avatar,
        chips: targetPlayer.chips,
        cards: []
      };
    } else {
      this.gameState.hitsterState.playerShelves[targetPlayer.username].chips = targetPlayer.chips;
    }

    if (isCorrect) {
      card.revealed = true;
      timeline.splice(targetSlot, 0, {
        year,
        title: card.title,
        artist: card.artist || '',
        revealed: true
      });
      timeline.sort((a, b) => a.year - b.year);
      this.gameState.hitsterState.timeline = timeline;

      let ptsGain = 1;
      let wasBoosted = false;
      if (this.gameState.isBoostActive) {
        ptsGain = 2;
        wasBoosted = true;
        this.gameState.isBoostActive = false;
      }

      targetPlayer.points += ptsGain;
      targetPlayer.correct = (targetPlayer.correct || 0) + 1;
      
      const newCardItem = { year, title: card.title, artist: card.artist || '' };
      targetPlayer.cards.push(newCardItem);
      targetPlayer.cards.sort((a, b) => a.year - b.year);
      this.gameState.hitsterState.playerShelves[targetPlayer.username].cards = [...targetPlayer.cards];

      this.gameState.screenFlash = 'green';
      setTimeout(() => { this.gameState.screenFlash = null; this.emitState(); }, 1500);
      audioManager.playCorrect();
      const boostBadge = wasBoosted ? ' [2X BOOST!]' : '';
      this.gameState.statusText = `Richtig! **${card.title}** erschien **${year}**! (${targetPlayer.username}: +${ptsGain} Karte/Pkt${boostBadge})`;

      this.checkVictory(targetPlayer);
    } else {
      this.gameState.screenFlash = 'red';
      setTimeout(() => { this.gameState.screenFlash = null; this.emitState(); }, 1500);
      audioManager.playWrong();
      this.gameState.statusText = `Falsch platziert! **${card.title}** erschien im Jahr **${year}**.`;
    }

    this.emitState();
    this.updateDiscordMessage();
    return { success: true, correct: isCorrect, year, timeline, player: targetPlayer };
  }

  getState() {
    return {
      ...this.gameState,
      config: {
        hostId: this.config.hostId,
        guildId: this.config.guildId,
        textChannelId: this.config.textChannelId,
        voiceChannelId: this.config.voiceChannelId,
        points: this.config.points
      }
    };
  }

  emitState() {
    this.emit('game-state', this.getState());
  }
}

module.exports = new BotManager();
