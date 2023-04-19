import * as BugList from "buglist";
import * as REO from "buglists/reo";
import { _, __ } from "util";

export function initUI() {
    const $content = _("#reo-content");

    document.addEventListener("tab.reo", () => {
        for (const $buglist of __($content, ".buglist-container")) {
            BugList.updateQuery($buglist.id);
        }
    });

    REO.init($content);
}
