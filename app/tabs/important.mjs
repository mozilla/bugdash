import * as BugList from "buglist";
import * as Tracked from "buglists/tracked";
import * as Blockers from "buglists/blockers";
import * as Criticals from "buglists/criticals";
import * as Regressions from "buglists/regressions";
import { _, __ } from "util";

export function initUI() {
    const $content = _("#important-content");

    document.addEventListener("tab.important", () => {
        for (const $buglist of __($content, ".buglist-container")) {
            BugList.updateQuery($buglist.id);
        }
    });

    // Regressions

    Blockers.init($content, true);
    Criticals.init($content, true);
    $content.append(document.createElement("br"));
    Tracked.init($content, true);
    $content.append(document.createElement("br"));
    Regressions.init($content, true);
}
