import { ApplicationCommandOptionType, ChannelType, PermissionsBitField, VoiceBasedChannel } from "discord.js";
import { Command } from "../../def";
import { client } from "../..";
import { createStatusEmbed } from "../../lib/embeds";
import { joinChannel, leaveChannel } from "../../lib/voice";

export default new Command({
  name: "channel",
  description: "Set the channel this bot resides in",
  dm: false,
  options: [
    {
      name: "channel",
      description: "Channel to join - omit to leave",
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildVoice],
    }
  ],
  async handler(interaction) {
    const guild = interaction.guild!;
    const member = await guild.members.fetch(interaction.user.id);
    const channel = interaction.options.getChannel("channel") as VoiceBasedChannel;

    if (!client.config.sudoers.includes(member.id) && !member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return void interaction.editReply({
        embeds: [createStatusEmbed({
          type: "error",
          description: "You don't have permission to run this command",
        })],
      });

    if (!channel) {
      if (!client.config.channels[guild.id])
        return void interaction.editReply({
          embeds: [createStatusEmbed({
            type: "error",
            description: "I'm not in any channel in this guild right now - specify `channel` to make me join one",
          })],
        });

      leaveChannel(guild);
      delete client.config.channels[guild.id];

      await interaction.editReply({
        embeds: [createStatusEmbed({
          type: "success",
          description: "Sucessfully left the channel",
        })],
      });
    } else {
      const botMember = await guild.members.fetchMe();
      if (
        client.config.channels[guild.id] === channel.id &&
        botMember.voice.channelId === channel.id
      ) return void interaction.editReply({
        embeds: [createStatusEmbed({
          type: "error",
          description: "I'm already in that channel",
        })],
      });

      client.config.channels[guild.id] = channel.id;
      leaveChannel(guild);
      if (channel.members.size !== 0)
        joinChannel(channel);

      await interaction.editReply({
        embeds: [createStatusEmbed({
          type: "success",
          description: "Successfully joined that voice channel",
        })],
      });
    }
  },
})
