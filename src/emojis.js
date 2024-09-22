import sharp from "sharp";
import xxhashAddon from "xxhash-addon";
import { client } from "./client.js";
import { syncClient } from "./sync.js";

const { XXHash3 } = xxhashAddon;

const albumMap = new Map();
async function processNewEmoji(hash, url, ctx) {
	const buf = await fetch(url).then((r) => r.arrayBuffer());
	const processed = await sharp(buf)
		.resize(128, 128, { fit: "contain" })
		.toFormat("jpeg")
		.toBuffer();
	const emoji = await client.application.createEmoji({
		name: "g_" + hash,
		image: processed,
	});
	console.log(`(emoji) processed new emoji for ${ctx}`);
	albumMap.set(hash, emoji);
	return emoji;
}

const inflight = new Map();
export async function ensureEmojiExists(song) {
	if (!song.artUrl) {
		return albumMap.get("missing");
	}
	const hash = XXHash3.hash(Buffer.from(song.artUrl)).toString("hex");
	const existing = albumMap.get(hash) ?? await inflight.get(hash);
	if (existing) return existing;

	const promise = processNewEmoji(hash, song.artUrl, song.name);
	inflight.set(hash, promise);
	return promise;
}

let ready = false;
client.once("ready", async () => {
	const emojis = await client.application.getEmojis();
	for (const emoji of emojis.items) {
		if (emoji.name.startsWith("g_")) {
			albumMap.set(emoji.name.slice(2), emoji);
		}
	}
	ready = true;
});

syncClient.on("preload", (song) => {
	if (ready) ensureEmojiExists(song);
});
