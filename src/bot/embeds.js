const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function formatDiscordLeaderboard(scores) {
  const sorted = Object.values(scores || {}).sort((a, b) => b.points - a.points);
  if (sorted.length === 0) return '*Noch keine Punkte vergeben.*';

  return sorted.map((p, idx) => {
    let rankBadge = `\`#${(idx + 1).toString().padStart(2, '0')}\``;
    if (idx === 0) rankBadge = '🥇 **1.**';
    else if (idx === 1) rankBadge = '🥈 **2.**';
    else if (idx === 2) rankBadge = '🥉 **3.**';

    const pName = p.username.length > 18 ? p.username.substring(0, 16) + '..' : p.username;
    const pts = p.points >= 0 ? `+${p.points}` : `${p.points}`;
    
    return `${rankBadge} **${pName}** ➔ **\`${pts} Pkt\`** *(✅ ${p.correct || 0} | ❌ ${p.wrong || 0})*`;
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
    channelPlayerCount = 0
  } = state;

  const hostDisplay = hostId 
    ? (hostName ? `<@${hostId}> \`(${hostName})\`` : `<@${hostId}>`)
    : '`Manni`';

  const embed = new EmbedBuilder()
    .setColor(isLocked ? 0xef4444 : (activePlayer ? 0xf59e0b : 0x10b981))
    .setTitle(`🎮 MANNISBOX — RUNDE ${roundNumber}`)
    .setDescription(
      `**👑 Spielleiter:** ${hostDisplay}\n` +
      `**👥 Mitspieler im Voice:** \`${channelPlayerCount} Spieler\`\n` +
      `**⚡ Status:** ${isLocked ? '🔒 **Buzzer gesperrt**' : (activePlayer ? `🎯 **${activePlayer.username} ist am Zug!**` : '🟢 **Buzzer ist FREIGEGEBEN!**')}\n\n` +
      `> *${statusText}*`
    );

  // Active Player & Queue
  if (activePlayer) {
    embed.addFields({
      name: '🎤 Aktuell an der Reihe',
      value: `👑 **${activePlayer.username}** \`(${activePlayer.timeOffset || '1. Platz'})\``,
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
    name: '🏆 Live-Rangliste',
    value: formatDiscordLeaderboard(scores),
    inline: false
  });

  embed.setFooter({
    text: 'MannisBox v1.1.0 • Richtig +3 | 100% Perfekt +4 | Falsch -1 (Folgefehler -2)'
  });
  embed.setTimestamp();

  return embed;
}

function createBuzzerComponents(isLocked = false, isRoundEnded = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('mannisbox_buzzer')
      .setLabel(isRoundEnded ? '🏁 RUNDE BEENDET' : (isLocked ? '🔒 BUZZER GESPERRT' : '🔔 BUZZER DRÜCKEN!'))
      .setStyle(isRoundEnded ? ButtonStyle.Secondary : (isLocked ? ButtonStyle.Danger : ButtonStyle.Success))
      .setDisabled(isLocked || isRoundEnded)
  );

  return [row];
}

function createFinalGameEndEmbed(state) {
  const {
    roundNumber = 1,
    scores = {},
    hostId = '',
    hostName = '',
    totalRounds = 1
  } = state;

  const sortedScores = Object.values(scores || {}).sort((a, b) => b.points - a.points);
  const winner = sortedScores[0];
  const second = sortedScores[1];
  const third = sortedScores[2];

  let podiumText = '';
  if (winner) {
    podiumText += `🥇 **1. PLATZ — DER CHAMPION:** **${winner.username}** mit **${winner.points} Punkten**! 🏆🎉\n`;
  }
  if (second) {
    podiumText += `🥈 **2. PLATZ:** **${second.username}** mit **${second.points} Punkten** 👏\n`;
  }
  if (third) {
    podiumText += `🥉 **3. PLATZ:** **${third.username}** mit **${third.points} Punkten** ⭐\n`;
  }

  let fullRanking = sortedScores.map((p, idx) => {
    let rankBadge = `\`#${(idx + 1).toString().padStart(2, '0')}\``;
    if (idx === 0) rankBadge = '🥇';
    else if (idx === 1) rankBadge = '🥈';
    else if (idx === 2) rankBadge = '🥉';

    const pts = p.points >= 0 ? `+${p.points}` : `${p.points}`;
    return `${rankBadge} **${p.username}** ➔ **\`${pts} Punkte\`** *(✅ ${p.correct || 0} Richtig | ❌ ${p.wrong || 0} Falsch)*`;
  }).join('\n');

  if (!fullRanking) fullRanking = '*Keine Punkte in diesem Spiel vergeben.*';

  const hostDisplay = hostId ? (hostName ? `<@${hostId}> \`(${hostName})\`` : `<@${hostId}>`) : '`Manni`';

  const embed = new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle('🏆 MANNISBOX — ENDGÜLTIGES QUIZ-RANKING 🏆')
    .setDescription(
      `Das SongQuiz ist offiziell beendet!\n` +
      `**👑 Spielleiter:** ${hostDisplay}\n` +
      `**📊 Gespielte Runden:** \`${roundNumber}\`\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      (podiumText ? `${podiumText}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` : '')
    )
    .addFields({
      name: '📜 Vollständige Rangliste (Platz 1 - X)',
      value: fullRanking,
      inline: false
    })
    .setFooter({ text: 'MannisBox v1.1.0 • Danke fürs Mitspielen! 🎵' })
    .setTimestamp();

  return embed;
}

module.exports = {
  createBuzzerEmbed,
  createBuzzerComponents,
  createFinalGameEndEmbed
};
