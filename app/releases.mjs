import * as Notifications from "notifications";
import { setLoadingStage } from "util";

// channels in ascending version order
const CHANNELS = [
    ["release", "Release"],
    ["beta", "Beta"],
    ["nightly", "Nightly"],
];

class Channel {
    constructor(name, title) {
        this.name = name;
        this.title = title;
        this.version = undefined;
        this.nightlyStart = undefined;
    }

    // the version that shipped before this one
    get previous() {
        return this.version - 1;
    }
}

const g = {
    channels: CHANNELS.map(([name, title]) => new Channel(name, title)),
};

export function channel(name) {
    return g.channels.find((c) => c.name === name);
}

export function channels(...names) {
    if (names.length === 0) {
        return g.channels;
    }
    return names.map((name) => channel(name));
}

async function fetchTrain(path) {
    try {
        const response = await fetch(`https://whattrainisitnow.com/api/${path}`);
        return response.ok ? await response.json() : undefined;
    } catch {
        return undefined;
    }
}

export async function initData() {
    setLoadingStage("Firefox versions");

    // versions
    const data = await fetchTrain(`lando/uplift/train/?${Date.now()}`);
    if (data) {
        for (const chan of g.channels) {
            chan.version = Number(data[chan.name]?.version) || undefined;
        }
    }

    // nightly starts
    await Promise.all(
        g.channels.map(async (chan) => {
            if (chan.version === undefined) {
                return;
            }
            const data = await fetchTrain(
                `release/schedule/?version=${chan.version}&${Date.now()}`,
            );
            chan.nightlyStart = data?.nightly_start?.slice(0, 10);
        }),
    );

    // provide clearly fake values so lists don't throw exceptions
    const badVersions = g.channels.some((c) => c.version === undefined);
    if (badVersions) {
        Notifications.error(
            "Failed to load Firefox versions, some lists might not work",
        );
        for (const [i, chan] of g.channels.entries()) {
            chan.version = 997 + i;
        }
    }
    const missingDates = g.channels.filter((c) => c.nightlyStart === undefined);
    if (missingDates.length && !badVersions) {
        Notifications.error(
            "Failed to find the nightly start for " +
                `${missingDates.map((c) => c.version).join(", ")}, ` +
                "some lists might not work",
        );
    }
    for (const chan of missingDates) {
        chan.nightlyStart = "2100-01-01";
    }
}
