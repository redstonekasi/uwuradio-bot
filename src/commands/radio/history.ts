import { computed } from "@vue/reactivity";
import { bold, EmbedBuilder, hyperlink, time, TimestampStyles } from "discord.js";
import { Command } from "../../def";
import { history } from "../../handlers/player";

const hist = computed(() => [...history].reverse());

export default new Command({
  name: "history",
  description: "History of played songs",
  async handler(interaction) {
    const embed = new EmbedBuilder()
      .setTitle(`Last ${hist.value.length === 1 ? "song" : `${hist.value.length} songs`}`)
      .setDescription(
        hist.value.map(([song, timestamp]) =>
          `• ${time(timestamp, TimestampStyles.RelativeTime)} ${hyperlink(song.name, song.sourceUrl)} - ${bold(song.artist)} (submitted by ${song.submitter})`
        ).join("\n")
      )

    await interaction.editReply({
      embeds: [embed],
    });
  },
});
