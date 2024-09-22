import { spawn } from "node:child_process";

export const probeDuration = (url) =>
	new Promise((resolve, reject) => {
		// @dprint-ignore
		const proc = spawn("ffprobe", [
			"-i", url,
			"-show_entries", "format=duration",
			"-v", "quiet",
			"-of", "csv=p=0",
		], { windowsHide: true });

		const chunks = [];
		proc.stdout.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
		proc.stdout.on("error", (err) => reject(err));
		proc.stdout.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
	}).then((v) => Number.parseFloat(v));
