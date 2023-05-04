import * as BugList from "buglist";
import * as Tracked from "buglists/tracked";
import { _, __ } from "util";

export function initUI() {
    const $content = _("#tracked-content");

    document.addEventListener("tab.tracked", () => {
        for (const $buglist of __($content, ".buglist-container")) {
            BugList.updateQuery($buglist.id);
        }
    });

    Tracked.init($content, false);
}