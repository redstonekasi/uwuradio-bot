import { client } from "..";
import { joinVoiceChannel, entersState, VoiceConnectionStatus } from "@discordjs/voice";
import { player } from "./player";

export default async function rejoinHandler() {
  const filter: string[] = [];

  for (const id of client.config.channels) {
    const channel = await client.channels.fetch(id);
    if (!channel || !channel.isVoiceBased() || !channel.joinable) {
      filter.push(id);
      continue;
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30000);
    } catch (err) {
      connection.destroy();
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

  client.config.channels = client.config.channels.filter((id) => !filter.includes(id));
}
