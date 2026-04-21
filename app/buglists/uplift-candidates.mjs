import * as BugList from "buglist";
import * as Bugzilla from "bugzilla";
import * as Global from "global";

const FLOOR_VERSION = 5;
const CHUNK_SIZE = 40;

export function init($container) {
    const releases = Global.releaseData();

    const versions = [
        {
            name: "beta",
            title: "Beta",
            version: releases.beta.version,
        },
        {
            name: "nightly",
            title: "Nightly",
            version: releases.nightly.version,
        },
    ];

    for (const ver of versions) {
        BugList.append({
            id: `uplift-candidates-${ver.name}`,
            $container: $container,
            title: `${ver.version} (${ver.title}) Fixed, Affecting Prior Versions`,
            description:
                "Candidates for uplift/backport consideration.\n" +
                "Bugs with all of the following:\n" +
                `- status-firefox${ver.version} set to fixed or verified\n` +
                `- any status-firefox${FLOOR_VERSION}..${ver.version - 1} set to ` +
                "affected, fix-optional, or ?\n" +
                "Bugs are ordered by creation date, oldest first.",
            lazyLoad: true,
            urlsBuilder: () => {
                const chunkCount = Math.ceil(
                    (ver.version - FLOOR_VERSION) / CHUNK_SIZE,
                );
                return Array.from({ length: chunkCount }, (_, i) => {
                    const startVersion = FLOOR_VERSION + i * CHUNK_SIZE;
                    const endVersion = Math.min(startVersion + CHUNK_SIZE, ver.version);
                    const count = endVersion - startVersion;
                    const query = {
                        resolution: ["---", "FIXED"],
                        f1: `cf_status_firefox${ver.version}`,
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
