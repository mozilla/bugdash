import * as BugList from "buglist";
import * as Bugzilla from "bugzilla";
import * as Global from "global";

const FLOOR_VERSION = 5;
const AFFECTING_VALUES = "affected,fix-optional,?";
const CHUNK_SIZE = 40;

function buildAnchor(anchorVersion) {
    return {
        resolution: ["---", "FIXED"],
        f1: `cf_status_firefox${anchorVersion}`,
        o1: "anyexact",
        v1: "fixed,verified",
    };
}

function buildChunkQuery(anchorVersion, startVersion, endVersion) {
    const query = {
        ...buildAnchor(anchorVersion),
        f2: "OP",
        j2: "OR",
    };
    let idx = 3;
    for (let v = startVersion; v < endVersion; v++) {
        query[`f${idx}`] = `cf_status_firefox${v}`;
        query[`o${idx}`] = "anyexact";
        query[`v${idx}`] = AFFECTING_VALUES;
        idx++;
    }
    query[`f${idx}`] = "CP";
    return query;
}

function appendUpliftList({
    $container,
    usesComponents,
    channel,
    channelTitle,
    anchorVersion,
}) {
    BugList.append({
        id: `uplift-${channel}-affecting-prior`,
        $container: $container,
        title: `${anchorVersion} (${channelTitle}) Fixed, Affecting Prior Versions`,
        description:
            "Candidates for uplift/backport consideration.\n" +
            "Bugs with all of the following:\n" +
            `- status-firefox${anchorVersion} set to fixed or verified\n` +
            `- any status-firefox${FLOOR_VERSION}..${anchorVersion - 1} set to ` +
            "affected, fix-optional, or ?\n" +
            "Bugs are ordered by creation date, oldest first.",
        query: buildAnchor(anchorVersion),
        usesComponents: usesComponents,
        fetchBugs: async (buglist) => {
            const components = buglist.usesComponents
                ? Global.selectedComponents()
                : undefined;
            const urls = [];
            for (
                let start = FLOOR_VERSION;
                start < anchorVersion;
                start += CHUNK_SIZE
            ) {
                const end = Math.min(start + CHUNK_SIZE, anchorVersion);
                urls.push(
                    Bugzilla.queryURL(
                        buildChunkQuery(anchorVersion, start, end),
                        components,
                    ),
                );
            }
            const responses = await Promise.all(urls.map((url) => Bugzilla.rest(url)));
            const byId = new Map();
            for (const response of responses) {
                for (const bug of response.bugs) {
                    byId.set(bug.id, bug);
                }
            }
            return { bugs: Array.from(byId.values()) };
        },
    });
}

export function init($container, usesComponents) {
    const releases = Global.releaseData();
    const channels = [
        {
            channel: "nightly",
            channelTitle: "Nightly",
            anchorVersion: Number(releases.nightly.version),
        },
        {
            channel: "beta",
            channelTitle: "Beta",
            anchorVersion: Number(releases.beta.version),
        },
    ];
    for (const c of channels) {
        appendUpliftList({ $container, usesComponents, ...c });
    }
}
