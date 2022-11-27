import { createAudioPlayer, createAudioResource, NoSubscriberBehavior, StreamType } from "@discordjs/voice";
import { get } from "https";
import { Readable } from "stream";
import prism from "prism-media";

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
  const transcoder = new prism.FFmpeg({
    args: [
      "-analyzeduration", "0",
      "-loglevel", "0",
      "-f", "s16le",
      "-ar", "48000",
      "-ac", "2",
      "-ss", seek.toString(),
    ],
  });
  const input = await (songs[url] ?? preload(url));
  
  const opus = new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 });
  
  input
    .pipe(transcoder)
    .pipe(opus);

  const resource = createAudioResource(opus, {
    inputType: StreamType.Opus
  });
  player.play(resource);
}
