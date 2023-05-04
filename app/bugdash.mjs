import * as Dialog from "dialog";
import * as Global from "global";
import * as Tooltips from "tooltips";
import * as BugList from "buglist";
import * as Tabs from "tabs";
import * as Help from "tabs/help";
import * as Components from "tabs/components";
import * as Triage from "tabs/triage";
import * as Stalled from "tabs/stalled";
import * as Important from "tabs/important";
import * as REO from "tabs/reo";
import * as Tracked from "tabs/tracked";
import { _ } from "util";

window.addEventListener("DOMContentLoaded", async () => {
    // init helpers
    Dialog.initUI();

    // load data
    await Global.initData();

    // init ui
    Help.initUI();
    BugList.initUI();
    Tabs.initUI();
    await Components.initUI();
    Triage.initUI();
    Stalled.initUI();
    Important.initUI();
    REO.initUI();
    Tracked.initUI();

    Tooltips.initUI();

    document.body.classList.remove("loading");

    // navigation from document hash
    let $tab;
    const hash = document.location.hash.slice(1);
    if (hash.startsWith("tab.")) {
        $tab = _(`.tab[data-tab=${hash.slice(4)}`);
    }
    // else default to triage tab if we have selected components, or the
    // components tab as a fallback default
    if (!$tab) {
        $tab =
            Global.selectedComponents().length === 0
                ? _(".tab[data-tab=components]")
                : _(".tab[data-tab=triage]");
    }
    await Tabs.switchTo($tab);
});
