import { ApplicationCommandOptionType, ChannelType, PermissionsBitField, VoiceBasedChannel } from "discord.js";
import { Command } from "../../def";
import { joinVoiceChannel, entersState, VoiceConnectionStatus, getVoiceConnection } from "@discordjs/voice";
import { player } from "../../handlers/player";
import { createStatusEmbed } from "../../lib/embeds";
import { client } from "../..";

export default new Command({
  name: "join",
  description: "Join a voice channel and start streaming radio.",
  dm: false,
  options: [
    {
      type: ApplicationCommandOptionType.Channel,
      name: "channel",
      description: "Channel to join - defaults to your channel.",
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

    const probe = getVoiceConnection(channel.guild.id);

    if (probe)
      return void interaction.editReply({
        embeds: [createStatusEmbed({
          type: "error",
          description: "I'm already in that channel!",
        })],
      });

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30000);
    } catch (err) {
      connection.destroy();
      return void interaction.editReply({
        embeds: [createStatusEmbed({
          type: "error",
          description: "Couldn't connect to the voice channel",
        })],
      });
    }

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
        // Seems to be reconnecting to a new channel - ignore disconnect
      } catch (error) {
        // Seems to be a real disconnect which SHOULDN'T be recovered from
        connection.destroy();
      }
    });

    connection.subscribe(player);
    // client.config.channels = client.config.channels.filter((id) => id !== channel.id);
    if (!client.config.channels.includes(channel.id))
      client.config.channels.push(channel.id);

    interaction.editReply({
      embeds: [createStatusEmbed({
        type: "success",
        description: "Successfully joined the voice channel - enjoy your music!",
      })],
    });
  }
});
