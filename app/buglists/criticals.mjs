import * as BugList from "buglist";

/* eslint-disable camelcase */

export function init($container) {
    BugList.append({
        id: "criticals",
        $container: $container,
        title: "Critical (S2) Defects",
        description:
            "Critical (S2) defects. " +
            "Bugs with stalled or meta keywords are ignored.\n" +
            "Bugs are order by last updated, oldest first.\n" +
            "Timestamp shows last modified.",
        query: {
            resolution: "---",
            f1: "bug_severity",
            o1: "anyexact",
            v1: "s2,critical",
            f2: "cf_status_firefox_nightly",
            o2: "nowords",
            v2: "fixed,verified,wontfix,disabled,unaffected",
            f3: "keywords",
            o3: "notsubstring",
            v3: "stalled",
            f4: "keywords",
            o4: "notsubstring",
            v4: "stalled",
            f5: "bug_type",
            o5: "equals",
            v5: "defect",
        },
        usesComponents: true,
        augment: (bug) => {
            bug.timestamp_ago = bug.updated_ago;
            bug.timestamp = bug.updated;
        },
        order: (a, b) => a.updated_epoch - b.updated_epoch,
    });
}
