import * as BugList from "buglist";

export function init($container) {
    BugList.append({
        id: "stalled",
        $container: $container,
        title: "Stalled Defects",
        description:
            "Defects with the stalled keyword excluding those with an open NEEDINFO.\n" +
            "Bugs are order by creation date, oldest first.\n" +
            "Timestamp shows bug creation.",
        query: {
            resolution: "---",
            keywords: "stalled",
            f1: "bug_type",
            o1: "equals",
            v1: "defect",
            f2: "flagtypes.name",
            o2: "notsubstring",
            v2: "needinfo",
        },
        usesComponents: true,
    });
}
