import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { EventEmitter } from "node:events";

export const currentTime = () => ~~(Date.now() / 1000);

const logLevelMap = {
	[LogLevel.Trace]: "trace",
	[LogLevel.Debug]: "debug",
	[LogLevel.Information]: "info",
	[LogLevel.Warning]: "warn",
	[LogLevel.Error]: "error",
	[LogLevel.Critical]: "critical",
	[LogLevel.None]: "none",
};

class SyncClient extends EventEmitter {
	#base;
	#hub;

	currentSong;
	currentStartedAt;
	nextSong;
	nextStartsAt;

	history = [];
	#historySize;

	constructor(base, historySize = 0) {
		super();

		this.#base = base;
		this.#historySize = historySize;

		let hub = this.#hub = new HubConnectionBuilder()
			.withAutomaticReconnect({
				nextRetryDelayInMilliseconds: () => 10000,
			})
			.withUrl(this.#api("/sync"))
			.configureLogging({
				log(level, msg) {
					if (level < LogLevel.Information) return;
					console.log(`(signalr/${logLevelMap[level]}) ${msg}`);
				},
			})
			.build();

		hub.on("BroadcastNext", this.#broadcastNext.bind(this));
		hub.on("ReceiveState", this.#receiveState.bind(this));

		hub.onreconnected(() => hub.invoke("RequestState"));
	}

	async start() {
		await this.#hub.start();
		await this.#hub.invoke("RequestState");
	}

	stop() {
		clearTimeout(this.#scheduleTimeout);
		return this.#hub.stop();
	}

	#broadcastNext(next, nextStarts, channel) {
		if (channel) return; // channels forwards-compat
		this.#scheduleNext(next, nextStarts);
	}

	#receiveState(current, currentStarted, next, nextStarts, channel) {
		if (channel) return; // channels forwards-compat

		this.currentSong = current;
		this.currentStartedAt = currentStarted;

		this.#emitPlay(this.currentSong, this.currentStartedAt);
		if (nextStarts - currentTime() < 30) {
			this.#scheduleNext(next, nextStarts);
		}
	}

	#scheduleTimeout;
	#scheduleNext(song, startsAt) {
		this.nextSong = song;
		this.nextStartsAt = startsAt;

		this.emit("preload", this.nextSong);

		clearTimeout(this.#scheduleTimeout);
		this.#scheduleTimeout = setTimeout(() => {
			this.currentSong = this.nextSong;
			this.currentStartedAt = this.nextStartsAt;
			this.nextSong = undefined;
			this.nextStartsAt = undefined;

			this.#emitPlay(this.currentSong, this.currentStartedAt);
		}, 1000 * (startsAt - currentTime()));
	}

	#emitPlay(song, startedAt) {
		if (this.#historySize > 0) {
			this.history.unshift([song, startedAt]);
			if (this.history.length > this.#historySize) this.history.pop();
		}
		this.emit("play", song);
	}

	#api(path) {
		return new URL(path, this.#base).href;
	}
}

export const syncClient = new SyncClient(process.env.ENDPOINT || "https://radio.k6.tf", 10);
