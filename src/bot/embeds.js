const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function createProgressBar(current, goal) {
  const target = Math.max(1, goal || 50);
  const ratio = Math.min(1, Math.max(0, current / target));
  const percent = Math.round(ratio * 100);
  const totalBars = 10;
  const filled = Math.min(totalBars, Math.round(ratio * totalBars));
  const empty = totalBars - filled;
  return `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent}%\``;
}

function formatDiscordLeaderboard(scores, goal = 50, gameMode = 'song') {
  const isHitster = gameMode === 'hitster';
  const targetGoal = Math.max(1, goal || (isHitster ? 10 : 50));
  const sorted = Object.values(scores || {}).sort((a, b) => {
    if (isHitster) {
      const aCards = (a.cards && Array.isArray(a.cards)) ? a.cards.length : (typeof a.cards === 'number' ? a.cards : (a.points || 0));
      const bCards = (b.cards && Array.isArray(b.cards)) ? b.cards.length : (typeof b.cards === 'number' ? b.cards : (b.points || 0));
      return bCards - aCards;
    }
    return (b.points || 0) - (a.points || 0);
  });
  if (sorted.length === 0) return isHitster ? '*Noch keine Karten vergeben.*' : '*Noch keine Punkte vergeben.*';

  return sorted.map((p, idx) => {
    let rankBadge = `\`#${(idx + 1).toString().padStart(2, '0')}\``;
    if (idx === 0) rankBadge = '🥇 **1.**';
    else if (idx === 1) rankBadge = '🥈 **2.**';
    else if (idx === 2) rankBadge = '🥉 **3.**';

    const pName = p.username.length > 18 ? p.username.substring(0, 16) + '..' : p.username;
    if (isHitster) {
      const cardCount = (p.cards && Array.isArray(p.cards)) ? p.cards.length : (typeof p.cards === 'number' ? p.cards : (p.points || 0));
      const pBar = createProgressBar(cardCount, targetGoal);
      return `${rankBadge} **${pName}** ➔ **\`${cardCount} / ${targetGoal} Karten\`** ${pBar} *(✅ ${p.correct || 0} | ❌ ${p.wrong || 0})*`;
    } else {
      const pts = p.points >= 0 ? `+${p.points}` : `${p.points}`;
      const pBar = createProgressBar(p.points, targetGoal);
      return `${rankBadge} **${pName}** ➔ **\`${pts} Pkt\`** ${pBar} *(✅ ${p.correct || 0} | ❌ ${p.wrong || 0})*`;
    }
  }).join('\n');
}

function createBuzzerEmbed(state) {
  const {
    roundNumber = 1,
    hostId = '327863089796087809',
    hostName = '',
    isLocked = false,
    activePlayer = null,
    queue = [],
    scores = {},
    statusText = 'Drücke den Buzzer, wenn du die Antwort kennst!',
    channelPlayerCount = 0,
    gameMode = 'song',
    wallpaperState = null,
    songState = null,
    hitsterState = null,
    goal = 50,
    isBoostActive = false,
    imageAttachmentName = null
  } = state;

  const hostDisplay = hostId 
    ? (hostName ? `<@${hostId}> \`(${hostName})\`` : `<@${hostId}>`)
    : '`Manni`';

  let title = `🎮 MANNISBOX — RUNDE ${roundNumber}`;
  let footerText = `MannisBox Stream Master • Ziel: ${goal} Punkte • /goal & /boost`;
  let embedColor = isLocked ? 0xef4444 : (activePlayer ? 0xf59e0b : 0x10b981);

  if (isBoostActive) {
    embedColor = 0xff5500; // Glowing fire orange for boost
  }

  if (gameMode === 'wallpaper') {
    title = `🎬 FILME / WALLPAPER ERKENNEN — RUNDE ${roundNumber}`;
    footerText = `MannisBox Cinema • <10s: 50 Pkt | <20s: 35 Pkt | <30s: 25 Pkt | <40s: 15 Pkt • Ziel: ${goal} Pkt`;
  } else if (gameMode === 'hitster') {
    title = `📻 HITSTER ZEITSTRAHL — RUNDE ${roundNumber}`;
    footerText = `MannisBox Hitster • Wer erreicht zuerst ${goal} Karten? • /goal & /boost`;
  } else {
    title = `🎵 ERKENNST DU DEN SONG? — RUNDE ${roundNumber}`;
    footerText = `MannisBox Song Quiz • Ziel: ${goal} Punkte • /goal & /boost`;
  }

  let description = `**👑 Spielleiter:** ${hostDisplay}\n` +
    `**👥 Mitspieler im Voice:** \`${channelPlayerCount} Spieler\`\n` +
    `**🎯 Spielziel:** \`${goal} ${gameMode === 'hitster' ? 'Karten' : 'Punkte'}\`\n` +
    `**⚡ Status:** ${isLocked ? '🔒 **Buzzer gesperrt**' : (activePlayer ? `🎯 **${activePlayer.username} ist am Zug!**` : '🟢 **Buzzer ist FREIGEGEBEN!**')}\n`;

  if (isBoostActive) {
    description += `\n🔥 **BOOST-RUNDE AKTIV!** 🔥\n> *Alle vergebenen Punkte für den nächsten Treffer zählen DOPPELT (2x)!*\n`;
  }

  description += `\n> *${statusText}*`;

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(title)
    .setDescription(description);

  // Extra Mode Details
  if (gameMode === 'wallpaper' && wallpaperState) {
    const pts = isBoostActive ? ((wallpaperState.points || 50) * 2) : (wallpaperState.points || 50);
    embed.addFields({
      name: '🖼️ Aktuelle Schärfe-Stufe',
      value: `**Stufe ${wallpaperState.stage || 1}** (${pts} Punkte erreichbar${isBoostActive ? ' 🔥 BOOST' : ''})\n*Bild schärft sich live im Stream!*`,
      inline: false
    });
  } else if (gameMode === 'song' && songState) {
    const displayTitle = songState.revealed ? songState.fullTitle : (songState.censoredTitle || '████████ - ████████');
    embed.addFields({
      name: songState.revealed ? '🎉 Song Aufgelöst' : '🎶 Aktueller Track',
      value: `\`${displayTitle}\``,
      inline: false
    });
  } else if (gameMode === 'hitster' && hitsterState && hitsterState.currentCard) {
    const card = hitsterState.currentCard;
    const yearDisplay = card.revealed ? `🎉 **${card.year}**` : '`???? (Geheim)`';
    embed.addFields({
      name: '📻 Aktuelle Hitster-Karte',
      value: `**${card.artist || 'Unbekannt'}** — **${card.title || 'Track'}**\n📅 Erscheinungsjahr: ${yearDisplay}`,
      inline: false
    });
    if (hitsterState.timeline && hitsterState.timeline.length > 0) {
      const timelineStr = hitsterState.timeline.map(c => `\`[${c.year}]\` ${c.title}`).join(' ➔ ');
      embed.addFields({
        name: '⏱️ Zeitstrahl bisher',
        value: timelineStr,
        inline: false
      });
    }
    if (hitsterState.lastChallenge) {
      embed.addFields({
        name: '⚔️ CHIP-ANFECHTUNG!',
        value: `⚔️ **${hitsterState.lastChallenge.username}** hat als ERSTER den Chip geworfen! \`(${hitsterState.lastChallenge.timeFormatted})\`\nVerbleibend: **${hitsterState.lastChallenge.remainingChips} Chips**`,
        inline: false
      });
    }
  }

  // Active Player & Queue
  if (activePlayer) {
    let ptsNum = activePlayer.potentialPoints || (gameMode === 'wallpaper' ? 4 : 3);
    if (isBoostActive) ptsNum *= 2;
    const ptsTag = ` (${ptsNum} Pkt möglich${isBoostActive ? ' 🔥 2x' : ''})`;
    embed.addFields({
      name: '🎤 Aktuell an der Reihe',
      value: `👑 **${activePlayer.username}** \`(${activePlayer.timeOffset || '1. Platz'})\`${ptsTag}`,
      inline: false
    });
  }

  if (queue && queue.length > 0) {
    const queueList = queue
      .slice(0, 5)
      .map((p, idx) => `\`#${idx + 2}\` **${p.username}** \`(${p.timeOffset || '+0s'})\``)
      .join('\n');

    embed.addFields({
      name: `⏳ Warteschlange (${queue.length})`,
      value: queueList || '*Keine weiteren Spieler*',
      inline: false
    });
  }

  // Live Scoreboard
  embed.addFields({
    name: `🏆 Live-Rangliste (Ziel: ${goal} ${gameMode === 'hitster' ? 'Karten' : 'Punkte'})`,
    value: formatDiscordLeaderboard(scores, goal, gameMode),
    inline: false
  });

  if (imageAttachmentName) {
    embed.setImage(`attachment://${imageAttachmentName}`);
  }

  embed.setFooter({ text: footerText });
  embed.setTimestamp();

  return embed;
}

function createBuzzerComponents(isLocked = false, isRoundEnded = false, gameMode = 'song', isBoostActive = false, goal = 50) {
  let label = '🔔 BUZZER DRÜCKEN!';
  if (isRoundEnded) label = '🏁 RUNDE BEENDET';
  else if (isLocked) label = '🔒 BUZZER GESPERRT';
  else if (gameMode === 'wallpaper') label = '🚨 BUZZER! (FILM ERKANNT)';
  else if (gameMode === 'hitster') label = '📻 BUZZER! (ICH WEISS DAS JAHR)';
  else if (gameMode === 'song') label = '🎵 BUZZER! (SONG ERKANNT)';

  if (isBoostActive && !isLocked && !isRoundEnded) {
    label = `🔥 ${label} (2X BOOST!)`;
  }

  const buzzerBtn = new ButtonBuilder()
    .setCustomId('mannisbox_buzzer')
    .setLabel(label)
    .setStyle(isRoundEnded ? ButtonStyle.Secondary : (isLocked ? ButtonStyle.Danger : (isBoostActive ? ButtonStyle.Danger : ButtonStyle.Success)))
    .setDisabled(isLocked || isRoundEnded);

  const row1Components = [buzzerBtn];
  if (gameMode === 'hitster') {
    row1Components.push(
      new ButtonBuilder()
        .setCustomId('mannisbox_hitster_chip')
        .setLabel('Chip werfen (Anfechten)')
        .setEmoji('⚔️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(isRoundEnded)
    );
  }

  const row1 = new ActionRowBuilder().addComponents(...row1Components);

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('mannisbox_boost')
      .setLabel(isBoostActive ? '🔥 2X BOOST: AKTIV!' : '🔥 2x Boost')
      .setStyle(isBoostActive ? ButtonStyle.Danger : ButtonStyle.Secondary)
      .setDisabled(isRoundEnded),
    new ButtonBuilder()
      .setCustomId('mannisbox_goal')
      .setLabel(`🎯 Ziel: ${goal}`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('mannisbox_score')
      .setLabel('📊 Rangliste')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

function createVictoryEmbed(winner, state = {}) {
  const {
    roundNumber = 1,
    scores = {},
    gameMode = 'song',
    goal = 50
  } = state;

  let modeLabel = 'Song Quiz';
  if (gameMode === 'wallpaper') modeLabel = 'Filme & Wallpaper Quiz';
  else if (gameMode === 'hitster') modeLabel = 'Hitster Zeitstrahl';

  const isHitster = gameMode === 'hitster';
  const scoreDisplay = isHitster 
    ? `${(winner.cards && Array.isArray(winner.cards)) ? winner.cards.length : (winner.cards || winner.points || 0)} Karten`
    : `${winner.points || 0} Punkte`;

  const embed = new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle(`👑 CHAMPION GEKÜRT! VICTORY IN DER MANNISBOX! 🏆`)
    .setDescription(
      `🎉 **Herzlichen Glückwunsch an <@${winner.id || winner.username}>!**\n\n` +
      `Mit unglaublichen **${scoreDisplay}** wurde das Spielziel von **${goal} ${isHitster ? 'Karten' : 'Punkten'}** in Runde ${roundNumber} erreicht!\n` +
      `Modus: **${modeLabel}**`
    )
    .setThumbnail(winner.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png')
    .addFields(
      {
        name: '🥇 ULTIMATIVER CHAMPION',
        value: `👑 **${winner.username}** — **${scoreDisplay}** *(✅ ${winner.correct || 0} Treffer)*`,
        inline: false
      },
      {
        name: '📊 Abschließende Rangliste',
        value: formatDiscordLeaderboard(scores, goal, gameMode),
        inline: false
      }
    )
    .setFooter({ text: 'MannisBox • Der offizielle Champion steht fest!' })
    .setTimestamp();

  return embed;
}

function createFinalGameEndEmbed(state) {
  const {
    roundNumber = 1,
    scores = {},
    hostId = '',
    hostName = '',
    gameMode = 'song',
    goal = 50
  } = state;

  const sorted = Object.values(scores || {}).sort((a, b) => b.points - a.points);
  const p1 = sorted[0];
  const p2 = sorted[1];
  const p3 = sorted[2];

  let modeLabel = 'Song Quiz';
  if (gameMode === 'wallpaper') modeLabel = 'Filme / Wallpaper Quiz';
  else if (gameMode === 'hitster') modeLabel = 'Hitster Zeitstrahl';

  const embed = new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle(`🏆 MANNISBOX — ENDSTAND NACH ${roundNumber} RUNDEN!`)
    .setDescription(`Spielmodus: **${modeLabel}**\nDanke an alle fürs Mitspielen! Hier ist das offizielle Endergebnis:`);

  if (p1) {
    embed.addFields({
      name: '🥇 1. PLATZ — CHAMPION',
      value: `👑 **${p1.username}** mit stolzen **${p1.points} Punkten**!`,
      inline: false
    });
  }
  if (p2) {
    embed.addFields({
      name: '🥈 2. Platz',
      value: `⭐ **${p2.username}** mit **${p2.points} Punkten**`,
      inline: true
    });
  }
  if (p3) {
    embed.addFields({
      name: '🥉 3. Platz',
      value: `🌟 **${p3.username}** mit **${p3.points} Punkten**`,
      inline: true
    });
  }

  embed.addFields({
    name: '📊 Vollständige Rangliste',
    value: formatDiscordLeaderboard(scores, goal, gameMode),
    inline: false
  });

  embed.setFooter({ text: 'MannisBox • Entwickelt für ThisManniGuy' });
  embed.setTimestamp();
  return embed;
}

function createHelpEmbed(state = {}) {
  const embed = new EmbedBuilder()
    .setColor(0x6366f1)
    .setTitle('📖 MANNISBOX SPIELANLEITUNG & BEFEHLE')
    .setDescription(
      `**Willkommen in MannisBox!** Hier sind alle Spielmodi und Befehle:\n\n` +
      `**🎮 SPIELMODI:**\n` +
      `• **🎵 Erkennst du den Song:** Höre Musik-Snippets und buzzere als Erster. (Richtig: +3 Pkt, 100% Song+Interpret: +4 Pkt).\n` +
      `• **📻 Hitster Zeitstrahl:** Ordne gespielte Songs chronologisch in den Zeitstrahl ein. Ziel sind 10 Karten für den Sieg!\n` +
      `• **🎬 Filme & Wallpaper:** Das Filmbild schärft sich alle 10 Sekunden! (<10s: 50 Pkt, <20s: 35 Pkt, <30s: 25 Pkt, <40s: 15 Pkt).\n\n` +
      `**⚡ BEFEHLE & FUNKTIONEN:**\n` +
      `• \`/buzzer\` oder \`!buzzer\`: Buzzere direkt per Chat-Befehl!\n` +
      `• \`/goal [ziel]\` oder \`!goal [ziel]\`: Zeigt oder setzt das Spielziel (z.B. \`/goal 50\`).\n` +
      `• \`/boost\` oder \`!boost\`: Aktiviert 2x Punkte für den nächsten Treffer!\n` +
      `• \`/score\` oder \`!score\`: Zeigt die aktuelle Live-Rangliste an.\n` +
      `• \`/help\` oder \`!help\`: Zeigt diese Hilfe an.`
    )
    .setFooter({ text: 'MannisBox • Discord Buzzer & Stream Master' })
    .setTimestamp();

  return embed;
}

module.exports = {
  createProgressBar,
  formatDiscordLeaderboard,
  createBuzzerEmbed,
  createBuzzerComponents,
  createVictoryEmbed,
  createFinalGameEndEmbed,
  createHelpEmbed
};
