import * as BugList from "buglist";
import * as BugTable from "bugtable";
import * as Dialog from "dialog";
import * as Filters from "filters";
import * as Global from "global";
import * as MultiSelect from "multiselect";
import * as Tabs from "tabs";
import * as Beta from "tabs/beta";
import * as Components from "tabs/components";
import * as Help from "tabs/help";
import * as Important from "tabs/important";
import * as Overview from "tabs/overview";
import * as REO from "tabs/reo";
import * as Stalled from "tabs/stalled";
import * as Tracked from "tabs/tracked";
import * as Triage from "tabs/triage";
import * as Tooltips from "tooltips";
import * as UrlHash from "urlhash";
import { _ } from "util";

window.addEventListener("DOMContentLoaded", async () => {
    // init helpers
    Dialog.initUI();
    MultiSelect.initUI();

    // load data
    await Global.initData();

    // init ui
    Filters.initUI();
    Help.initUI();
    BugList.initUI();
    BugTable.initUI();
    Tabs.initUI();
    await Components.initUI();
    Triage.initUI();
    Stalled.initUI();
    Important.initUI();
    REO.initUI();
    Tracked.initUI();
    Beta.initUI();
    Overview.initUI();
    Tooltips.initUI();

    BugList.initUiLast();

    document.body.classList.remove("loading");

    // navigate to the tab saved in the hash
    let $tab = hashToTab();
    // else default to triage tab if we have selected components, or the
    // components tab as a fallback default
    if (!$tab) {
        $tab =
            Global.selectedComponents().length === 0
                ? _(".tab[data-tab=components]")
                : _(".tab[data-tab=triage]");
    }
    await Tabs.switchTo($tab);

    window.addEventListener("popstate", async () => {
        const $tab = hashToTab() || _(".tab[data-tab=components]");
        Filters.loadFromHash();
        await Tabs.switchTo($tab);
    });
});

function hashToTab() {
    const [tab] = UrlHash.get("tab") ?? [];
    return tab ? _(`.tab[data-tab="${tab}"]`) : undefined;
}
