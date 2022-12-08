import { EmbedBuilder, resolveColor } from "discord.js";
import { Command } from "../../def";
import { currentSong, currentStartedAt, currentTime, submitters } from "../../handlers/sync";
import { createStatusEmbed } from "../../lib/embeds";

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
        name: song.name,
      },
      title: song.artist,
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

    // const progress = currentTime() - (currentStartedAt.value ?? 0);
    // const bar = `\`[${"=".repeat(progress / 24).padEnd(24)}]\``;
    // embed.addFields({
    //   name: "Progress",
    //   value: bar,
    // });

    await interaction.editReply({
      embeds: [embed],
    });
  },
});
