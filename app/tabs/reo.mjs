import * as BugList from "buglist";
import * as Global from "global";
import * as REO from "buglists/reo";
import { _ } from "util";

export function initUI() {
    const $content = _("#reo-content");

    const releases = Global.releaseData();
    const versions = [
        {
            name: "nightly",
            title: "Nightly",
            release: releases.release.version,
            beta: releases.beta.version,
            nightly: releases.nightly.version,
        },
        {
            name: "beta",
            title: "Beta",
            release: releases.release.version - 1,
            beta: releases.beta.version - 1,
            nightly: releases.nightly.version - 1,
        },
        {
            name: "release",
            title: "Release",
            release: releases.release.version - 2,
            beta: releases.beta.version - 2,
            nightly: releases.nightly.version - 2,
        },
    ];

    for (const ver of versions) {
        let $group = BugList.newGroup($content);
        REO.init($group, ver);
    }
}
