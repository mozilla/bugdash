import * as BugList from "buglist";

export function init($container) {
    BugList.append({
        id: "blockers",
        $container: $container,
        title: "Unassigned Blocker (S1) Defects",
        description:
            "Blocker (S1) defects without an assignee and no pending NEEDINFOs. " +
            "Bugs with the stalled keyword are ignored.\n" +
            "Timestamp shows bug creation.",
        query: {
            resolution: "---",
            f1: "bug_severity",
            o1: "anyexact",
            v1: "s1,blocker",
            f2: "assigned_to",
            o2: "equals",
            v2: "nobody@mozilla.org",
            f3: "flagtypes.name",
            o3: "notsubstring",
            v3: "needinfo",
            f4: "cf_status_firefox_nightly",
            o4: "nowords",
            v4: "fixed,verified,wontfix,disabled,unaffected",
            f5: "keywords",
            o5: "notsubstring",
            v5: "stalled",
        },
    });
}
