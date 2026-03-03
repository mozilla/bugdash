import * as BugList from "buglist";
import { _ } from "util";

/* eslint-disable camelcase */

export function init($container) {
    BugList.append({
        id: "secbugs",
        $container: $container,
        title: "Security Bugs",
        description:
            "All non-public bugs with a sec-* keyword.\n" +
            "Bugs with the stalled keyword are ignored.\n" +
            "Bugs are order by last updated, oldest first.\n" +
            "Timestamp shows last time bug was updated by anyone.",
        query: {
            resolution: "---",
            keywords_type: "nowords",
            keywords: "stalled",
            f1: "bug_group",
            o1: "isnotempty",
            v1: "",
        },
        usesComponents: true,
        lazyLoad: true,
        include: (bug) => {
            return bug.keywords.split(" ").some((k) => k.startsWith("sec-"));
        },
        augment: (bug) => {
            bug.timestamp_ago = bug.updated_ago;
            bug.timestamp = bug.updated;
        },
        augmentRow: ($row) => {
            const $keywords = _($row, ".keywords");
            if ($keywords.textContent === "") return;
            $keywords.innerHTML = $keywords.textContent
                .split(" ")
                .sort((a, b) => b.startsWith("sec-") - a.startsWith("sec-"))
                .map((kw) =>
                    kw.startsWith("sec-")
                        ? `<span class="sec-keyword">${kw}</span>`
                        : kw,
                )
                .join(" ");
        },
        order: (a, b) => a.updated_epoch - b.updated_epoch,
    });
}
