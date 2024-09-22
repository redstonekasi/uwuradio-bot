import { ActivityTypes } from "oceanic.js";
import { client } from "./client.js";
import { syncClient } from "./sync.js";

const setPresence = (song) =>
	client.editStatus("online", [{
		type: ActivityTypes.CUSTOM,
		name: "Custom Status",
		state: `${song.name} - ${song.artist}`,
	}]);

client.on("ready", () => {
	if (syncClient.currentSong) {
		setPresence(syncClient.currentSong);
	}
});

syncClient.on("play", (song) => {
	if (client.ready) setPresence(song);
});
