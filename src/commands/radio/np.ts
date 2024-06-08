import { EmbedBuilder, resolveColor } from "discord.js";
import { Command } from "../../def";
import { currentSong, currentStartedAt, currentTime, submitters } from "../../handlers/sync";
import { createStatusEmbed } from "../../lib/embeds";
import probeDuration from "../../lib/probeDuration";

const durationCache: Map<string, number> = new Map();

export default new Command({
  name: "np",
  description: "Now playing",
  async handler(interaction) {
    const song = currentSong.value;
    if (!song)
      return void interaction.editReply({
        embeds: [
          createStatusEmbed({
            type: "error",
            description: "The bot hasn't started streaming yet.",
          }),
        ],
      });

    const quotes = submitters.get(song.submitter)!.quotes;
    const embed = new EmbedBuilder({
      author: {
        name: song.artist,
      },
      title: song.name,
      url: song.sourceUrl,
      color: resolveColor("Green"),
    });

    if (song.artUrl) embed.setThumbnail(song.artUrl);

    if (quotes?.length)
      embed.setFooter({
        text: `"${quotes[~~(Math.random() * quotes.length)]}"`,
      });

    if (song.album)
      embed.addFields({
        name: "Album",
        value: song.album,
        inline: true,
      });

    embed.addFields({
      name: "Submitter",
      value: song.submitter,
      inline: true,
    });

    const at = currentTime() - (currentStartedAt.value ?? 0);
    const duration = durationCache.get(song.dlUrl) ?? durationCache.set(song.dlUrl, await probeDuration(song.dlUrl)).get(song.dlUrl)!;
    const bar = `\`[${"=".repeat(at / duration * 24).padEnd(24)}]\``;
    embed.addFields({
      name: "Progress",
      value: bar,
    });

    await interaction.editReply({
      embeds: [embed],
    });
  },
});
