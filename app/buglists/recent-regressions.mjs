import * as BugList from "buglist";
import * as Global from "global";

/* eslint-disable camelcase */

export function init($container) {
    const releases = Global.releaseData();

    BugList.append({
        id: "recent-regressions",
        $container: $container,
        title: "Important Recent Regressions Without Decision",
        description:
            "Bugs with a regression keyword created since the start " +
            `of the current Beta cycle (${releases.beta.date}) that do not have both ` +
            `status-firefox${releases.beta.version} and ` +
            `status-firefox${releases.release.version} set.\n` +
            "Bugs with an open NEEDINFO request are ignored.\n" +
            "Timestamp shows bug creation.",
        query: {
            chfield: "[Bug creation]",
            chfieldfrom: releases.beta.date,
            chfieldto: "Now",
            keywords: "regression",
            keywords_type: "allwords",
            resolution: "---",
            f1: "OP",
            j1: "OR",
            f2: `cf_status_firefox${releases.release.version}`,
            o2: "nowords",
            v2: "affected,unaffected,fixed,verified,disabled,verified disabled,wontfix,fix-optional",
            f3: `cf_status_firefox${releases.beta.version}`,
            o3: "nowords",
            v3: "affected,unaffected,fixed,verified,disabled,verified disabled,wontfix,fix-optional",
            f4: "CP",
            f5: "priority",
            o5: "nowords",
            v5: "S1,S2",
            f6: "flagtypes.name",
            o6: "notsubstring",
            v6: "needinfo",
        },
        usesComponents: true,
    });
}
