import * as BugList from "buglist";
import * as TriageNeeded from "buglists/triage-needed";
import * as NeedinfoEscalated from "buglists/needinfo-escalated";
import * as NeedinfoStale from "buglists/needinfo-stale";
import * as RecentEnhancements from "buglists/recent-enhancements";
import * as RecentRegressions from "buglists/recent-regressions";
import * as RecentTasks from "buglists/recent-tasks";
import * as Blockers from "buglists/blockers-unassigned";
import * as Criticals from "buglists/criticals-unassigned";
import { _ } from "util";

export function initUI() {
    const $content = _("#triage-content");

    let $group = BugList.newGroup($content);
    TriageNeeded.init($group);
    RecentRegressions.init($group);

    $group = BugList.newGroup($content);
    RecentEnhancements.init($group);
    RecentTasks.init($group);

    $group = BugList.newGroup($content);
    NeedinfoEscalated.init($group);
    NeedinfoStale.init($group);

    $group = BugList.newGroup($content);
    Blockers.init($group);
    Criticals.init($group);
}
