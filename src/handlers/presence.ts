import { effect } from "@vue/reactivity";
import { ActivityType } from "discord.js";
import { client } from "..";
import { currentSong } from "./sync";

export default async function presenceHandler() {
  // This is really nice now that base functionality has been implemented.
  effect(() => {
    client.user?.setActivity({
      type: ActivityType.Playing,
      name: [currentSong.value?.name, currentSong.value?.artist].join(" - "),
    });
  });
}
