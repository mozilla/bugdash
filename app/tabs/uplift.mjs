import * as BugList from "buglist";
import * as Uplift from "buglists/uplift";
import { _ } from "util";

export function initUI() {
    const $content = _("#uplift-content");

    const $group = BugList.newGroup($content);
    Uplift.init($group, false);
}
