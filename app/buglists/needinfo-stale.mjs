import * as BugList from "buglist";

/* eslint-disable camelcase */

export function init($container) {
    BugList.append({
        id: "needinfo-stale",
        $container: $container,
        template: "needinfo",
        title: "NEEDINFO > 14 Days",
        description:
            "NEEDINFO requests older than 14 days, excluding self-NEEDINFOs " +
            "and bugs with the stalled keyword.\n" +
            "Timestamp shows the oldest needinfo request.",
        query: {
            resolution: "---",
            f1: "flagtypes.name",
            o1: "substring",
            v1: "needinfo",
            f2: "keywords",
            o2: "notsubstring",
            v2: "stalled",
        },
        usesComponents: true,
        include: (bug) => {
            for (const ni of bug.needinfos) {
                if (ni.setter !== ni.requestee) {
                    return ni.age > 14;
                }
            }
            return false;
        },
        augment: (bug) => {
            let nickSuffix = "";
            let nameSuffix = "";
            if (bug.needinfos[0].requestee === bug.triage_owner) {
                nickSuffix = " (T)";
                nameSuffix = " (Triage Owner)";
            } else if (bug.needinfos[0].requestee === bug.creator) {
                nickSuffix = " (R)";
                nameSuffix = " (Reporter)";
            }
            bug.needinfo_nick = bug.needinfos[0].requestee_nick + nickSuffix;
            bug.needinfo_name = bug.needinfos[0].requestee_name + nameSuffix;
            bug.needinfo_date = bug.needinfos[0].date;
            bug.needinfo_ago = bug.needinfos[0].ago;
            bug.needinfo_epoch = bug.needinfos[0].epoch;
        },
        order: (a, b) => a.needinfo_epoch - b.needinfo_epoch,
    });
}
