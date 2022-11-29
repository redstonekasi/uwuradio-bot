import {
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  StreamType,
} from "@discordjs/voice";
import { get } from "https";
import { Readable } from "stream";
import prism from "prism-media";
import { reactive } from "@vue/reactivity";
import { Song } from "../def";
import { currentStartedAt } from "./sync";

export const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Play,
  },
});

const songs: Map<string, Promise<Readable>> = new Map();
export const history = reactive<Array<[Song, number]>>([]);

// Not sure if preloading is even needed considering that we stream the audio
// and this just removes the overhead of the request itself.
export async function preload(url: string) {
  // Delete all resources so they can be garbage collected, shouldn't be problem
  // since the current song is stored by the player.
  // Makes me wonder if we even need this to be a map, makes it nicer to work
  // with though.
  songs.clear();

  const promise: Promise<Readable> = new Promise((resolve, reject) => {
    const req = get(url, (res) => {
      resolve(res);
    });

    req.on("error", reject);
  });

  songs.set(url, promise);
  return promise;
}

export async function play(song: Song, seek: number) {
  // We have to manually transcode the mp3 to opus since discord.js breaks
  // otherwise, see: hours of pain in #general
  const transcoder = new prism.FFmpeg({
    args: [
      "-analyzeduration",
      "0",
      "-loglevel",
      "0",
      "-f",
      "s16le",
      "-ar",
      "48000",
      "-ac",
      "2",
      "-ss",
      seek.toString(),
    ],
  });
  const input = await (songs.get(song.dlUrl) ?? preload(song.dlUrl));

  const opus = new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 });

  input.pipe(transcoder).pipe(opus);

  const resource = createAudioResource(opus, {
    inputType: StreamType.Opus,
  });
  player.play(resource);

  history.push([song, currentStartedAt.value!]);
  if (history.length > 10) history.shift();
}
