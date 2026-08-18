import * as Bugzilla from "bugzilla";
import * as Dialog from "dialog";
import * as Notifications from "notifications";
import * as Releases from "releases";
import { _, __, hashCode, setLoadingStage } from "util";

const g = {
    appVersion: 1, // bump to force component reloading
    components: undefined,
    account: undefined,
    products: [
        "Core",
        "Developer Infrastructure",
        "DevTools",
        "Enterprise Products",
        "External Software Affecting Firefox",
        "Firefox Build System",
        "Firefox for Android",
        "Firefox for iOS",
        "Firefox",
        "Focus",
        "GeckoView",
        "NSPR",
        "NSS",
        "Release Engineering",
        "Remote Protocol",
        "Testing",
        "Toolkit",
        "Web Compatibility",
        "WebExtensions",
    ],
};

export function allComponents() {
    return g.components;
}

export function getHackbotAgent(buglistId, bug) {
    if (
        buglistId === "triage-needed" &&
        (bug.product === "Firefox" || bug.product === "Toolkit")
    ) {
        return "frontend-triage";
    }
    return undefined;
}

export function selectedComponents() {
    const result = [];
    for (const $cb of __("#components input:checked")) {
        result.push(g.components.find((c) => c.id.toString() === $cb.id.slice(1)));
    }
    return result;
}

export function getAccount() {
    return g.account;
}

export function setAccount(account) {
    g.account = account;
}

async function loadComponents() {
    // reload components once per month, or if the list of products or appVersion changes
    const now = new Date();
    const productsHash = hashCode(g.products.join("#") + g.appVersion.toString());
    const currentCacheID = `${now.getFullYear()}.${now.getMonth()}:${productsHash}`;
    const cacheID = window.localStorage.getItem("componentsID") || "";
    const cacheData = window.localStorage.getItem("components");
    if (cacheData && cacheID === currentCacheID) {
        g.components = JSON.parse(cacheData);
        // the cached list is incomplete; keep saying so rather than refetching
        reportInvalidProducts(
            JSON.parse(window.localStorage.getItem("componentsInvalid") ?? "[]"),
        );
        return;
    }

    g.components = [];
    const invalidProducts = [];
    for (const product of g.products) {
        setLoadingStage(`Bugzilla product: ${product}`);
        try {
            const response = await Bugzilla.rest(
                `product/${encodeURIComponent(product)}`,
                {
                    // eslint-disable-next-line camelcase
                    include_fields:
                        "components.id,components.name,components.description,components.team_name",
                },
            );
            if (response.products.length === 0) {
                invalidProducts.push(product);
                continue;
            }
            for (const component of response.products[0].components) {
                g.components.push({
                    id: component.id,
                    title: `${product}: ${component.name}`,
                    desc: component.description
                        .replaceAll(/<[^>]+>/g, " ")
                        .replaceAll("&lt;", "<")
                        .replaceAll("&gt;", ">"),
                    product: product,
                    component: component.name,
                    team: component.team_name,
                });
            }
        } catch (error) {
            // failure to load components is a hard application stop
            document.body.classList.add("global-error");
            await Dialog.alert(
                `Failed to load Bugzilla components (${product}): ${error.message ?? error}`,
            );
            return;
        }
    }

    reportInvalidProducts(invalidProducts);
    window.localStorage.setItem("componentsID", currentCacheID);
    window.localStorage.setItem("components", JSON.stringify(g.components));
    window.localStorage.setItem("componentsInvalid", JSON.stringify(invalidProducts));
}

function reportInvalidProducts(products) {
    for (const product of products) {
        Notifications.error(`Invalid product ${product}`);
    }
}

export async function clearComponentsCache() {
    window.localStorage.setItem("componentsID", "");
}

export function getComponent(productName, componentName) {
    return g.components.find(
        (c) => c.product === productName && c.component === componentName,
    );
}

export async function loadUser() {
    const apiKey = Bugzilla.getApiKey();
    if (apiKey.length === 0) {
        g.account = undefined;
    } else {
        setLoadingStage("Bugzilla account");
        g.account = await Bugzilla.whoami();
        if (g.account === undefined) {
            await Dialog.alert("Removing invalid Bugzilla API-Key.");
            Bugzilla.setApiKey("");
        }
    }
}

export async function initData() {
    _("#global-error").addEventListener("click", () =>
        document.body.classList.add("egg"),
    );

    await loadUser();
    await Releases.initData();
    await loadComponents();
    setLoadingStage("");
}
