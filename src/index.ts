import { GatewayIntentBits } from "discord.js";
import { RadioClient } from "./def";
import { getReactiveConfig } from "./lib/config";
import commandHandler from "./handlers/command";
import interactionHandler from "./handlers/interaction";
import syncHandler from "./handlers/sync";
import presenceHandler from "./handlers/presence";
import rejoinHandler from "./handlers/rejoin";
import voiceStateHandler from "./handlers/voice";

export const client = new RadioClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  config: getReactiveConfig(),
});

client.once("ready", async () => {
  await commandHandler();
  await interactionHandler();

  await syncHandler();
  await presenceHandler();

  await rejoinHandler();

  await voiceStateHandler();

  console.log("uwu radio is ready.");
});

client.login(client.config.token);
