import * as BugList from "buglist";
import * as Global from "global";

export function init($container, usesComponents) {
    const releases = Global.releaseData();

    BugList.append({
        id: "beta-open-blockers",
        $container: $container,
        title: `${releases.beta.version} (Beta) Functional Open Blockers`,
        description:
            "Bugs with all of the following:\n" +
            "- status-firefox-" +
            `${releases.beta.version}` +
            " set to affected\n" +
            "- tracking-firefox-" +
            `${releases.beta.version}` +
            " set to blocking\n" +
            "Bugs are order by creation date, oldest first.",
        query: {
            resolution: "---",
            f1: "cf_status_firefox_beta",
            o1: "equals",
            v1: "affected",
            f2: "cf_tracking_firefox_beta",
            o2: "equals",
            v2: "blocking",
        },
        usesComponents: usesComponents,
    });

    BugList.append({
        id: "beta-unfixed-new-regressions",
        $container: $container,
        title: `${releases.beta.version} (Beta) Unfixed New Regressions`,
        description:
            "Bugs with all of the following:\n" +
            "- regression keyword\n" +
            "- status-firefox-" +
            `${releases.beta.version}` +
            " set to any of affected fix-optional wontfix\n" +
            "- tracking-firefox-" +
            `${releases.release.version}` +
            " set to any of disabled unaffected ---\n" +
            "Bugs with any of the following are ignored:\n" +
            " - reporter is intermittent-bug-filer@mozilla.bugs\n" +
            "Bugs are order by creation date, oldest first.",
        query: {
            resolution: ["FIXED", "---"],
            keywords: "regression",
            keywords_type: "allwords",
            f1: "cf_status_firefox_beta",
            o1: "anyexact",
            v1: "affected, fix-optional, wontfix",
            f2: "cf_status_firefox_release",
            o2: "anyexact",
            v2: "disabled, unaffected, ---",
            f3: "reporter",
            o3: "notsubstring",
            v3: "intermittent-bug-filer@mozilla.bugs",
        },
        usesComponents: usesComponents,
    });

    BugList.append({
        id: "beta-open-carryover-regressions",
        $container: $container,
        title: `${releases.beta.version} (Beta) Open Carryover Regressions`,
        description:
            "Bugs with all of the following:\n" +
            "- regression keyword\n" +
            "- status-firefox-" +
            `${releases.beta.version}` +
            " set to affected \n" +
            "- tracking-firefox-" +
            `${releases.release.version}` +
            " set to any of affected fix-optional wonfix\n" +
            "Bugs with any of the following are ignored:\n" +
            " - reporter is intermittent-bug-filer@mozilla.bugs\n" +
            "Bugs are order by creation date, oldest first.",
        query: {
            keywords: "regression,",
            keywords_type: "allwords",
            f1: "cf_status_firefox_beta",
            o1: "equals",
            v1: "affected",
            f2: "OP",
            j2: "OR",
            f3: "cf_status_firefox_release",
            o3: "equals",
            v3: "affected",
            f4: "cf_status_firefox_release",
            o4: "equals",
            v4: "fix-optional",
            f5: "cf_status_firefox_release",
            o5: "equals",
            v5: "wontfix",
            f6: "CP",
            f7: "reporter",
            o7: "notsubstring",
            v7: "intermittent-bug-filer@mozilla.bugs",
        },
        usesComponents: usesComponents,
    });

    BugList.append({
        id: "beta-severe-carryover-regressions",
        $container: $container,
        title: `${releases.beta.version} (Beta) Severe Carryover Regressions`,
        description:
            "Bugs with all of the following:\n" +
            "- regression keyword\n" +
            "- severity set to any of blocker S1 critical S2 major\n" +
            "- status-firefox-" +
            `${releases.beta.version}` +
            " set to affected\n" +
            "- tracking-firefox-" +
            `${releases.release.version}` +
            " set to any of affected fix-optional wontfix\n" +
            "Bugs are order by creation date, oldest first.",
        query: {
            bug_severity: ["blocker", "S1", "critical", "S2", "major"],
            keywords: "regression",
            keywords_type: "allwords",
            f1: "cf_status_firefox_beta",
            o1: "equals",
            v1: "affected",
            f2: "OP",
            j2: "OR",
            f3: "cf_status_firefox_release",
            o3: "equals",
            v3: "affected",
            f4: "cf_status_firefox_release",
            o4: "equals",
            v4: "fix-optional",
            f5: "cf_status_firefox_release",
            o5: "equals",
            v5: "wontfix",
            f6: "CP",
        },
        usesComponents: usesComponents,
    });

    BugList.append({
        id: "beta-new-top-crashers",
        $container: $container,
        title: `${releases.beta.version} (Beta) New Top Crashers`,
        description:
            "Bugs with all of the following:\n" +
            "- crash or topcrash keyword\n" +
            "- status-firefox-" +
            `${releases.beta.version}` +
            " set to affected\n" +
            "- tracking-firefox-" +
            `${releases.beta.version}` +
            " set to blocking or +\n" +
            "Bugs are order by creation date, oldest first.",
        query: {
            resolution: "---",
            keywords: "crash, topcrash",
            keywords_type: "anywords",
            f1: "cf_status_firefox_beta",
            o1: "equals",
            v1: "affected",
            f2: "cf_tracking_firefox_beta",
            o2: "anyexact",
            v2: "+,blocking",
        },
        usesComponents: usesComponents,
    });

    BugList.append({
        id: "beta-tracked-crashers",
        $container: $container,
        title: `${releases.beta.version} (Beta) Tracked Crashers`,
        description:
            "Bugs with all of the following:\n" +
            "- topcrash keyword\n" +
            "- status-firefox-" +
            `${releases.beta.version}` +
            " set to affected\n" +
            "- tracking-firefox-" +
            `${releases.release.version}` +
            " set to any of unaffected ---\n" +
            "Bugs are order by creation date, oldest first.",
        query: {
            keywords: "topcrash",
            keywords_type: "anywords",
            f1: "cf_status_firefox_beta",
            o1: "equals",
            v1: "affected",
            f2: "cf_status_firefox_release",
            o2: "anywordssubstr",
            v2: "unaffected, ---",
        },
        usesComponents: usesComponents,
    });

    BugList.append({
        id: "beta-perf-bug-affecting-beta",
        $container: $container,
        title: `${releases.beta.version} (Beta) Performance Bugs Affecting Beta`,
        description:
            "Bugs with all of the following:\n" +
            "- regression or perf keyword\n" +
            "- status-firefox-" +
            `${releases.beta.version}` +
            " set to affected\n" +
            "- tracking-firefox-" +
            `${releases.release.version}` +
            " set to any of unaffected ? ---\n" +
            "Bugs with any of the following are ignored:\n" +
            "- status-firefox" +
            `${releases.beta.version}` +
            " set to -\n" +
            "- stalled keywords\n" +
            "- Resolution set to any DUPLICATE WONTFIX INVALID\n" +
            "- within the Testing products\n" +
            "Bugs are order by creation date, oldest first.",
        query: {
            resolution: "---",
            keywords: "regression, perf",
            keywords_type: "allwords",
            f1: "cf_status_firefox_beta",
            o1: "equals",
            v1: "affected",
            f2: "OP",
            j2: "OR",
            f3: "cf_status_firefox_release",
            o3: "equals",
            v3: "unaffected",
            f4: "cf_status_firefox_release",
            o4: "equals",
            v4: "?",
            f5: "cf_status_firefox_release",
            o5: "equals",
            v5: "---",
            f6: "CP",
            f7: "flagtypes.name",
            o7: "notsubstring",
            v7: "needinfo",
            f8: "cf_tracking_firefox_beta",
            o8: "notequals",
            v8: "-",
            f9: "product",
            o9: "notequals",
            v9: "Testing",
            f10: "keywords",
            o10: "notsubstring",
            v10: "stalled",
            f11: "product",
            o11: "notequals",
            v11: "Geckoview",
            f12: "resolution",
            o12: "nowordssubstr",
            v12: "DUPLICATE,WONTFIX,INVALID",
        },
        usesComponents: usesComponents,
    });

    BugList.append({
        id: "beta-sec-high-crit-affecting-beta",
        $container: $container,
        title: `${releases.beta.version} (Beta) Sec-High/Sec-Crit Affecting Beta`,
        description:
            "Bugs with all of the following:\n" +
            "- sec-high or sec-crit keyword\n" +
            "- status-firefox-" +
            `${releases.beta.version}` +
            " set to any of affected fix-optional\n" +
            "Bugs with any of the following are ignored:\n" +
            "- stalled keywords\n" +
            "Bugs are order by creation date, oldest first.",
        query: {
            keywords: "sec-high, sec-critical",
            keywords_type: "anywords",
            f1: "cf_status_firefox_beta",
            o1: "anywords",
            v1: "affected fix-optional",
            f2: "keywords",
            o2: "notsubstring",
            v2: "stalled",
        },
        usesComponents: usesComponents,
    });
}
