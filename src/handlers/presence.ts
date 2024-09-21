import { effect } from "@vue/reactivity";
import { ActivityType, Emoji, GatewayOpcodes } from "discord.js";
import { client } from "..";
import { currentSong } from "./sync";
import { Song } from "../def";
import { XXHash3 } from "xxhash-addon";
import sharp from "sharp";

const albumMap = new Map<string, Emoji>();

async function processNewEmoji(hash: string, url: string): Promise<Emoji | undefined> {
  const buf = await fetch(url).then((r) => r.arrayBuffer());
  const processed = await sharp(buf)
    .resize(128, 128, { fit: "contain" })
    .toFormat("jpeg")
    .toBuffer();
  const emoji = await client.application!.emojis.create({
    name: "g_" + hash,
    attachment: processed,
  });
  albumMap.set(emoji!.name!.slice(2), emoji);
  return emoji;
}

const inflight = new Map<string, Promise<Emoji | undefined>>();
export async function ensureEmojiExists(song: Song): Promise<Emoji | undefined> {
  if (!song.artUrl) return;
  const hash = XXHash3.hash(Buffer.from(song.artUrl)).toString("hex");
  const existing = albumMap.get(hash) ?? await inflight.get(hash);
  if (existing) return existing;

  const promise = processNewEmoji(hash, song.artUrl);
  inflight.set(hash, promise);
  return promise;
}

export default async function presenceHandler() {
  const emojis = await client.application!.emojis.fetch();
  for (const [, emoji] of emojis) {
    if (emoji!.name!.startsWith("g_")) {
      albumMap.set(emoji!.name!.slice(2), emoji);
    }
  }

  // This is really nice now that base functionality has been implemented.
  effect(async () => {
    if (currentSong.value) {
      const emoji = await ensureEmojiExists(currentSong.value);
      // @ts-expect-error djs fucking sucks
      client.ws.broadcast({
        op: GatewayOpcodes.PresenceUpdate,
        d: {
          since: null,
          status: "online",
          afk: false,
          activities: [{
            type: ActivityType.Custom,
            name: "Custom Status",
            state: [currentSong.value.name, currentSong.value.artist].join(" - "),
            emoji: emoji ? {
              name: emoji.name,
              id: emoji.id,
              animated: emoji.animated,
            } : undefined,
          }],
        },
      });
    }
  });
}
