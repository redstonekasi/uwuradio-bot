import { ApplicationCommandTypes, InteractionTypes } from "oceanic.js";
import { client } from "./client.js";
import { probeDuration } from "./duration.js";
import { ensureEmojiExists } from "./emojis.js";
import { currentTime, syncClient } from "./sync.js";

client.on("ready", () => {
	client.application.bulkEditGlobalCommands([
		{
			type: ApplicationCommandTypes.CHAT_INPUT,
			name: "np",
			description: "Now playing",
		},
		{
			type: ApplicationCommandTypes.CHAT_INPUT,
			name: "history",
			description: "History of played songs",
		},
	]);
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.type !== InteractionTypes.APPLICATION_COMMAND) return;
	if (interaction.data.type !== ApplicationCommandTypes.CHAT_INPUT) return;

	await interaction.defer();

	let embed;
	switch (interaction.data.name) {
		case "history":
			embed = await history();
			break;
		case "np":
			embed = await np();
			break;
	}

	interaction.editOriginal({ embeds: [embed] });
});

// very basic escaping for anything that could possibly appear
const markdownEscapeRegex = /[_\\~|\*`\(\)\[\]]/g;
const escapeSongName = (val) => val.replace(markdownEscapeRegex, "\\$&");

async function formatHistoryEntry(song, timestamp) {
	const emoji = await ensureEmojiExists(song);
	const name = escapeSongName(song.name);
	return `<:${emoji.name}:${emoji.id}> <t:${timestamp}:R> [${name}](${song.sourceUrl}) - **${song.artist}** (submitted by ${song.submitter})`;
}

async function history() {
	const history = syncClient.history;
	const items = await Promise.all(history.map(async ([song, timestamp]) => formatHistoryEntry(song, timestamp)));
	return {
		title: `Last ${history.length === 1 ? "song" : `${history.length} songs`}`,
		description: items.join("\n"),
	};
}

const durationCache = new Map();
async function np() {
	const song = syncClient.currentSong;
	const embed = {
		title: song.name,
		url: song.sourceUrl,
		author: {
			name: song.artist,
		},
		thumbnail: {
			url: song.artUrl,
		},
		fields: [{
			name: "Submitter",
			value: song.submitter,
			inline: true,
		}],
		footer: {
			text: song.quote,
		},
	};

	if (song.album) {
		embed.fields.unshift({
			name: "Album",
			value: song.album,
			inline: true,
		});
	}

	const at = currentTime() - syncClient.currentStartedAt;
	let duration = durationCache.get(song.dlUrl);
	if (!duration) durationCache.set(song.dlUrl, duration = await probeDuration(song.dlUrl));
	const bar = `\`[${"=".repeat(at / duration * 24).padEnd(24)}]\``;
	embed.fields.push({
		name: "Progress",
		value: bar,
	});

	return embed;
}

syncClient.on("preload", async (song) => {
	const duration = durationCache.get(song.dlUrl);
	if (!duration) {
		durationCache.set(song.dlUrl, await probeDuration(song.dlUrl));
		console.log(`(duration) probed duration for ${song.name}`);
	}
});
