import * as BugList from "buglist";
import * as Bugzilla from "bugzilla";
import { _ } from "util";

/* eslint-disable camelcase */

const SEC_LEVELS = ["sec-critical", "sec-high", "sec-moderate", "sec-low"];

function keywordOrder(k) {
    const i = SEC_LEVELS.indexOf(k);
    if (i !== -1) return i;
    if (k === "sec-unrated") return SEC_LEVELS.length;
    return SEC_LEVELS.length + 1;
}

export function init($container) {
    BugList.append({
        id: "secbugs",
        $container: $container,
        title: "Security Bugs",
        description:
            "All non-public bugs with a security rating keyword.\n" +
            "Bugs are order by security level then last updated, oldest first.\n" +
            "Timestamp shows last time bug was updated by anyone.",
        query: {
            resolution: "---",
            f1: "bug_group",
            o1: "isnotempty",
            v1: "",
        },
        usesComponents: true,
        lazyLoad: true,
        include: (bug) => {
            // must be in a *-security group
            const groups = typeof bug.groups === "string" ? [bug.groups] : bug.groups;
            if (!groups.some((g) => g.endsWith("-security"))) return false;
            // must have either a SEC_LEVELS keyword, or no security (sec-*) keywords at all
            if (SEC_LEVELS.find((l) => bug.keywords.includes(l))) return true;
            return !bug.keywords.some((k) => k.startsWith("sec-"));
        },
        augment: (bug) => {
            bug.timestamp_ago = bug.updated_ago;
            bug.timestamp = bug.updated;
            bug.sec_level = SEC_LEVELS.find((l) => bug.keywords.includes(l));
            bug.sec_index = SEC_LEVELS.findIndex((l) => bug.keywords.includes(l));
            if (!bug.sec_level) {
                bug.keywords.push("sec-unrated");
            }
            bug.keywords.sort(
                (a, b) => keywordOrder(a) - keywordOrder(b) || a.localeCompare(b),
            );
        },
        order: (a, b) => {
            return a.sec_index - b.sec_index || a.updated_epoch - b.updated_epoch;
        },
        beforeRefresh: (buglist) => {
            _(buglist.$root, ".buglist-empty").textContent = Bugzilla.getApiKey()
                ? "No visible bugs"
                : "Bugzilla API-Key not set";
        },
    });
}
