const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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
      `**👑 Spielleiter (Host):** ${hostDisplay}\n` +
      `**⚡ Status:** ${isLocked ? '🔴 **Buzzer gesperrt**' : (activePlayer ? `🟡 **${activePlayer.username} antwortet gerade!**` : '🟢 **Buzzer ist BEREIT!**')}\n\n` +
      `> *${statusText}*`
    );

  // Active Player & Queue
  if (activePlayer) {
    embed.addFields({
      name: '🎯 Aktuell am Zug',
      value: `👑 **${activePlayer.username}** (Reaktionszeit: ${activePlayer.timeOffset || '1. Platz'})`,
      inline: false
    });
  }

  if (queue && queue.length > 0) {
    const queueList = queue
      .slice(0, 5)
      .map((p, idx) => `\`#${idx + 2}\` **${p.username}** (${p.timeOffset || '+0s'})`)
      .join('\n');

    embed.addFields({
      name: `⏳ Warteschlange (${queue.length})`,
      value: queueList || '*Keine weiteren Spieler in der Queue*',
      inline: false
    });
  }

  // Live Scoreboard
  const sortedScores = Object.values(scores || {}).sort((a, b) => b.points - a.points);
  let scoreboardText = '*Noch keine Punkte verteilt.*';
  if (sortedScores.length > 0) {
    scoreboardText = sortedScores
      .slice(0, 10)
      .map((p, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `\`${idx + 1}.\``;
        return `${medal} **${p.username}**: **${p.points} Pkt.** *(✅ ${p.correct || 0} | ❌ ${p.wrong || 0})*`;
      })
      .join('\n');
  }

  embed.addFields({
    name: '🏆 Live-Punktestand',
    value: scoreboardText,
    inline: false
  });

  embed.setFooter({
    text: 'MannisBox • Punkte: Richtig +3 | 100% Perfekt +4 | Falsch -1 (Folgefehler -2)'
  });
  embed.setTimestamp();

  return embed;
}

function createBuzzerComponents(isLocked = false, isRoundEnded = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('mannisbox_buzzer')
      .setLabel(isRoundEnded ? 'RUNDE BEENDET' : (isLocked ? 'BUZZER GESPERRT' : '🔔 BUZZER DRÜCKEN!'))
      .setStyle(isRoundEnded ? ButtonStyle.Secondary : (isLocked ? ButtonStyle.Danger : ButtonStyle.Success))
      .setDisabled(isLocked || isRoundEnded)
  );

  return [row];
}

function createRoundEndedEmbed(state) {
  const { roundNumber = 1, scores = {}, winner = null } = state;
  const sortedScores = Object.values(scores || {}).sort((a, b) => b.points - a.points);

  let scoreboardText = '*Keine Punkte in dieser Runde.*';
  if (sortedScores.length > 0) {
    scoreboardText = sortedScores
      .map((p, idx) => {
        const medal = idx === 0 ? '🏆 1.' : idx === 1 ? '🥈 2.' : idx === 2 ? '🥉 3.' : `\`${idx + 1}.\``;
        return `${medal} **${p.username}** — **${p.points} Punkte**`;
      })
      .join('\n');
  }

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
      value: scoreboardText,
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
