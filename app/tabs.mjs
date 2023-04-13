import * as Bugzilla from "bugzilla";
import * as Dialog from "dialog";
import * as Global from "global";
import { _, __ } from "util";

function updateAuth() {
    const account = Global.getAccount();
    if (account) {
        _("#username").textContent = account["real_name"];
        _("#nav #key-button").classList.add("authenticated");
    } else {
        _("#username").textContent = "";
        _("#nav #key-button").classList.remove("authenticated");
    }
}

export function initUI() {
    _("#nav").addEventListener("click", async (event) => {
        const $selected = event.target.closest(".tab");
        if (!$selected || !$selected.dataset.tab) return;
        await switchTo($selected);
    });

    updateAuth();

    _("#nav #refresh-all-button").addEventListener("click", (event) => {
        if (event.shiftKey) {
            Global.clearComponentsCache();
            window.location.reload();
        } else {
            const components = Global.selectedComponents();
            if (components.length > 0) {
                document.dispatchEvent(new Event("buglist.refresh"));
            }
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
        document.dispatchEvent(new Event("buglist.refresh"));
    });
}

export async function switchTo($tab) {
    if ($tab.dataset.requires_components) {
        const components = Global.selectedComponents();
        if (components.length === 0) {
            await Dialog.alert("No components selected.");
            return;
        }
        if (components.length >= 50) {
            await Dialog.alert(
                "Too many components selected. Please select fewer than 50."
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

    document.dispatchEvent(new Event(`tab.${selectedTab}`));
}
