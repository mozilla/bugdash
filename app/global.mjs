import * as Bugzilla from "bugzilla";
import * as Dialog from "dialog";
import { __, setLoadingStage, hashCode } from "util";

const g = {
    nightly: undefined,
    beta: undefined,
    release: undefined,
    components: undefined,
    account: undefined,
    products: [
        "Core",
        "DevTools",
        "Developer Infrastructure",
        "External Software Affecting Firefox",
        "Fenix",
        "Focus",
        "Firefox Build System",
        "Firefox for iOS",
        "Firefox",
        "GeckoView",
        "NSPR",
        "NSS",
        "Remote Protocol",
        "Release Engineering",
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
    let result = [];
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
        "https://product-details.mozilla.org/1.0/firefox_versions.json?" + Date.now()
    );
    let data = await response.json();
    g.nightly = {};
    g.nightly.version = data["FIREFOX_NIGHTLY"].split(".")[0];
    g.nightly.statusFlag = `cf_status_firefox${g.nightly.version}`;
    g.beta = {};
    g.beta.version = data["FIREFOX_DEVEDITION"].split(".")[0];
    g.beta.statusFlag = `cf_status_firefox${g.beta.version}`;
    g.release = {};
    g.release.version = data["LATEST_FIREFOX_VERSION"].split(".")[0];
    g.release.statusFlag = `cf_status_firefox${g.release.version}`;

    setLoadingStage("Firefox builds");
    response = await fetch("https://buildhub.moz.tools/api/search", {
        method: "post",
        body: JSON.stringify(buildHubRequest(g.beta.version)),
    });
    data = await response.json();
    if (data.hits.hits.length !== 1) {
        await Dialog.alert("Failed to determine build date for v" + g.beta.version);
        return;
    }
    g.beta.date = data.hits.hits[0]._source.download.date.slice(0, 10);

    response = await fetch("https://buildhub.moz.tools/api/search", {
        method: "post",
        body: JSON.stringify(buildHubRequest(g.release.version)),
    });
    data = await response.json();
    if (data.hits.hits.length !== 1) {
        await Dialog.alert("Failed to determine build date for v" + g.release.version);
        return;
    }
    g.release.date = data.hits.hits[0]._source.download.date.slice(0, 10);

    /* eslint-disable no-console */
    console.log("Nightly", g.nightly);
    console.log("Beta", g.beta);
    console.log("Release", g.release);
    /* eslint-enable no-console */
}

function buildHubRequest(version) {
    return {
        // eslint-disable-next-line camelcase
        post_filter: {
            bool: {
                must: [
                    {
                        term: {
                            "target.version": version + ".0a1",
                        },
                    },
                    {
                        term: {
                            "target.channel": "nightly",
                        },
                    },
                    {
                        term: {
                            "source.product": "firefox",
                        },
                    },
                ],
            },
        },
        size: 1,
        sort: [
            {
                "download.date": "asc",
            },
        ],
    };
}

async function loadComponents() {
    // reload components once per month, or if the list of products changes
    const now = new Date();
    const productsHash = hashCode(g.products.join("#"));
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
                        "components.id,components.name,components.description",
                }
            );
            if (response.products.length === 0) {
                // eslint-disable-next-line no-console
                console.error("Invalid product:", product);
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
    await loadUser();
    await loadVersions();
    await loadComponents();
    setLoadingStage("");
}
