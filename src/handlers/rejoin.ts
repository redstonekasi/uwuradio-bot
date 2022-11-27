import { Channel } from "discord.js";
import { client } from "..";
import { joinChannel } from "../lib/voice";

export default async function rejoinHandler() {
  const filter: string[] = [];

  for (const guildId of Object.keys(client.config.channels)) {
    const channelId = client.config.channels[guildId];
    let channel: Channel | null;

    try {
      channel = await client.channels.fetch(channelId);
    } catch {
      filter.push(guildId);
      continue;
    }
    
    if (!channel || !channel.isVoiceBased()) {
      filter.push(guildId);
      continue;
    }

    if (
      channel.members.size === 0 ||
      channel.members.size === 1 &&
      channel.members.has(client.user!.id)
    ) continue;
    
    joinChannel(channel);
  }

  for (const id of filter)
    delete client.config.channels[id];
}
