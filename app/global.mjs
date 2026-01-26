import { _, __, hashCode, setLoadingStage } from "util";
import * as Bugzilla from "bugzilla";
import * as Dialog from "dialog";

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
        "External Software Affecting Firefox",
        "Firefox Build System",
        "Firefox Enterprise",
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
    let response = await fetch(
        "https://product-details.mozilla.org/1.0/firefox_versions.json?" + Date.now(),
    );
    let data = await response.json();
    g.nightly = {};
    g.nightly.version = data.FIREFOX_NIGHTLY.split(".")[0];
    g.nightly.statusFlag = `cf_status_firefox${g.nightly.version}`;
    g.beta = {};
    g.beta.version = data.FIREFOX_DEVEDITION.split(".")[0];
    g.beta.statusFlag = `cf_status_firefox${g.beta.version}`;
    g.release = {};
    g.release.version = data.LATEST_FIREFOX_VERSION.split(".")[0];
    g.release.statusFlag = `cf_status_firefox${g.release.version}`;

    setLoadingStage("Firefox releases");
    response = await fetch(
        "https://product-details.mozilla.org/1.0/firefox.json?" + Date.now(),
    );
    data = await response.json();

    // load the versions, skipping beta, esr, and rc
    const versions = {};
    for (const entry of Object.entries(data.releases)) {
        let versionStr = entry[0].replace(/^firefox-/, "");
        if (Number(versionStr.split(".")[0]) <= 120) continue; // we can ignore old releases
        if (/(?:\.\d+b\d+|esr|rc\d+)$/.test(versionStr)) continue;
        if (versionStr.split(".").length === 2) {
            versionStr = `${versionStr}.0`; // 129.0 --> 129.0.0
        }
        versions[versionStr] = entry[1].date;
    }

    // find the .0 release date, or the next following if that doesn't exist
    for (const channel of ["beta", "release"]) {
        const mergeVer = Number(g[channel].version) - 2;
        let dot = 0;
        while (dot <= 5) {
            if (`${mergeVer}.0.${dot}` in versions) {
                g[channel].date = versions[`${mergeVer}.0.${dot}`];
                break;
            }
            dot++;
        }
        if (!g[channel].date) {
            // eslint-disable-next-line no-console
            console.error(`Failed to find merge date for ${channel}`);
            document.body.classList.add("global-error");
        }
    }

    /* eslint-disable no-console */
    console.log("Nightly", g.nightly);
    console.log("Beta", g.beta);
    console.log("Release", g.release);
    /* eslint-enable no-console */
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
                // eslint-disable-next-line no-console
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
            await Dialog.alert(`Failed to load Bugzilla components: ${error}`);
            return;
        }
    }

    window.localStorage.setItem("componentsID", currentCacheID);
    window.localStorage.setItem("components", JSON.stringify(g.components));
}

export async function clearComponentsCache() {
    window.localStorage.setItem("componentsID", "");
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
