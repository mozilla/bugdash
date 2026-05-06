import * as BugList from "buglist";

/* eslint-disable camelcase */

export function init($container) {
    BugList.append({
        id: "triage-needed",
        $container: $container,
        title: "Triage Decision Needed",
        description:
            "Defects that have not been triaged (without a severity). " +
            "Bugs with a NEEDINFO request or with the meta keyword " +
            "are ignored.\n" +
            "Bugs are order by creation date, oldest first.\n" +
            "Timestamp shows bug creation.",
        query: {
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
        usesComponents: true,
    });
}
