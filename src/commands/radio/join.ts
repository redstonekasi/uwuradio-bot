import { ApplicationCommandOptionType, ChannelType, VoiceBasedChannel } from "discord.js";
import { Command } from "../../def";
import { joinVoiceChannel, entersState, VoiceConnectionStatus, getVoiceConnection } from "@discordjs/voice";
import { player } from "../../handlers/player";
import { createStatusEmbed } from "../../lib/embeds";
import { client } from "../..";

export default new Command({
  name: "join",
  description: "Join a voice channel and start streaming radio.",
  su: true,
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
          title: "This command must be run in a guild",
        })],
      });

    const member = await interaction.guild!.members.fetch(interaction.user.id);
    const channel = (interaction.options.getChannel("channel") ?? member.voice.channel) as VoiceBasedChannel;

    if (!channel || channel.type !== ChannelType.GuildVoice)
      return void interaction.editReply({
        embeds: [createStatusEmbed({
          type: "error",
          title: "You must either supply a voice channel or be in one",
        })],
      });

    const probe = getVoiceConnection(channel.guild.id);

    if (probe)
      return void interaction.editReply({
        embeds: [createStatusEmbed({
          type: "error",
          title: "I'm already in that channel!",
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
          title: "Couldn't connect to the voice channel",
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
    client.config.channels = client.config.channels.filter((id) => id !== channel.id);
    client.config.channels.push(channel.id);

    interaction.editReply({
      embeds: [createStatusEmbed({
        type: "success",
        title: "Successfully joined the voice channel - enjoy your music!",
      })],
    });
  }
});
