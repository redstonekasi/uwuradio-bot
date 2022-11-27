import { codeBlock, CommandInteraction } from "discord.js";
import { client } from "..";
import { createStatusEmbed } from "./embeds";

export async function logError(interaction: CommandInteraction, error: Error) {
  console.error(error);

  const logChannel = await client.channels.fetch(client.config.log);
  const errorEmbed = createStatusEmbed({
    type: "error",
    fields: [
      {
        name: "Command",
        value: codeBlock(
          `/${interaction.commandName} ${interaction.options.data
            .map((o) => `${o.name}:${o.value}`)
            .join(" ")}`.substring(0, 1000),
        ),
        inline: false,
      },
      {
        name: "User",
        value: interaction.user.toString(),
        inline: true,
      },
      {
        name: "Guild",
        value: interaction.inGuild()
          ? `${interaction.guild?.name} (${interaction.guild?.id})`
          : "DM",
        inline: true,
      },
      {
        name: "Error",
        value: codeBlock(
          "js",
          (error.stack || error.message || error.toString()).substring(0, 1000),
        ),
        inline: false,
      },
    ],
  });

  logChannel?.isTextBased() && logChannel?.send({ embeds: [errorEmbed] });
}
