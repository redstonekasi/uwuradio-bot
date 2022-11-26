import { ApplicationCommandOptionType, codeBlock } from "discord.js";
import { client } from "../..";
import { Command } from "../../def";
import { createStatusEmbed } from "../../lib/embeds";

const AsyncFunction = async function () {}.constructor;
const tokenRegex = /(mfa\.[a-z0-9_-]{20,})|([a-z0-9_-]{23,28}\.[a-z0-9_-]{6,7}\.[a-z0-9_-]{27})/i;

// taken from hut
export default new Command({
  name: "eval",
  description: "Run JS in the bot context - developer only!",
  su: true,
  noAck: true,
  options: [
    {
      name: "code",
      description: "The code to run (as a function!)",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "silent",
      description: "Don't send the output to the channel",
      type: ApplicationCommandOptionType.Boolean,
    },
  ],
  async handler(interaction) {
    const code = interaction.options.getString("code", true);
    const silent = interaction.options.getBoolean("silent") ?? false;

    await interaction.deferReply({ ephemeral: silent });

    const before = Date.now();

    let took;
    let result;
    let embed;

    try {
      result = await AsyncFunction(
        "client",
        "interaction",
        "require",
        code,
      )(client, interaction, require);
      took = Date.now() - before;

      embed = createStatusEmbed({
        type: "success",
        fields: [
          { name: "Time", value: `${took}ms`, inline: true },
          { name: "Type", value: typeof result, inline: true },
          { name: "Evaluated", value: codeBlock("js", code.substring(0, 1000)), inline: false },
        ],
      });

      if (result !== undefined) {
        embed.addFields([
          {
            name: "Result",
            value: codeBlock("js", JSON.stringify(result, null, 2).substring(0, 1000)),
            inline: false,
          },
        ]);
      }
    } catch (error) {
      const typedError = error as Error;

      embed = createStatusEmbed({
        type: "error",
        fields: [
          { name: "Evaluated", value: codeBlock("js", code.substring(0, 1000)), inline: false },
          {
            name: "Error",
            value: codeBlock(
              "js",
              (typedError.stack || typedError.message || typedError.toString()).substring(0, 1000),
            ),
            inline: false,
          },
        ],
      });
    }

    if (tokenRegex.test(JSON.stringify(result, null, 2))) {
      await interaction.editReply({ embeds: [
        createStatusEmbed({
          type: "warn",
          description: "The evaluation result was hidden because it contains a token."
        }),
      ]});
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.editReply({ embeds: [embed] });
    }
  },
});
