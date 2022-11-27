import { entersState, getVoiceConnection, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { Guild, VoiceBasedChannel } from "discord.js";
import { player } from "../handlers/player";

export function leaveChannel(channel: VoiceBasedChannel | Guild) {
  const id = channel instanceof Guild
    ? channel.id
    : channel.guild.id;

  const connection = getVoiceConnection(id);
  if (!connection) return false;
  connection.destroy();
  return true;
}

export async function joinChannel(channel: VoiceBasedChannel) {
  const probe = getVoiceConnection(channel.guild.id);
  if (probe) return;

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30000);
  } catch (err) {
    connection.destroy();
    throw err;
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
}

export function isInChannel(channel: VoiceBasedChannel | Guild) {
  const id = channel instanceof Guild
    ? channel.id
    : channel.guild.id;

  const probe = getVoiceConnection(id);
  return !!probe;
}
