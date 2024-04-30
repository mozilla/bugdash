import * as BugList from "buglist";

/* eslint-disable camelcase */

export function init($container) {
    BugList.append({
        id: "long-defects",
        $container: $container,
        title: "Longstanding Defects > 365 days",
        description:
            "Defects have been open more than one year. " +
            "Bugs with a NEEDINFO request or with the intermittent_failure " +
            "keyword are ignored.\n" +
            "Bugs are order by creation date, oldest first.\n" +
            "Timestamp shows bug creation.",
        query: {
            resolution: "---",
            keywords_type: "nowords",
            keywords: "intermittent_failure",
            f1: "delta_ts",
            o1: "lessthan",
            v1: "365d",
            f2: "flagtypes.name",
            o2: "notsubstring",
            v2: "needinfo",
            f3: "bug_type",
            o3: "equals",
            v3: "defect",
        },
        usesComponents: true,
    });
}
