import { bold, EmbedBuilder, hyperlink, time, TimestampStyles } from "discord.js";
import { Command } from "../../def";
import { history } from "../../handlers/sync";
import { ensureEmojiExists } from "../../handlers/presence";

export default new Command({
  name: "history",
  description: "History of played songs",
  async handler(interaction) {
    const embed = new EmbedBuilder()
      .setTitle(`Last ${history.length === 1 ? "song" : `${history.length} songs`}`)
      .setDescription(
        await Promise.all(history.map(async ([song, timestamp]) =>
          `${await ensureEmojiExists(song)} ${time(timestamp, TimestampStyles.RelativeTime)} ${hyperlink(song.name, song.sourceUrl)} - ${bold(song.artist)} (submitted by ${song.submitter})`
        )).then((a) => a.join("\n"))
      );

    await interaction.editReply({
      embeds: [embed],
    });
  },
});
