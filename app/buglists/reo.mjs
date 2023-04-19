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
            id: `reo-${ver.name}-new`,
            $container: $container,
            title: `${ver.nightly} (${ver.title}) New Bugs`,
            description: "TODO",
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
                f9: "product",
                o9: "notequals",
                v9: "Testing",
                f10: "keywords",
                o10: "nowordssubstr",
                v10: "stalled,intermittent-failure",
                f11: "product",
                o11: "notequals",
                v11: "Geckoview",
            },
        });

        BugList.append({
            id: `reo-${ver.name}-new-ni`,
            $container: $container,
            template: "needinfo",
            title: `${ver.nightly} (${ver.title}) New Bugs With NEEDINFO`,
            description: "TODO",
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
                o1: "equals",
                v1: "affected",
                f1: `cf_status_firefox${ver.nightly}`,
                j2: "OR",
                f2: "OP",
                o3: "equals",
                v3: "unaffected",
                f3: `cf_status_firefox${ver.beta}`,
                o4: "equals",
                v4: "?",
                f4: `cf_status_firefox${ver.beta}`,
                o5: "equals",
                v5: "---",
                f5: `cf_status_firefox${ver.beta}`,
                f6: "CP",
                o7: "anywordssubstr",
                v7: "needinfo",
                f7: "flagtypes.name",
                f8: `cf_tracking_firefox${ver.nightly}`,
                v8: "-",
                o8: "notequals",
                o9: "notequals",
                v9: "Testing",
                f9: "product",
                v10: "stalled,intermittent-failure",
                f10: "keywords",
                o10: "nowordssubstr",
            },
            augment: (bug) => {
                let nickSuffix = "";
                let nameSuffix = "";
                if (bug.needinfos[0].requestee === bug.triage_owner) {
                    nickSuffix = " (T)";
                    nameSuffix = " (Triage Owner)";
                } else if (bug.needinfos[0].requestee === bug.creator) {
                    nickSuffix = " (R)";
                    nameSuffix = " (Reporter)";
                }
                bug.needinfo_nick = bug.needinfos[0].requestee_nick + nickSuffix;
                bug.needinfo_name = bug.needinfos[0].requestee_name + nameSuffix;
                bug.needinfo_date = bug.needinfos[0].date;
                bug.needinfo_ago = bug.needinfos[0].ago;
                bug.needinfo_epoch = bug.needinfos[0].epoch;
            },
            order: (a, b) => a.needinfo_epoch - b.needinfo_epoch,
        });

        BugList.append({
            id: `reo-${ver.name}-carryover`,
            $container: $container,
            title: `${ver.nightly} (${ver.title}) Carry Over Bugs`,
            description: "TODO",
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
                v4: "?",
                f4: `cf_status_firefox${ver.beta}`,
                o4: "equals",
                o5: "equals",
                v5: "---",
                f5: `cf_status_firefox${ver.beta}`,
                f6: "CP",
                o7: "notsubstring",
                v7: "needinfo",
                f7: "flagtypes.name",
                f8: `cf_tracking_firefox${ver.nightly}`,
                v8: "-",
                o8: "notequals",
                o9: "notequals",
                f9: "product",
                v9: "Testing",
                f10: "keywords",
                v10: "stalled,intermittent-failure",
                o10: "nowordssubstr",
            },
        });

        BugList.append({
            id: `reo-${ver.name}-carryover-ni`,
            $container: $container,
            template: "needinfo",
            title: `${ver.nightly} (${ver.title}) Carry Over Bugs With NEEDINFO`,
            description: "TODO",
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
                v4: "?",
                f4: `cf_status_firefox${ver.beta}`,
                o4: "equals",
                o5: "equals",
                v5: "---",
                f5: `cf_status_firefox${ver.beta}`,
                f6: "CP",
                o7: "anywordssubstr",
                v7: "needinfo",
                f7: "flagtypes.name",
                f8: `cf_tracking_firefox${ver.nightly}`,
                v8: "-",
                o8: "notequals",
                o9: "notequals",
                f9: "product",
                v9: "Testing",
                f10: "keywords",
                v10: "stalled,intermittent-failure",
                o10: "nowordssubstr",
            },
            augment: (bug) => {
                let nickSuffix = "";
                let nameSuffix = "";
                if (bug.needinfos[0].requestee === bug.triage_owner) {
                    nickSuffix = " (T)";
                    nameSuffix = " (Triage Owner)";
                } else if (bug.needinfos[0].requestee === bug.creator) {
                    nickSuffix = " (R)";
                    nameSuffix = " (Reporter)";
                }
                bug.needinfo_nick = bug.needinfos[0].requestee_nick + nickSuffix;
                bug.needinfo_name = bug.needinfos[0].requestee_name + nameSuffix;
                bug.needinfo_date = bug.needinfos[0].date;
                bug.needinfo_ago = bug.needinfos[0].ago;
                bug.needinfo_epoch = bug.needinfos[0].epoch;
            },
            order: (a, b) => a.needinfo_epoch - b.needinfo_epoch,
        });

        BugList.append({
            id: `reo-${ver.name}-burndown`,
            $container: $container,
            title: `${ver.nightly} (${ver.title}) Burndown List`,
            description: "TODO",
            query: {
                classification: [
                    "Client Software",
                    "Components",
                    "Developer Infrastructure",
                    "Other",
                    "Server Software",
                ],
                resolution: "FIXED",
                f1: `cf_status_firefox${ver.nightly}`,
                o1: "anywords",
                v1: "affected optional",
                j2: "OR",
                f2: "OP",
                o3: "anywords",
                v3: "crash regression leak topcrash assertion dataloss",
                f3: "keywords",
                v4: "sec",
                f4: "bug_group",
                o4: "substring",
                v6: "+ ? blocking",
                o6: "anywordssubstr",
                f6: `cf_tracking_firefox${ver.nightly}`,
                f7: "CP",
                f9: "product",
                o9: "notequals",
                v9: "Testing",
            },
        });

        $container.append(document.createElement("br"));
    }
}
