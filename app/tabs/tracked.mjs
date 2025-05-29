import { _ } from "util";
import * as BugList from "buglist";
import * as Tracked from "buglists/tracked";

export function initUI() {
    const $content = _("#tracked-content");

    const $group = BugList.newGroup($content);
    const $metricsGroup = BugList.newGroup($content);

    Tracked.init($group, $metricsGroup, false);
}
