import * as BugList from "buglist";
import * as Bugzilla from "bugzilla";

/* eslint-disable camelcase */

export function init($container) {
    const d = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 * 4);
    const sinceYMD = d.toISOString().split("T")[0];

    BugList.append({
        id: "assigned-inactive",
        $container: $container,
        title: "Assigned Without Recent Activity",
        description:
            "Defects with an assignee that haven't been updated by the " +
            "assignee with the last 4 weeks.  Bugs with the stalled keyword " +
            "or open NEEDINFO requests are ignored.\n" +
            "Bugs are order by last updated, oldest first.\n" +
            "Timestamp shows last time bug was updated by anyone.",
        query: {
            email1: "nobody@mozilla.org",
            emailassigned_to1: "1",
            emailtype1: "notequals",
            resolution: "---",
            keywords_type: "nowords",
            keywords: "stalled",
            f1: "bug_type",
            o1: "equals",
            v1: "defect",
        },
        usesComponents: true,
        lazyLoad: true,
        limit: 200, // this list is expensive, use a small limit to avoid hitting http.429
        include: async (bug) => {
            // exclude bugs with open needinfo requests that aren't self-ni
            for (const ni of bug.needinfos) {
                if (ni.setter !== ni.requestee) {
                    return false;
                }
            }
            // check for comments by the assignee
            let res = await Bugzilla.rest(`bug/${bug.id}/comment`, {
                new_since: sinceYMD,
            });
            let entries = res.bugs[bug.id].comments;
            for (const comment of entries) {
                if (comment.creator === bug.assigned_to) {
                    return false;
                }
            }
            // check for other activity by the assignee
            res = await Bugzilla.rest(`bug/${bug.id}/history`, { new_since: sinceYMD });
            entries = res.bugs[0].history;
            for (const entry of entries) {
                if (entry.who === bug.assigned_to) {
                    return false;
                }
            }
            return true;
        },
        augment: (bug) => {
            bug.timestamp_ago = bug.updated_ago;
            bug.timestamp = bug.updated;
        },
        order: (a, b) => a.updated_epoch - b.updated_epoch,
    });
}
