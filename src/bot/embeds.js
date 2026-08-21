const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function formatDiscordLeaderboard(scores) {
  const sorted = Object.values(scores || {}).sort((a, b) => b.points - a.points);
  if (sorted.length === 0) return '*Noch keine Punkte in dieser Runde vergeben.*';

  return sorted.slice(0, 10).map((p, idx) => {
    let medal = `\`#${(idx + 1).toString().padStart(2, '0')}\``;
    if (idx === 0) medal = '🥇 **1.**';
    else if (idx === 1) medal = '🥈 **2.**';
    else if (idx === 2) medal = '🥉 **3.**';

    const pName = p.username.length > 16 ? p.username.substring(0, 14) + '..' : p.username;
    const pts = p.points >= 0 ? `+${p.points}` : `${p.points}`;
    
    return `${medal} **${pName}** ➔ **\`${pts} Pkt\`** *(✅ ${p.correct || 0} | ❌ ${p.wrong || 0})*`;
  }).join('\n');
}

function createBuzzerEmbed(state) {
  const {
    roundNumber = 1,
    hostId = '327863089796087809',
    hostTag = '',
    isLocked = false,
    activePlayer = null,
    queue = [],
    scores = {},
    statusText = 'Drücke den Buzzer, wenn du die Antwort kennst!'
  } = state;

  const hostDisplay = hostId ? `<@${hostId}>` : (hostTag || 'Manni');

  const embed = new EmbedBuilder()
    .setColor(isLocked ? 0xef4444 : (activePlayer ? 0xf59e0b : 0x10b981))
    .setTitle(`🎮 MANNISBOX — RUNDE ${roundNumber}`)
    .setDescription(
      `**👑 Spielleiter:** ${hostDisplay}\n` +
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
    text: 'MannisBox • Richtig +3 | 100% Perfekt +4 | Falsch -1 (Folgefehler -2)'
  });
  embed.setTimestamp();

  return embed;
}

function createBuzzerComponents(isLocked = false, isRoundEnded = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('mannisbox_buzzer')
      .setLabel(isRoundEnded ? 'RUNDE BEENDET' : (isLocked ? '🔒 BUZZER GESPERRT' : '🔔 BUZZER DRÜCKEN!'))
      .setStyle(isRoundEnded ? ButtonStyle.Secondary : (isLocked ? ButtonStyle.Danger : ButtonStyle.Success))
      .setDisabled(isLocked || isRoundEnded)
  );

  return [row];
}

function createRoundEndedEmbed(state) {
  const { roundNumber = 1, scores = {}, winner = null } = state;
  const sortedScores = Object.values(scores || {}).sort((a, b) => b.points - a.points);

  const embed = new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setTitle(`🏁 RUNDE ${roundNumber} BEENDET!`)
    .setDescription(
      winner 
        ? `🎉 **Rundensieger:** **${winner.username}**!\n\n`
        : `Die Runde wurde beendet.\n\n`
    )
    .addFields({
      name: '📊 Endstand dieser Runde',
      value: formatDiscordLeaderboard(scores),
      inline: false
    })
    .setFooter({ text: 'MannisBox • Bereit für die nächste Runde!' })
    .setTimestamp();

  return embed;
}

module.exports = {
  createBuzzerEmbed,
  createBuzzerComponents,
  createRoundEndedEmbed
};
