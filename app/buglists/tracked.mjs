import * as BugList from "buglist";
import * as Global from "global";

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
            description:
                `Bugs with tracking-firefox${ver.version} set to +\n` +
                "Bugs are order by creation date, oldest first.",
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
       
    const $group = BugList.newGroup($container);
        BugList.append({
            //TODO: I do not know what the id formatting is so I need to investigate
            //and i just copy pasted and edited the title
            id: `beta-open-blockers-${usesComponents}`,
            $container: $group,
            title: `${releases.beta.version} (Beta) Functional Open Blockers`,
            description: "TODO",
            //TODO: Some of these params come from old queries that might 
            //need to be cleaned up later, but out of scope 
            query: {
                classification: [
                    "Client Software",
                    "Components",
                    "Developer Infrastructure",
                    "Other",
                    "Server Software",
                ],
                bug_file_loc_type: "allwordssubstr",
                bug_id_type: "anyexact",
                emailassigned_to1: "1",
                emailassigned_to2: "1",
                emailqa_contact2: "1",
                emailreporter2: "1",
                emailtype1: "exact",
                emailtype2: "exact",
                emailtype3: "substring",
                f1: "cf_status_firefox_beta",
                f2: "cf_tracking_firefox_beta",
                j_top: "AND",
                keywords_type: "allwords",
                longdesc_type: "allwordssubstr",
                o1: "equals",
                o2: "equals",
                resolution: "---",
                short_desc_type: "allwordssubstr",
                status_whiteboard_type: "allwordssubstr",
                v1: "affected",
                v2: "blocking",
                votes_type: "greaterthaneq",
            },
            usesComponents: usesComponents,
        });

        BugList.append({
            id: `beta-unfixed-new-regressions-${usesComponents}`,
            $container: $group,
            title: `${releases.beta.version} (Beta) Unfixed New Regressions`,
            //TODO:add a cool description like glob has
            description: "",
            query: {
                classification: [
                    "Client Software",
                    "Components",
                    "Developer Infrastructure",
                    "Other",
                    "Server Software",
                ],
                chfield: "regresses",
                f1: "cf_status_firefox_beta",
                f2: "cf_status_firefox_release",
                f3: "reporter",
                j_top: "AND",
                keywords: "regression",
                keywords_type: "allwords",
                longdesc_type: "allwordssubstr",
                o1: "anyexact",
                o2: "anyexact",
                o3: "notsubstring",
                resolution: ["FIXED", "---"],
                v1: "affected, fix-optional, wontfix",
                v2: "disabled, unaffected, ---",
                v3: "intermittent-bug-filer@mozilla.bugs",
            },
            usesComponents: usesComponents,
        });

        BugList.append({
            id: `beta-open-carryover-regressions-${usesComponents}`,
            $container: $group,
            title: `${releases.beta.version} (Beta) Open Carryover Regressions`,
            //TODO:add a cool description like glob has
            description: "",
            query: {
                classification: [
                    "Client Software",
                    "Components",
                    "Developer Infrastructure",
                    "Other",
                    "Server Software",
                ],
                bug_file_loc_type: "allwordssubstr",
                bug_id_type: "anyexact",
                emailtype1: "substring",
                emailtype2: "substring",
                emailtype3: "substring",
                f1: "cf_status_firefox_beta",
                f2: "OP",
                f3: "cf_status_firefox_release",
                f4: "cf_status_firefox_release",
                f5: "cf_status_firefox_release",
                f6: "CP",
                f7: "reporter",
                j2: "OR",
                j_top: "AND",
                keywords: "regression,",
                keywords_type: "allwords",
                longdesc_type: "allwordssubstr",
                o1: "equals",
                o3: "equals",
                o4: "equals",
                o5: "equals",
                o7: "notsubstring",
                short_desc_type: "allwordssubstr",
                status_whiteboard_type: "allwordssubstr",
                v1: "affected",
                v3: "affected",
                v4: "fix-optional",
                v5: "wontfix",
                v7: "intermittent-bug-filer@mozilla.bugs",
                votes_type: "greaterthaneq",
            },
            usesComponents: usesComponents,
        });

        BugList.append({
            id: `beta-severe-carryover-regressions-${usesComponents}`,
            $container: $group,
            title: `${releases.beta.version} (Beta) Severe Carryover Regressions`,
            description: "",
            query: {
                classification: [
                    "Client Software",
                    "Components",
                    "Developer Infrastructure",
                    "Other",
                    "Server Software",
                ],
                bug_severity: ["blocker", "S1", "critical", "S2", "major"],
                bug_file_loc_type: "allwordssubstr",
                bug_id_type: "anyexact",
                f1: "cf_status_firefox_beta",
                f2: "OP",
                f3: "cf_status_firefox_release",
                f4: "cf_status_firefox_release",
                f5: "cf_status_firefox_release",
                f6: "CP",
                j2: "OR",
                keywords: "regression",
                keywords_type: "allwords",
                longdesc_type: "allwordssubstr",
                o1: "equals",
                o3: "equals",
                o4: "equals",
                o5: "equals",
                short_desc_type: "allwordssubstr",
                status_whiteboard_type: "allwordssubstr",
                v1: "affected",
                v3: "affected",
                v4: "fix-optional",
                v5: "wontfix",
                votes_type: "greaterthaneq",
            },
            usesComponents: usesComponents,
        });

        BugList.append({
            id: `beta-new-top-crashers-${usesComponents}`,
            $container: $group,
            title: `${releases.beta.version} (Beta) New Top Crashers`,
            //TODO:add a cool description like glob has
            description: "",
            query: {
                classification: [
                    "Client Software",
                    "Components",
                    "Developer Infrastructure",
                    "Other",
                    "Server Software",
                ],
                f1: "cf_status_firefox_beta",
                f2: "cf_tracking_firefox_beta",
                keywords: "crash, topcrash",
                keywords_type: "anywords",
                longdesc_type: "allwordssubstr",
                o1: "equals",
                o2: "anyexact",
                resolution: "---",
                short_desc_type: "allwordssubstr",
                status_whiteboard_type: "allwordssubstr",
                v1: "affected",
                v2: "+,blocking",
                votes_type: "greaterthaneq",
            },
            usesComponents: usesComponents,
        });

        BugList.append({
            id: `beta-tracked-crashers-${usesComponents}`,
            $container: $group,
            title: `${releases.beta.version} (Beta) Tracked Crashers`,
            //TODO:add a cool description like glob has
            description: "",
            query: {
                classification: [
                    "Client Software",
                    "Components",
                    "Developer Infrastructure",
                    "Other",
                    "Server Software",
                ],
                f1: "cf_status_firefox_beta",
                f2: "cf_status_firefox_release",
                keywords: "topcrash",
                keywords_type: "anywords",
                longdesc_type: "allwordssubstr",
                o1: "equals",
                o2: "anywordssubstr",
                short_desc_type: "allwordssubstr",
                status_whiteboard_type: "allwordssubstr",
                v1: "affected",
                v2: "unaffected, ---",
                votes_type: "greaterthaneq",
            },
            usesComponents: usesComponents,
        });

        BugList.append({
            id: `beta-perf-bug-affecting-beta-${usesComponents}`,
            $container: $group,
            title: `${releases.beta.version} (Beta) Performance Bugs Affecting Beta`,
            //TODO:add a cool description like glob has
            description: "",
            query: {
                classification: [
                    "Client Software",
                    "Components",
                    "Developer Infrastructure",
                    "Other",
                    "Server Software",
                ],
                f1: "cf_status_firefox_beta",
                f2: "OP",
                f3: "cf_status_firefox_release",
                f4: "cf_status_firefox_release",
                f5: "cf_status_firefox_release",
                f6: "CP",
                f7: "flagtypes.name",
                f8: "cf_tracking_firefox_beta",
                f9: "product",
                f10: "keywords",
                f11: "product",
                f12: "resolution",
                j2: "OR",
                keywords: "regression, perf",
                keywords_type: "allwords",
                longdesc_type: "allwordssubstr",
                o1: "equals",
                o3: "equals",
                o4: "equals",
                o5: "equals",
                o7: "notsubstring",
                o8: "notequals",
                o9: "notequals",
                o10: "notsubstring",
                o11: "notequals",
                o12: "nowordssubstr",
                resolution: "---",
                short_desc_type: "allwordssubstr",
                status_whiteboard_type: "allwordssubstr",
                v1: "affected",
                v3: "unaffected",
                v4: "?",
                v5: "---",
                v7: "needinfo",
                v8: "-",
                v9: "Testing",
                v10: "stalled",
                v11: "Geckoview",
                v12: "DUPLICATE,WONTFIX,INVALID",
                votes_type: "greaterthaneq",
            },
            usesComponents: usesComponents,
        });

        BugList.append({
            id: `beta-sec-all-high-crit-affecting-beta-${usesComponents}`,
            $container: $group,
            title: `${releases.beta.version} (Beta) Sec-High/Sec-All/Sec-Crit Affecting Beta`,
            //TODO:add a cool description like glob has
            description: "",
            query: {
                classification: [
                    "Client Software",
                    "Components",
                    "Developer Infrastructure",
                    "Other",
                    "Server Software",
                ],
                f1: "cf_status_firefox_beta",
                f2: "keywords",
                keywords: "sec-high sec-critical",
                keywords_type: "anywords",
                longdesc_type: "allwordssubstr",
                o1: "anywords",
                o2: "notsubstring",
                short_desc_type: "allwordssubstr",
                status_whiteboard_type: "allwordssubstr",
                v1: "affected fix-optional",
                v2: "stalled",
                votes_type: "greaterthaneq",
            },
            usesComponents: usesComponents,
        });
    
}
