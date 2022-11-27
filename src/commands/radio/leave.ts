import { ApplicationCommandOptionType, ChannelType, PermissionsBitField, VoiceBasedChannel } from "discord.js";
import { Command } from "../../def";
import { getVoiceConnection } from "@discordjs/voice";
import { createStatusEmbed } from "../../lib/embeds";
import { client } from "../..";

export default new Command({
  name: "leave",
  description: "Leave a voice channel.",
  dm: false,
  options: [
    {
      type: ApplicationCommandOptionType.Channel,
      name: "channel",
      description: "Channel to leave - defaults to your channel.",
      channelTypes: [ChannelType.GuildVoice],
      required: false,
    }
  ],
  async handler(interaction) {
    if (!interaction.inGuild())
      return void interaction.editReply({
        embeds: [createStatusEmbed({
          type: "error",
          description: "This command must be run in a guild",
        })],
      });

    const member = await interaction.guild!.members.fetch(interaction.user.id);

    if (!client.config.sudoers.includes(member.id) && !member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return void interaction.editReply({
        embeds: [createStatusEmbed({
          type: "error",
          description: "You don't have permission to run this command",
        })],
      });

    const channel = (interaction.options.getChannel("channel") ?? member.voice.channel) as VoiceBasedChannel;

    if (!channel || channel.type !== ChannelType.GuildVoice)
      return void interaction.editReply({
        embeds: [createStatusEmbed({
          type: "error",
          description: "You must either supply a voice channel or be in one",
        })],
      });

    const connection = getVoiceConnection(channel.guild.id);

    if (!connection)
      return void interaction.editReply({
        embeds: [createStatusEmbed({
          type: "error",
          description: "I'm not in that channel!",
        })],
      });

    connection.destroy();
    client.config.channels = client.config.channels.filter((id) => id !== channel.id);

    interaction.editReply({
      embeds: [createStatusEmbed({
        type: "success",
        description: "Successfully left the voice channel - goodbye!",
      })],
    });
  }
});
