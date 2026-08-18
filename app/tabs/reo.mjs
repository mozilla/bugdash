import * as BugList from "buglist";
import * as REO from "buglists/reo";
import * as Releases from "releases";
import { _ } from "util";

export function initUI() {
    const $content = _("#reo-content");

    for (const chan of Releases.channels()) {
        const $group = BugList.newGroup($content);
        REO.init($group, chan);
    }
}
