import * as Bugzilla from "bugzilla";
import * as Dialog from "dialog";
import { _, __, hashCode, setLoadingStage } from "util";

const g = {
    appVersion: 1, // bump to force component reloading
    nightly: undefined,
    beta: undefined,
    release: undefined,
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

export function releaseData() {
    return {
        nightly: g.nightly,
        beta: g.beta,
        release: g.release,
    };
}

async function loadVersions() {
    setLoadingStage("Firefox versions");
    // consumers rely on the versions being consecutive:
    // nightly == beta + 1 == release + 2
    let response = await fetch(
        `https://whattrainisitnow.com/api/lando/uplift/train/?${Date.now()}`,
    );
    if (!response.ok) {
        throw new Error(`Failed to load Firefox versions: ${response.status}`);
    }
    let data = await response.json();
    for (const channel of ["nightly", "beta", "release"]) {
        g[channel] = {
            version: String(data[channel].version),
            statusFlag: `cf_status_firefox${data[channel].version}`,
        };
    }

    // the date the current beta version entered nightly
    response = await fetch(
        `https://whattrainisitnow.com/api/release/schedule/?version=${g.beta.version}&${Date.now()}`,
    );
    data = response.ok ? await response.json() : {};
    g.beta.date = data.nightly_start?.slice(0, 10);
    if (!g.beta.date) {
        // biome-ignore lint/suspicious/noConsole: should never happen
        console.error(`Failed to find nightly start for ${g.beta.version}`);
        document.body.classList.add("global-error");
    }

    // biome-ignore-start lint/suspicious/noConsole: info
    console.log("Nightly", g.nightly);
    console.log("Beta", g.beta);
    console.log("Release", g.release);
    // biome-ignore-end lint/suspicious/noConsole: info
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
        return;
    }

    g.components = [];
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
                // biome-ignore lint/suspicious/noConsole: safe to ignore, but useful for debugging
                console.error("Invalid product:", product);
                document.body.classList.add("global-error");
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
            document.body.classList.add("global-error");
            await Dialog.alert(
                `Failed to load Bugzilla components (${product}): ${error.message ?? error}`,
            );
            return;
        }
    }

    window.localStorage.setItem("componentsID", currentCacheID);
    window.localStorage.setItem("components", JSON.stringify(g.components));
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
    await loadVersions();
    await loadComponents();
    setLoadingStage("");
}
