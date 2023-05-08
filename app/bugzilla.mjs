import * as Global from "global";

export function queryURL(query, components) {
    let search = new URLSearchParams();
    query["query_format"] = "advanced";

    // add provided query parameters
    let fieldNumber = 0;
    for (const [name, value] of Object.entries(query)) {
        if (name[0] === "f") {
            if (name === "j_top") {
                throw "Cannot set j_top, use a group with an OR joiner (f#=OP,j#=OR)";
            }
            const num = name.slice(1) * 1;
            if (num > fieldNumber) {
                fieldNumber = num;
            }
            search.append(name, value);
        } else {
            if (Array.isArray(value)) {
                for (const v of value) {
                    search.append(name, v);
                }
            } else {
                search.append(name, value);
            }
        }
    }

    // Add components.  We can't use product= and component= query parameters as it
    // hits on matching products OR components, rather than a product/component pair.
    // Instead we build a query which does:
    // .. ((product AND component) OR (product AND component) ...)
    fieldNumber++;
    search.append("f" + fieldNumber, "OP");
    search.append("j" + fieldNumber, "OR");

    if (components) {
        for (const c of components) {
            fieldNumber++;
            search.append("f" + fieldNumber, "OP");

            fieldNumber++;
            search.append("f" + fieldNumber, "product");
            search.append("o" + fieldNumber, "equals");
            search.append("v" + fieldNumber, c.product);

            fieldNumber++;
            search.append("f" + fieldNumber, "component");
            search.append("o" + fieldNumber, "equals");
            search.append("v" + fieldNumber, c.component);

            fieldNumber++;
            search.append("f" + fieldNumber, "CP");
        }
    }

    fieldNumber++;
    search.append("f" + fieldNumber, "CP");

    search.append(
        "include_fields",
        [
            "assigned_to",
            "component",
            "creation_time",
            "creator",
            "flags",
            "groups",
            "id",
            "keywords",
            "last_change_time",
            "priority",
            "product",
            "severity",
            "summary",
            "triage_owner",
            "type",
        ].join(",")
    );
    search.append("limit", "0");

    return "bug?" + search.toString();
}

export function bugUrl(id) {
    return `https://bugzilla.mozilla.org/show_bug.cgi?id=${id}`;
}

export function buglistUrl(ids) {
    return "https://bugzilla.mozilla.org/buglist.cgi?bug_id=" + ids.join(",");
}

export function setApiKey(key) {
    window.localStorage.setItem("api-key", key);
}

export function getApiKey() {
    return window.localStorage.getItem("api-key") || "";
}

export async function whoami() {
    const response = await rest("whoami", undefined, true);
    return response.error && response.code === 306 ? undefined : response;
}

export async function rest(endpoint, args, ignoreErrors) {
    let url = `https://bugzilla.mozilla.org/rest/${endpoint}`;
    if (args) {
        if (args instanceof Object) {
            args = new URLSearchParams(args).toString();
        }
        url = url + "?" + args;
    }

    const apiKey = getApiKey();
    const account = Global.getAccount();
    const uaSuffix = account ? ` (${account.name})` : "";

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "User-Agent": `bugdash${uaSuffix}`,
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
            "X-Bugzilla-API-Key": apiKey,
        },
    });
    const responseData = await response.json();
    if (!response.ok && !responseData) {
        throw new Error(response.statusText);
    }
    if (responseData.error && !ignoreErrors) {
        throw new Error(responseData.message);
    }
    return responseData;
}
