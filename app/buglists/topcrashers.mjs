import * as BugList from "buglist";

/* eslint-disable camelcase */

export function init($container) {
    BugList.append({
        id: "topcrashers",
        $container: $container,
        title: "Top Crashers",
        description:
            "Bugs with the 'topcrash' keyword.\n" +
            "Bugs are order by last updated, oldest first.\n" +
            "Timestamp shows last modified.",
        query: {
            resolution: "---",
            f1: "keywords",
            o1: "substring",
            v1: "topcrash",
        },
        usesComponents: true,
        augment: (bug) => {
            bug.timestamp_ago = bug.updated_ago;
            bug.timestamp = bug.updated;
        },
        order: (a, b) => a.updated_epoch - b.updated_epoch,
    });
}
