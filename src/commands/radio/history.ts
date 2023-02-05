import { bold, EmbedBuilder, hyperlink, time, TimestampStyles } from "discord.js";
import { Command } from "../../def";
import { history } from "../../handlers/player";

export default new Command({
  name: "history",
  description: "History of played songs",
  async handler(interaction) {

    const embed = new EmbedBuilder()
      .setTitle(`Last ${history.length === 1 ? "song" : `${history.length} songs`}`)
      .setDescription(
        history.map(([song, timestamp]) =>
          `• ${time(timestamp, TimestampStyles.RelativeTime)} ${hyperlink(song.name, song.sourceUrl)} - ${bold(song.artist)} (submitted by ${song.submitter})`
        ).join("\n")
      );

    await interaction.editReply({
      embeds: [embed],
    });
  },
});
