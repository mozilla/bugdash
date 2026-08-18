import * as BugList from "buglist";
import * as Releases from "releases";

/* eslint-disable camelcase */

export function init($container) {
    const beta = Releases.channel("beta");
    const release = Releases.channel("release");

    BugList.append({
        id: "recent-regressions",
        $container: $container,
        title: "Important Recent Regressions Without Decision",
        description:
            "Bugs with a regression keyword created since the current Beta " +
            `version entered Nightly (${beta.nightlyStart}) that do not have both ` +
            `status-firefox${beta.version} and ` +
            `status-firefox${release.version} set.\n` +
            "Bugs with an open NEEDINFO request are ignored.\n" +
            "Bugs are order by creation date, oldest first.\n" +
            "Timestamp shows bug creation.",
        query: {
            chfield: "[Bug creation]",
            chfieldfrom: beta.nightlyStart,
            chfieldto: "Now",
            keywords: "regression",
            keywords_type: "allwords",
            resolution: "---",
            f1: "OP",
            j1: "OR",
            f2: `cf_status_firefox${release.version}`,
            o2: "nowords",
            v2: "affected,unaffected,fixed,verified,disabled,verified disabled,wontfix,fix-optional",
            f3: `cf_status_firefox${beta.version}`,
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
