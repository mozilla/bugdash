import * as BugList from "buglist";
import * as Blockers from "buglists/blockers";
import * as Criticals from "buglists/criticals";
import * as Regressions from "buglists/regressions";
import * as Security from "buglists/security";
import * as TopCrashers from "buglists/topcrashers";
import * as Tracked from "buglists/tracked";
import { _ } from "util";

export function initUI() {
    const $content = _("#important-content");

    let $group = BugList.newGroup($content);
    Blockers.init($group);
    Criticals.init($group);
    TopCrashers.init($group);
    Security.init($group);

    $group = BugList.newGroup($content);
    Tracked.init($group, true);

    $group = BugList.newGroup($content);
    Regressions.init($group);
}
