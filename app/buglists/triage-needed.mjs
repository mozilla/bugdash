import * as BugList from "buglist";

/* eslint-disable camelcase */

export function init($container) {
    BugList.append({
        id: "triage-needed",
        $container: $container,
        title: "Triage Decision Needed",
        description:
            "Bugs that have not been triaged (without a severity). " +
            "Bugs with the meta keyword are ignored.\n" +
            "Timestamp shows bug creation.",
        query: {
            email1: "wptsync@mozilla.bugs",
            emailreporter1: "1",
            emailtype1: "notequals",
            resolution: "---",
            keywords_type: "nowords",
            keywords: "intermittent_failure",
            f1: "bug_type",
            o1: "equals",
            v1: "defect",
            f2: "flagtypes.name",
            o2: "notsubstring",
            v2: "needinfo",
            f3: "bug_severity",
            o3: "anyexact",
            v3: "--, n/a",
            f4: "keywords",
            o4: "notsubstring",
            v4: "meta",
        },
    });
}
