import { client } from "..";
import { isInChannel, joinChannel, leaveChannel } from "../lib/voice";

export default async function voiceStateHandler() {
  client.on("voiceStateUpdate", async (oldState, newState) => {
    if (
      oldState.member?.id === client.user?.id ||
      newState.channelId === oldState.channelId
    ) return;

    if (newState.channel?.id === client.config.channels[newState.guild.id]) {
      // User joined a channel we care about.
      if (isInChannel(newState.channel)) return;
      try {
        joinChannel(newState.channel);
      } catch {}
    } else if (oldState.channel?.id === client.config.channels[oldState.guild.id]) {
      // User left a channel we care about
      if (oldState.channel.members.size === 1)
        leaveChannel(oldState.channel);
    }
  });
}
