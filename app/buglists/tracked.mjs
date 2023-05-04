import * as BugList from "buglist";
import * as Global from "global";

/* eslint-disable camelcase */

export function init($container, usesComponents) {
    const releases = Global.releaseData();

    const versions = [
        {
            name: "release",
            title: "Release",
            version: releases.release.version,
        },
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
            id: `tracked-${ver.name}-${usesComponents}`,
            $container: $container,
            title: `${ver.version} (${ver.title}) Tracked Bugs`,
            description: `Bugs with tracking-firefox${ver.version} set to +`,
            query: {
                classification: [
                    "Client Software",
                    "Components",
                    "Developer Infrastructure",
                    "Other",
                    "Server Software",
                ],
                resolution: "---",
                f1: `cf_tracking_firefox${ver.version}`,
                o1: "equals",
                v1: "+",
            },
            usesComponents: usesComponents,
        });
    }
}
