import * as BugList from "buglist";

/* eslint-disable camelcase */

function assignedSortKey(bug) {
    return bug.assigned_to === "nobody@mozilla.org" ? 0 : 1;
}

export function init($container, ver) {
    BugList.append({
        id: `reo-${ver.name}-new`,
        $container: $container,
        title: `${ver.nightly} (${ver.title}) New Bugs`,
        description:
            "Bugs with all of the following:\n" +
            "- regression keyword\n" +
            `- status-firefox${ver.nightly} set to affected\n` +
            `- status-firefox${ver.beta} set to any of unaffected ? ---\n` +
            "Bugs with any of the following are ignored:\n" +
            `- tracking-firefox${ver.nightly} is -\n` +
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
            f1: `cf_status_firefox${ver.nightly}`,
            o1: "equals",
            v1: "affected",
            f2: "OP",
            j2: "OR",
            f3: `cf_status_firefox${ver.beta}`,
            o3: "equals",
            v3: "unaffected",
            f4: `cf_status_firefox${ver.beta}`,
            o4: "equals",
            v4: "?",
            f5: `cf_status_firefox${ver.beta}`,
            o5: "equals",
            v5: "---",
            f6: "CP",
            f8: `cf_tracking_firefox${ver.nightly}`,
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
        id: `reo-${ver.name}-carryover`,
        $container: $container,
        title: `${ver.nightly} (${ver.title}) Carry Over Bugs`,
        description:
            "Bugs with all of the following:\n" +
            "- regression keyword\n" +
            `- status-firefox${ver.nightly} set to affected\n` +
            "Bugs with any of the following are ignored:\n" +
            `- status-firefox${ver.beta} set to any of unaffected ? ---\n` +
            `- tracking-firefox${ver.nightly} is -\n` +
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
            f1: `cf_status_firefox${ver.nightly}`,
            o1: "equals",
            v1: "affected",
            n2: "1",
            j2: "OR",
            f2: "OP",
            o3: "equals",
            v3: "unaffected",
            f3: `cf_status_firefox${ver.beta}`,
            f4: `cf_status_firefox${ver.beta}`,
            o4: "equals",
            v4: "?",
            f5: `cf_status_firefox${ver.beta}`,
            o5: "equals",
            v5: "---",
            f6: "CP",
            f8: `cf_tracking_firefox${ver.nightly}`,
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

    BugList.append({
        id: `reo-${ver.name}-burndown`,
        $container: $container,
        title: `${ver.nightly} (${ver.title}) Burndown List`,
        description:
            "Bugs with all of the following:\n" +
            `- status-firefox${ver.nightly} is affected or optional\n` +
            "- any of:\n" +
            "\u00A0\u00A0- crash regression leak topcrash assertion dataloss keywords\n" +
            "\u00A0\u00A0- in a security group\n" +
            `\u00A0\u00A0- tracking-firefox${ver.nightly} is + ? or blocking\n` +
            "Bugs with any of the following are ignored:\n" +
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
            resolution: "FIXED",
            f1: `cf_status_firefox${ver.nightly}`,
            o1: "anywords",
            v1: "affected optional",
            j2: "OR",
            f2: "OP",
            o3: "anywords",
            v3: "crash regression leak topcrash assertion dataloss",
            f3: "keywords",
            f4: "bug_group",
            o4: "substring",
            v4: "sec",
            f6: `cf_tracking_firefox${ver.nightly}`,
            o6: "anywordssubstr",
            v6: "+ ? blocking",
            f7: "CP",
            f9: "product",
            o9: "notequals",
            v9: "Testing",
        },
    });
}
