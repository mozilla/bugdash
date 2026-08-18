import * as BugList from "buglist";
import * as Releases from "releases";

/* eslint-disable camelcase */

export function init($container) {
    for (const chan of Releases.channels("nightly", "beta", "release")) {
        BugList.append({
            id: `regressions-${chan.name}-new`,
            $container: $container,
            title: `${chan.version} (${chan.title}) New Regressions`,
            description:
                "Bugs with all of the following:\n" +
                "- regression keyword\n" +
                `- status-firefox${chan.version} set to affected\n` +
                `- status-firefox${chan.previous} set to any of unaffected ? ---\n` +
                "Bugs with any of the following are ignored:\n" +
                "- open NEEDINFO request\n" +
                `- tracking-firefox${chan.version} is -\n` +
                "- stalled or intermittent-failure keywords\n" +
                "Bugs are order by last updated, oldest first.\n" +
                "Timestamp shows last modified.",
            query: {
                keywords: "regression",
                keywords_type: "allwords",
                resolution: "---",
                f1: `cf_status_firefox${chan.version}`,
                o1: "equals",
                v1: "affected",
                f2: "OP",
                j2: "OR",
                f3: `cf_status_firefox${chan.previous}`,
                o3: "equals",
                v3: "unaffected",
                f4: `cf_status_firefox${chan.previous}`,
                o4: "equals",
                v4: "?",
                f5: `cf_status_firefox${chan.previous}`,
                o5: "equals",
                v5: "---",
                f6: "CP",
                f7: "flagtypes.name",
                o7: "notsubstring",
                v7: "needinfo",
                f8: `cf_tracking_firefox${chan.version}`,
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
            id: `regressions-${chan.name}-carryover`,
            $container: $container,
            title: `${chan.version} (${chan.title}) Carry Over Regressions`,
            description:
                "Bugs with all of the following:\n" +
                "- regression keyword\n" +
                `- status-firefox${chan.version} set to affected\n` +
                "Bugs with any of the following are ignored:\n" +
                `- status-firefox${chan.previous} set to any of unaffected ? ---\n` +
                "- open NEEDINFO request\n" +
                `- tracking-firefox${chan.version} is -\n` +
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
                f1: `cf_status_firefox${chan.version}`,
                o1: "equals",
                v1: "affected",
                n2: "1",
                j2: "OR",
                f2: "OP",
                o3: "equals",
                v3: "unaffected",
                f3: `cf_status_firefox${chan.previous}`,
                f4: `cf_status_firefox${chan.previous}`,
                o4: "equals",
                v4: "?",
                f5: `cf_status_firefox${chan.previous}`,
                o5: "equals",
                v5: "---",
                f6: "CP",
                o7: "notsubstring",
                v7: "needinfo",
                f7: "flagtypes.name",
                f8: `cf_tracking_firefox${chan.version}`,
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
