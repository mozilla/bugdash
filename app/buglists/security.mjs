import * as BugList from "buglist";
import * as Bugzilla from "bugzilla";
import { _, __ } from "util";

/* eslint-disable camelcase */

const SEC_LEVELS = ["sec-critical", "sec-high", "sec-moderate", "sec-low"];

function keywordOrder(k) {
    const i = SEC_LEVELS.indexOf(k);
    if (i !== -1) return i;
    if (k === "stalled") return SEC_LEVELS.length;
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
            keywords_type: "anywords",
            keywords: SEC_LEVELS.join(","),
            f1: "bug_group",
            o1: "isnotempty",
            v1: "",
        },
        usesComponents: true,
        lazyLoad: true,
        augment: (bug) => {
            bug.timestamp_ago = bug.updated_ago;
            bug.timestamp = bug.updated;
            const keywords = bug.keywords.split(" ");
            bug.sec_level = SEC_LEVELS.find((l) => keywords.includes(l));
            bug.sec_index = SEC_LEVELS.findIndex((l) => keywords.includes(l));
            bug.stalled = keywords.includes("stalled");
        },
        augmentRow: ($row, bug) => {
            const $keywords = _($row, ".keywords");
            $keywords.innerHTML = $keywords.textContent
                .split(" ")
                .sort((a, b) => keywordOrder(a) - keywordOrder(b) || a.localeCompare(b))
                .map((k) => {
                    if (SEC_LEVELS.includes(k))
                        return `<span class="sec-keyword">${k}</span>`;
                    if (k === "stalled")
                        return `<span class="stalled-keyword">${k}</span>`;
                    return k;
                })
                .join(" ");
            if (bug.stalled) {
                for (const $tr of __($row, ".bug-row")) {
                    $tr.classList.add("stalled-bug");
                }
            }
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
