import { HubConnectionBuilder } from "@microsoft/signalr";
import { computed, ref } from "@vue/reactivity";
import { client } from "..";
import { Song, Submitter } from "../def";
import { play, preload } from "./player";

const api = (route: string) => new URL(route, client.config.endpoint).href;
export const currentTime = () => ~~(Date.now() / 1000);

export const submitters = new Map<string, Submitter>();

export const currentSong = ref<Song>();
export const nextSong = ref<Song>();
export const currentStartedAt = ref<number>();
export const nextStartsAt = ref<number>();

export const serverOnline: () => Promise<void> = () => new Promise(function handler (resolve, reject) {
  const retry = () => setTimeout(handler, 500, resolve, reject);
  fetch(api("/api/ping")).then((val) => val.ok ? resolve() : retry()).catch(retry);
});

const seekPos = computed(() => {
  const startTime = currentStartedAt.value;
  return startTime ? currentTime() - startTime : 0;
});

export default async function syncHandler() {
  const hub = new HubConnectionBuilder()
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: () => 10000,
    })
    .withUrl(api("/sync"))
    .build();

  hub.on("BroadcastNext", (next: Song, startTime: number) => {
    nextSong.value = next;
    nextStartsAt.value = startTime;

    preload(next.dlUrl);

    setTimeout(() => {
      currentSong.value = nextSong.value;
      currentStartedAt.value = nextStartsAt.value;
      nextSong.value = undefined;
      nextStartsAt.value = undefined;

      const correction = Math.min(-(startTime - currentTime()), 0);
      play(currentSong.value!, correction);
    }, 1000 * (startTime - currentTime()));
  });

  hub.on("ReceiveState", (current: Song, currentStarted: number, next: Song, nextStart: number) => {
    currentSong.value = current;
    currentStartedAt.value = currentStarted;
    nextSong.value = next;
    nextStartsAt.value = nextStart;

    play(current, seekPos.value);
  });

  // hub.on("ReceiveSeekPos", (time: number) => {
  //   currentStartedAt.value = time;
  // });

  async function handler() {
    await fetch(api("/api/data"))
      .then((r) => r.json())
      .then((r) => {
        for (const submitter of r.submitters) submitters.set(submitter.name, submitter);
      });

    await hub.invoke("RequestState");
  }

  hub.onreconnected(handler);

  await hub.start();
  await handler();

  return hub;
}
