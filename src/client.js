import { Client } from "oceanic.js";

if (!process.env.TOKEN) {
	console.error("no TOKEN specified");
	process.exit(1);
}

export const client = new Client({
	auth: `Bot ${process.env.TOKEN}`,
});

client.once("ready", () => {
	console.log("(discord) uwu radio bot is ready!");
});
