import { _ } from "util";
import * as BugList from "buglist";
import * as Beta from "buglists/beta";

export function initUI() {
    const $content = _("#beta-content");

    const $group = BugList.newGroup($content);
    Beta.init($group, false);
}
