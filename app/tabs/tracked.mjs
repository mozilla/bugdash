import * as BugList from "buglist";
import * as Tracking from "buglists/tracked";
import { _, __ } from "util";

export function initUI() {
    const $content = _("#tracked-content");

    document.addEventListener("tab.tracked", () => {
        for (const $buglist of __($content, ".buglist-container")) {
            BugList.updateQuery($buglist.id);
        }
    });

    Tracking.init($content);
}
