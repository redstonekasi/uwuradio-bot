import { client } from "..";
import { isInChannel, joinChannel, leaveChannel } from "../lib/voice";

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

      leaveChannel(oldState.channel);
    } else if (
      oldState.channel === null &&
      client.config.channels.includes(newState.channel.id) &&
      newState.id !== client.user!.id
    ) { // Joining channel
      if (isInChannel(newState.channel)) return;
      try {
        joinChannel(newState.channel);
      } catch {}
    }
  });
}
