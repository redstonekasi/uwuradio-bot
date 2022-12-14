import { GatewayIntentBits } from "discord.js";
import { RadioClient } from "./def";
import { getReactiveConfig } from "./lib/config";
import commandHandler from "./handlers/command";
import interactionHandler from "./handlers/interaction";
import syncHandler, { currentSong, currentStartedAt, nextSong, nextStartsAt, serverOnline, submitters } from "./handlers/sync";
import presenceHandler from "./handlers/presence";
import rejoinHandler from "./handlers/rejoin";
import voiceStateHandler from "./handlers/voice";
import { history } from "./handlers/player";

export const client = new RadioClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  config: getReactiveConfig(),
  sync: {
    submitters,
    history,
    song: {
      current: currentSong,
      next: nextSong,
      currentStartedAt,
      nextStartsAt,
    },
  },
});

client.once("ready", async () => {
  await commandHandler();
  await interactionHandler();

  client.sync.hub = await syncHandler();
  await presenceHandler();

  await rejoinHandler();
  await voiceStateHandler();

  console.log("uwu radio is ready.");
});

serverOnline().then(() => client.login(client.config.token));
