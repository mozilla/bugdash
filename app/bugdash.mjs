import * as Dialog from "dialog";
import * as Global from "global";
import * as Tooltips from "tooltips";
import * as BugList from "buglist";
import * as Tabs from "tabs";
import * as Help from "tabs/help";
import * as Components from "tabs/components";
import * as Triage from "tabs/triage";
import * as Stalled from "tabs/stalled";
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
    Tooltips.initUI();

    document.body.classList.remove("loading");

    const $tab =
        Global.selectedComponents().length === 0
            ? _(".tab[data-tab=components]")
            : _(".tab[data-tab=triage]");
    await Tabs.switchTo($tab);
});
