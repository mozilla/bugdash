import { _, __, cloneTemplate, updateTemplate } from "util";
import * as BugList from "buglist";
import * as BugTable from "bugtable";
import * as Bugzilla from "bugzilla";
import * as Dialog from "dialog";
import * as Global from "global";

function addTab(tab, $tabGroup) {
    let $tab = cloneTemplate(_("#tab-template"));
    updateTemplate($tab, tab);
    $tab = $tab.firstElementChild;
    $tab.dataset.tab = tab.name;
    $tabGroup.append($tab);
    const $content = cloneTemplate(_("#tab-content-template"));
    updateTemplate($content, {
        outer: `tab-${tab.name}`,
        inner: `${tab.name}-content`,
    });
    _("#tabs-content").append($content);

    document.addEventListener(`tab.${tab.name}`, () => {
        const $container = _(`#tab-${tab.name}`);
        for (const $buglist of __($container, ".buglist-container")) {
            BugList.updateQuery($buglist.id);
        }
        for (const $bugtable of __($container, ".bugtable-container")) {
            BugTable.refresh($bugtable.id);
        }
    });

    return $tab;
}

function addTabGroup(tabs) {
    const $tabGroup = document.createElement("div");
    $tabGroup.classList.add("tab-group");
    for (const tab of tabs) {
        addTab(tab, $tabGroup);
    }
    _("#refresh-all-button").before($tabGroup);
}

function addComponentsTab(tab) {
    const $tabGroup = _("#components-tab-group");
    const $tab = addTab(tab, $tabGroup);
    $tab.classList.add("disabled");
}

function addTabs() {
    addComponentsTab({
        name: "triage",
        title: "Triage",
    });
    addComponentsTab({
        name: "important",
        title: "Important",
    });
    addComponentsTab({
        name: "stalled",
        title: "Stalled & Longstanding",
    });
    addComponentsTab({
        name: "overview",
        title: "Overview",
    });
    addTabGroup([
        {
            name: "reo",
            title: "Regressions",
        },
        {
            name: "tracked",
            title: "Tracked",
        },
        {
            name: "beta",
            title: "Beta",
        },
    ]);
}

function updateAuth() {
    const account = Global.getAccount();
    if (account) {
        _("#username").textContent = account.real_name;
        _("#nav #key-button").classList.add("authenticated");
    } else {
        _("#username").textContent = "";
        _("#nav #key-button").classList.remove("authenticated");
    }
}

export function initUI() {
    addTabs();
    updateAuth();

    _("#nav").addEventListener("click", async (event) => {
        const $selected = event.target.closest(".tab");
        if (!$selected || !$selected.dataset.tab) return;
        await switchTo($selected);
    });

    _("#nav #refresh-all-button").addEventListener("click", (event) => {
        if (event.shiftKey) {
            Global.clearComponentsCache();
            window.location.reload();
        } else {
            document.dispatchEvent(new Event("refresh"));
        }
    });

    _("#nav #key-button").addEventListener("click", async () => {
        const oldApiKey = Bugzilla.getApiKey();
        let account;
        for (;;) {
            const prefix = oldApiKey ? "Replace" : "Set";
            let key = await Dialog.prompt(`${prefix} Bugzilla API-Key:`);
            if (key === false) return;
            key = key.trim();

            Bugzilla.setApiKey(key.trim());
            if (key === "") break;

            Dialog.showSpinner("Verifying API-Key");
            const res = await Bugzilla.whoami();
            Dialog.hideSpinner();
            if (res === undefined) {
                Bugzilla.setApiKey(oldApiKey);
                await Dialog.alert("Invalid Bugzilla API-Key");
            } else {
                account = res;
                break;
            }
        }
        Global.setAccount(account);
        updateAuth();
        document.dispatchEvent(new Event("refresh"));
    });
}

export async function switchTo($tab) {
    if ($tab.closest("#components-tab-group") && $tab.dataset.tab !== "components") {
        const components = Global.selectedComponents();
        if (components.length === 0) {
            await Dialog.alert("No components selected.");
            return;
        }
        if (components.length >= 50) {
            await Dialog.alert(
                "Too many components selected. Please select fewer than 50.",
            );
            return;
        }
    }

    for (const $t of __(".tab.selected")) {
        $t.classList.remove("selected");
    }
    $tab.classList.add("selected");

    // change visible content
    for (const $content of __(".content.selected")) {
        $content.classList.remove("selected");
    }
    const selectedTab = $tab.dataset.tab;
    _(`#tab-${selectedTab}`).classList.add("selected");

    // update doc hash and title
    if (selectedTab === "components") {
        history.pushState("", "", "/");
    } else {
        document.location.hash = `tab.${selectedTab}`;
    }
    const title = $tab.innerText.trim().replace(/ \(\d+\)/, "");
    document.title = `BugDash - ${title}`;

    // notify tab
    document.dispatchEvent(new Event(`tab.${selectedTab}`));
}
