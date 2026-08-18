import * as BugList from "buglist";
import * as Bugzilla from "bugzilla";
import * as Releases from "releases";

const FLOOR_VERSION = 5;
const CHUNK_SIZE = 40;

export function init($container) {
    for (const chan of Releases.channels("beta", "nightly")) {
        BugList.append({
            id: `uplift-candidates-${chan.name}`,
            $container: $container,
            title: `${chan.version} (${chan.title}) Fixed, Affecting Prior Versions`,
            description:
                "Candidates for uplift/backport consideration.\n" +
                "Bugs with all of the following:\n" +
                `- status-firefox${chan.version} set to fixed or verified\n` +
                `- any status-firefox${FLOOR_VERSION}..${chan.previous} set to ` +
                "affected, fix-optional, or ?\n" +
                "Bugs are ordered by creation date, oldest first.",
            lazyLoad: true,
            urlsBuilder: () => {
                const chunkCount = Math.ceil(
                    (chan.version - FLOOR_VERSION) / CHUNK_SIZE,
                );
                return Array.from({ length: chunkCount }, (_, i) => {
                    const startVersion = FLOOR_VERSION + i * CHUNK_SIZE;
                    const endVersion = Math.min(
                        startVersion + CHUNK_SIZE,
                        chan.version,
                    );
                    const count = endVersion - startVersion;
                    const query = {
                        resolution: ["---", "FIXED"],
                        f1: `cf_status_firefox${chan.version}`,
                        o1: "anyexact",
                        v1: "fixed,verified",
                        f2: "OP",
                        j2: "OR",
                        ...Object.fromEntries(
                            Array.from({ length: count }, (_, j) => [
                                [`f${j + 3}`, `cf_status_firefox${startVersion + j}`],
                                [`o${j + 3}`, "anyexact"],
                                [`v${j + 3}`, "affected,fix-optional,?"],
                            ]).flat(),
                        ),
                        [`f${count + 3}`]: "CP",
                    };
                    return Bugzilla.queryURL(query);
                });
            },
        });
    }
}
