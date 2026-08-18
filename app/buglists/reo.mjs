import * as BugList from "buglist";

/* eslint-disable camelcase */

function assignedSortKey(bug) {
    return bug.assigned_to === "nobody@mozilla.org" ? 0 : 1;
}

export function init($container, chan) {
    BugList.append({
        id: `reo-${chan.name}-new`,
        $container: $container,
        title: `${chan.version} (${chan.title}) New Bugs`,
        description:
            "Bugs with all of the following:\n" +
            "- regression keyword\n" +
            `- status-firefox${chan.version} set to affected\n` +
            `- status-firefox${chan.previous} set to any of unaffected ? ---\n` +
            "Bugs with any of the following are ignored:\n" +
            `- tracking-firefox${chan.version} is -\n` +
            "- stalled or intermittent-failure keywords\n" +
            "- within the Testing product\n" +
            "Bugs are order by creation date, oldest first.",
        query: {
            classification: [
                "Client Software",
                "Components",
                "Developer Infrastructure",
                "Other",
                "Server Software",
            ],
            keywords: "regression",
            keywords_type: "allwords",
            resolution: "---",
            f1: `cf_status_firefox${chan.version}`,
            o1: "equals",
            v1: "affected",
            f2: "OP",
            j2: "OR",
            f3: `cf_status_firefox${chan.previous}`,
            o3: "equals",
            v3: "unaffected",
            f4: `cf_status_firefox${chan.previous}`,
            o4: "equals",
            v4: "?",
            f5: `cf_status_firefox${chan.previous}`,
            o5: "equals",
            v5: "---",
            f6: "CP",
            f8: `cf_tracking_firefox${chan.version}`,
            o8: "notequals",
            v8: "-",
            f9: "product",
            o9: "notequals",
            v9: "Testing",
            f10: "keywords",
            o10: "nowordssubstr",
            v10: "stalled,intermittent-failure",
        },
    });

    BugList.append({
        id: `reo-${chan.name}-carryover`,
        $container: $container,
        title: `${chan.version} (${chan.title}) Carry Over Bugs`,
        description:
            "Bugs with all of the following:\n" +
            "- regression keyword\n" +
            `- status-firefox${chan.version} set to affected\n` +
            "Bugs with any of the following are ignored:\n" +
            `- status-firefox${chan.previous} set to any of unaffected ? ---\n` +
            `- tracking-firefox${chan.version} is -\n` +
            "- stalled or intermittent-failure keywords\n" +
            "- within the Testing product\n" +
            "Bugs are order by unassigned, then by last updated (oldest first)",
        query: {
            classification: [
                "Client Software",
                "Components",
                "Developer Infrastructure",
                "Other",
                "Server Software",
            ],
            keywords: "regression",
            keywords_type: "allwords",
            resolution: "---",
            f1: `cf_status_firefox${chan.version}`,
            o1: "equals",
            v1: "affected",
            n2: "1",
            j2: "OR",
            f2: "OP",
            o3: "equals",
            v3: "unaffected",
            f3: `cf_status_firefox${chan.previous}`,
            f4: `cf_status_firefox${chan.previous}`,
            o4: "equals",
            v4: "?",
            f5: `cf_status_firefox${chan.previous}`,
            o5: "equals",
            v5: "---",
            f6: "CP",
            f8: `cf_tracking_firefox${chan.version}`,
            o8: "notequals",
            v8: "-",
            f9: "product",
            o9: "notequals",
            v9: "Testing",
            f10: "keywords",
            o10: "nowordssubstr",
            v10: "stalled,intermittent-failure",
        },
        partialFields: ["assigned_to"],
        augment: (bug) => {
            bug.assigned_sortkey = assignedSortKey(bug);
        },
        order: (a, b) =>
            assignedSortKey(a) - assignedSortKey(b) ||
            a.updated_epoch - b.updated_epoch,
    });
}
