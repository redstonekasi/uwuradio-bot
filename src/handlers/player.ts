import { createAudioPlayer, createAudioResource, NoSubscriberBehavior } from "@discordjs/voice";
import { get } from "https";
import { Readable } from "stream";

// I'd like to rewrite this when I have more understanding of @discordjs/voice
// internals, it doesn't really seem optimal right now.

// It also seems to be a bit broken.
// A good solution might be using node:net and ffmpeg so that preloading
// is also supported.

export const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Play
  }
});

const songs: Record<string, Promise<Readable>> = {};

export async function preload(url: string) {
  console.log("preload", url)
  return songs[url] = new Promise((resolve, reject) => {
    const req = get(url, (res) => {
      resolve(res);
    });

    req.on("error", reject);
  });
}

export async function play(url: string, seek: number) {
  const stream = await (songs[url] ?? preload(url));
  const resource = createAudioResource(stream);
  player.play(resource);
}
