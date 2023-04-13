import * as BugList from "buglist";
import * as Stalled from "buglists/stalled";
import * as LongDefects from "buglists/long-defects";
import * as LongEnhancements from "buglists/long-enhancements";
import * as LongTasks from "buglists/long-tasks";
import * as AssignedInactive from "buglists/assigned-inactive";
import { _, __ } from "util";

export function initUI() {
    const $content = _("#stalled-content");

    document.addEventListener("tab.stalled", () => {
        for (const $buglist of __($content, ".buglist-container")) {
            BugList.updateQuery($buglist.id);
        }
    });

    Stalled.init($content);
    LongDefects.init($content);
    LongEnhancements.init($content);
    LongTasks.init($content);
    AssignedInactive.init($content);
}
