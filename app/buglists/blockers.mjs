import * as BugList from "buglist";

/* eslint-disable camelcase */

export function init($container) {
    BugList.append({
        id: "blockers",
        $container: $container,
        title: "Blocker (S1) Defects",
        description:
            "Blocker (S1) defects without a pending NEEDINFOs. " +
            "Bugs with the stalled keyword are ignored.\n" +
            "Timestamp shows last modified.",
        query: {
            resolution: "---",
            f1: "bug_severity",
            o1: "anyexact",
            v1: "s1,blocker",
            f2: "flagtypes.name",
            o2: "notsubstring",
            v2: "needinfo",
            f3: "cf_status_firefox_nightly",
            o3: "nowords",
            v3: "fixed,verified,wontfix,disabled,unaffected",
            f4: "keywords",
            o4: "notsubstring",
            v4: "stalled",
        },
        usesComponents: true,
        augment: (bug) => {
            bug.timestamp_ago = bug.updated_ago;
            bug.timestamp = bug.updated;
        },
        order: (a, b) => a.updated_epoch - b.updated_epoch,
    });
}
