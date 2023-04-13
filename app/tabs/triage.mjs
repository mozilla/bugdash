import * as BugList from "buglist";
import * as TriageNeeded from "buglists/triage-needed";
import * as NeedinfoEscalated from "buglists/needinfo-escalated";
import * as NeedinfoStale from "buglists/needinfo-stale";
import * as Blockers from "buglists/blockers";
import * as Criticals from "buglists/criticals";
import { _, __ } from "util";

export function initUI() {
    const $content = _("#triage-content");

    document.addEventListener("tab.triage", () => {
        for (const $buglist of __($content, ".buglist-container")) {
            BugList.updateQuery($buglist.id);
        }
    });

    TriageNeeded.init($content);
    NeedinfoEscalated.init($content);
    NeedinfoStale.init($content);
    Blockers.init($content);
    Criticals.init($content);
}
