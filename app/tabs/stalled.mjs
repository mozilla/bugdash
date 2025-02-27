import { _ } from "util";
import * as BugList from "buglist";
import * as AssignedInactive from "buglists/assigned-inactive";
import * as LongDefects from "buglists/long-defects";
import * as LongEnhancements from "buglists/long-enhancements";
import * as LongTasks from "buglists/long-tasks";
import * as Stalled from "buglists/stalled";

export function initUI() {
    const $content = _("#stalled-content");

    let $group = BugList.newGroup($content);
    Stalled.init($group);
    AssignedInactive.init($group);

    $group = BugList.newGroup($content);
    LongDefects.init($group);
    LongEnhancements.init($group);
    LongTasks.init($group);
}
