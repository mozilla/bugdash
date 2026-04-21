import * as BugList from "buglist";
import * as Tracked from "buglists/tracked";
import * as UpliftCandidates from "buglists/uplift-candidates";
import { _ } from "util";

export function initUI() {
    const $content = _("#tracked-content");

    let $group = BugList.newGroup($content);
    Tracked.init($group, false);

    $group = BugList.newGroup($content);
    UpliftCandidates.init($group);
}
