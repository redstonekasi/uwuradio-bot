import { client } from "./client.js";
import { syncClient } from "./sync.js";

import "./emojis.js";
import "./presence.js";
import "./commands.js";

let terminating = false;
async function terminate(signal) {
	if (terminating) return;
	terminating = true;
	console.log(`received ${signal}, shutting down gracefully`);

	client.disconnect(false);
	syncClient.stop();
}
process.on("SIGINT", terminate);
process.on("SIGTERM", terminate);

client.connect();
syncClient.start();
