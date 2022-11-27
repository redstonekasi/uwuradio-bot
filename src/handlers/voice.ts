import { entersState, getVoiceConnection, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js";
import { client } from "..";
import { RadioClient } from "../def";
import { player } from "./player";

export default async function voiceStateHandler() {
  client.on("voiceStateUpdate", async (oldState, newState) => {
    if (newState.channel === null) { // Leaving channel
      if (
        oldState.channel === null ||
        !client.config.channels.includes(oldState.channel.id) ||
        oldState.id === client.user!.id &&
        !oldState.channel.isVoiceBased() ||
        oldState.channel.members.size !== 1
      ) return;

      const connection = getVoiceConnection(oldState.channel.guild.id);
      if (!connection) return;
      connection.destroy();

    } else if (
      oldState.channel === null &&
      client.config.channels.includes(newState.channel.id) &&
      newState.id !== client.user!.id
    ) { // Joining channel
      
      const probe = getVoiceConnection(newState.channel.guild.id);
      if (probe) return;
      
      console.log("joining", newState.channel.name)

      const connection = joinVoiceChannel({
        channelId: newState.channel.id,
        guildId: newState.channel.guild.id,
        adapterCreator: newState.channel.guild.voiceAdapterCreator,
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
  });
}
