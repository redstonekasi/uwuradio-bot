import { createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioResource } from "@discordjs/voice";

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

let buffer: AudioResource | undefined;
let current: AudioResource | undefined;

export async function preload(url: string) {
  buffer = createAudioResource(url);
}

export async function play(url: string, seek: number) {
  if (!buffer) preload(url);
  current = buffer;
  buffer = undefined;
  
  const res = current!; // It exists now.
  res.playbackDuration = seek * 1000;
  player.play(res);
}
