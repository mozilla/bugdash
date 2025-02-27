import * as BugList from "buglist";
import * as Global from "global";

/* eslint-disable camelcase */

export function init($container) {
    const releases = Global.releaseData();

    const versions = [
        {
            name: "nightly",
            title: "Nightly",
            release: releases.release.version,
            beta: releases.beta.version,
            nightly: releases.nightly.version,
        },
        {
            name: "beta",
            title: "Beta",
            release: releases.release.version - 1,
            beta: releases.beta.version - 1,
            nightly: releases.nightly.version - 1,
        },
        {
            name: "release",
            title: "Release",
            release: releases.release.version - 2,
            beta: releases.beta.version - 2,
            nightly: releases.nightly.version - 2,
        },
    ];

    for (const ver of versions) {
        BugList.append({
            id: `regressions-${ver.name}-new`,
            $container: $container,
            title: `${ver.nightly} (${ver.title}) New Regressions`,
            description:
                "Bugs with all of the following:\n" +
                "- regression keyword\n" +
                `- status-firefox${ver.nightly} set to affected\n` +
                `- status-firefox${ver.beta} set to any of unaffected ? ---\n` +
                "Bugs with any of the following are ignored:\n" +
                "- open NEEDINFO request\n" +
                `- tracking-firefox${ver.nightly} is -\n` +
                "- stalled or intermittent-failure keywords\n" +
                "Bugs are order by last updated, oldest first.\n" +
                "Timestamp shows last modified.",
            query: {
                keywords: "regression",
                keywords_type: "allwords",
                resolution: "---",
                f1: `cf_status_firefox${ver.nightly}`,
                o1: "equals",
                v1: "affected",
                f2: "OP",
                j2: "OR",
                f3: `cf_status_firefox${ver.beta}`,
                o3: "equals",
                v3: "unaffected",
                f4: `cf_status_firefox${ver.beta}`,
                o4: "equals",
                v4: "?",
                f5: `cf_status_firefox${ver.beta}`,
                o5: "equals",
                v5: "---",
                f6: "CP",
                f7: "flagtypes.name",
                o7: "notsubstring",
                v7: "needinfo",
                f8: `cf_tracking_firefox${ver.nightly}`,
                o8: "notequals",
                v8: "-",
                f9: "keywords",
                o9: "nowordssubstr",
                v9: "stalled,intermittent-failure",
            },
            usesComponents: true,
            augment: (bug) => {
                bug.timestamp_ago = bug.updated_ago;
                bug.timestamp = bug.updated;
            },
            order: (a, b) => a.updated_epoch - b.updated_epoch,
        });

        BugList.append({
            id: `regressions-${ver.name}-carryover`,
            $container: $container,
            title: `${ver.nightly} (${ver.title}) Carry Over Regressions`,
            description:
                "Bugs with all of the following:\n" +
                "- regression keyword\n" +
                `- status-firefox${ver.nightly} set to affected\n` +
                "Bugs with any of the following are ignored:\n" +
                `- status-firefox${ver.beta} set to any of unaffected ? ---\n` +
                "- open NEEDINFO request\n" +
                `- tracking-firefox${ver.nightly} is -\n` +
                "- stalled or intermittent-failure keywords\n" +
                "Bugs are order by last updated, oldest first.\n" +
                "Timestamp shows last modified.",
            query: {
                classification: [
                    "Client Software",
                    "Components",
                    "Developer Infrastructure",
                    "Other",
                    "Server Software",
                ],
                keywords: "regression",
                keywords_type: "allwords",
                resolution: "---",
                f1: `cf_status_firefox${ver.nightly}`,
                o1: "equals",
                v1: "affected",
                n2: "1",
                j2: "OR",
                f2: "OP",
                o3: "equals",
                v3: "unaffected",
                f3: `cf_status_firefox${ver.beta}`,
                f4: `cf_status_firefox${ver.beta}`,
                o4: "equals",
                v4: "?",
                f5: `cf_status_firefox${ver.beta}`,
                o5: "equals",
                v5: "---",
                f6: "CP",
                o7: "notsubstring",
                v7: "needinfo",
                f7: "flagtypes.name",
                f8: `cf_tracking_firefox${ver.nightly}`,
                o8: "notequals",
                v8: "-",
                f9: "keywords",
                o9: "nowordssubstr",
                v9: "stalled,intermittent-failure",
            },
            usesComponents: true,
            augment: (bug) => {
                bug.timestamp_ago = bug.updated_ago;
                bug.timestamp = bug.updated;
            },
            order: (a, b) => a.updated_epoch - b.updated_epoch,
        });
    }
}
