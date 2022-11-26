import { Command } from "../../def";
import { createStatusEmbed } from "../../lib/embeds";
import { getVoiceConnections } from "@discordjs/voice";

export default new Command({
  name: "shutdown",
  description: "Gracefully shutdown the bot.",
  su: true,
  noAck: true,
  ephemeral: true,
  async handler(interaction) {
    await interaction.reply({
      ephemeral: true,
      embeds: [createStatusEmbed({
        type: "info",
        description: "Shutting down..."
      })]
    });

    console.log("shutting down...");
    getVoiceConnections().forEach((conn) => conn.destroy());
    process.exit();
  },
});
