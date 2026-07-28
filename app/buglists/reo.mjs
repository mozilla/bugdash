import * as BugList from "buglist";
import * as Bugzilla from "bugzilla";
import * as Global from "global";

/* eslint-disable camelcase */

const g = {
    // teams selected in the Regressions page team filter; empty = no filtering
    teams: new Set(),
};

export function setTeams(teams) {
    g.teams = new Set(teams);
}

function maxFieldNumber(query) {
    return Math.max(
        0,
        ...Object.keys(query)
            .filter((k) => /^f\d+$/.test(k))
            .map((k) => Number(k.slice(1))),
    );
}

// Restrict the query to components belonging to the selected teams. Components
// are grouped by product; within each product a single `component anyexact`
// matches the comma-free names, with an `equals` fallback for names that
// themselves contain a comma (which anyexact would mis-split). This keeps the
// generated URL compact enough to avoid Bugzilla's URL length limit.
function appendTeamFilter(query) {
    if (g.teams.size === 0) {
        return;
    }

    const byProduct = new Map();
    const productTotals = new Map();
    for (const c of Global.allComponents()) {
        productTotals.set(c.product, (productTotals.get(c.product) ?? 0) + 1);
        if (!g.teams.has(c.team || "(none)")) {
            continue;
        }
        if (!byProduct.has(c.product)) {
            byProduct.set(c.product, []);
        }
        byProduct.get(c.product).push(c.component);
    }
    if (byProduct.size === 0) {
        return;
    }

    let n = maxFieldNumber(query) + 1;
    query[`f${n}`] = "OP";
    query[`j${n}`] = "OR";
    n++;
    for (const [product, components] of byProduct) {
        // When every component of a product is selected, matching on the product
        // alone is equivalent and far shorter. Without this, selecting all teams
        // enumerates every component and Bugzilla rejects the URL as too long.
        if (components.length === productTotals.get(product)) {
            query[`f${n}`] = "product";
            query[`o${n}`] = "equals";
            query[`v${n}`] = product;
            n++;
            continue;
        }
        query[`f${n}`] = "OP";
        n++;
        query[`f${n}`] = "product";
        query[`o${n}`] = "equals";
        query[`v${n}`] = product;
        n++;
        query[`f${n}`] = "OP";
        query[`j${n}`] = "OR";
        n++;
        const safe = components.filter((c) => !c.includes(","));
        if (safe.length > 0) {
            query[`f${n}`] = "component";
            query[`o${n}`] = "anyexact";
            query[`v${n}`] = safe.join(",");
            n++;
        }
        for (const c of components.filter((c) => c.includes(","))) {
            query[`f${n}`] = "component";
            query[`o${n}`] = "equals";
            query[`v${n}`] = c;
            n++;
        }
        query[`f${n}`] = "CP"; // close component sub-group
        n++;
        query[`f${n}`] = "CP"; // close product block
        n++;
    }
    query[`f${n}`] = "CP"; // close team OR group
}

function reoUrlsBuilder(buglist) {
    const query = { ...buglist.query };
    appendTeamFilter(query);
    return [Bugzilla.queryURL(query)];
}

export function init($container, ver) {
    BugList.append({
        id: `reo-${ver.name}-new`,
        $container: $container,
        urlsBuilder: reoUrlsBuilder,
        title: `${ver.nightly} (${ver.title}) New Bugs`,
        description:
            "Bugs with all of the following:\n" +
            "- regression keyword\n" +
            `- status-firefox${ver.nightly} set to affected\n` +
            `- status-firefox${ver.beta} set to any of unaffected ? ---\n` +
            "Bugs with any of the following are ignored:\n" +
            `- tracking-firefox${ver.nightly} is -\n` +
            "- stalled or intermittent-failure keywords\n" +
            "- within the Testing product\n" +
            "Bugs are order by creation date, oldest first.",
        query: {
            classification: [
                "Client Software",
                "Components",
                "Developer Infrastructure",
                "Other",
                "Server Software",
            ],
            keywords: "regression",
            keywords_type: "allwords",
            resolution: "---",
            f1: `cf_status_firefox${ver.nightly}`,
            o1: "equals",
            v1: "affected",
            f2: "OP",
            j2: "OR",
            f3: `cf_status_firefox${ver.beta}`,
            o3: "equals",
            v3: "unaffected",
            f4: `cf_status_firefox${ver.beta}`,
            o4: "equals",
            v4: "?",
            f5: `cf_status_firefox${ver.beta}`,
            o5: "equals",
            v5: "---",
            f6: "CP",
            f8: `cf_tracking_firefox${ver.nightly}`,
            o8: "notequals",
            v8: "-",
            f9: "product",
            o9: "notequals",
            v9: "Testing",
            f10: "keywords",
            o10: "nowordssubstr",
            v10: "stalled,intermittent-failure",
        },
    });

    BugList.append({
        id: `reo-${ver.name}-carryover`,
        $container: $container,
        urlsBuilder: reoUrlsBuilder,
        title: `${ver.nightly} (${ver.title}) Carry Over Bugs`,
        description:
            "Bugs with all of the following:\n" +
            "- regression keyword\n" +
            `- status-firefox${ver.nightly} set to affected\n` +
            "Bugs with any of the following are ignored:\n" +
            `- status-firefox${ver.beta} set to any of unaffected ? ---\n` +
            `- tracking-firefox${ver.nightly} is -\n` +
            "- stalled or intermittent-failure keywords\n" +
            "- within the Testing product\n" +
            "Bugs are order by unassigned, then by last updated (oldest first)",
        query: {
            classification: [
                "Client Software",
                "Components",
                "Developer Infrastructure",
                "Other",
                "Server Software",
            ],
            keywords: "regression",
            keywords_type: "allwords",
            resolution: "---",
            f1: `cf_status_firefox${ver.nightly}`,
            o1: "equals",
            v1: "affected",
            n2: "1",
            j2: "OR",
            f2: "OP",
            o3: "equals",
            v3: "unaffected",
            f3: `cf_status_firefox${ver.beta}`,
            f4: `cf_status_firefox${ver.beta}`,
            o4: "equals",
            v4: "?",
            f5: `cf_status_firefox${ver.beta}`,
            o5: "equals",
            v5: "---",
            f6: "CP",
            f8: `cf_tracking_firefox${ver.nightly}`,
            o8: "notequals",
            v8: "-",
            f9: "product",
            o9: "notequals",
            v9: "Testing",
            f10: "keywords",
            o10: "nowordssubstr",
            v10: "stalled,intermittent-failure",
        },
        augment: (bug) => {
            bug.assigned_sortkey = bug.assigned_to === "nobody@mozilla.org" ? 0 : 1;
        },
        order: (a, b) =>
            a.assigned_sortkey - b.assigned_sortkey ||
            a.updated_epoch - b.updated_epoch,
    });

    BugList.append({
        id: `reo-${ver.name}-burndown`,
        $container: $container,
        urlsBuilder: reoUrlsBuilder,
        title: `${ver.nightly} (${ver.title}) Burndown List`,
        description:
            "Bugs with all of the following:\n" +
            `- status-firefox${ver.nightly} is affected or optional\n` +
            "- any of:\n" +
            "\u00A0\u00A0- crash regression leak topcrash assertion dataloss keywords\n" +
            "\u00A0\u00A0- in a security group\n" +
            `\u00A0\u00A0- tracking-firefox${ver.nightly} is + ? or blocking\n` +
            "Bugs with any of the following are ignored:\n" +
            "- within the Testing product\n" +
            "Bugs are order by creation date, oldest first.",
        query: {
            classification: [
                "Client Software",
                "Components",
                "Developer Infrastructure",
                "Other",
                "Server Software",
            ],
            resolution: "FIXED",
            f1: `cf_status_firefox${ver.nightly}`,
            o1: "anywords",
            v1: "affected optional",
            j2: "OR",
            f2: "OP",
            o3: "anywords",
            v3: "crash regression leak topcrash assertion dataloss",
            f3: "keywords",
            f4: "bug_group",
            o4: "substring",
            v4: "sec",
            f6: `cf_tracking_firefox${ver.nightly}`,
            o6: "anywordssubstr",
            v6: "+ ? blocking",
            f7: "CP",
            f9: "product",
            o9: "notequals",
            v9: "Testing",
        },
    });
}
