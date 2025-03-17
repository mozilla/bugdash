import { _, localiseNumbers, updateTemplate } from "util";
import * as BugTable from "bugtable";
import * as Bugzilla from "bugzilla";
import * as Global from "global";
import * as Menus from "menus";
import * as Tooltips from "tooltips";

/* global tippy */

const g = {
    openReady: false,
    trendsReady: false,
    me: {},
    closedBugFilter: "all",
};

function calcMaintEffect(s1, s2, s3, s4, su) {
    return s1 * 8 + s2 * 5 + s3 * 2 + s4 * 1 + su * 3;
}

export function initUI() {
    const $content = _("#overview-content");

    BugTable.append({
        id: "openDefects",
        $container: $content,
        template: "#overview-template",
        tableContiner: ".open-defects",
        updateFunc: updateOpenDefects,
    });
    BugTable.append({
        id: "trendsDefects",
        $container: $content,
        template: "#overview-template",
        tableContiner: ".trends-defects",
        updateFunc: updateTrendsDefects,
    });

    const $menuAction = _("#closed-filter-btn").closest(".action");
    Menus.initOptionsMenu(
        $menuAction,
        _("#closed-filter-menu-template"),
        () => {
            return g.closedBugFilter;
        },
        (value, text) => {
            g.closedBugFilter = value;
            Tooltips.set($menuAction, value === "all" ? "" : text);
            _("#trendsDefects .refresh-btn").click();
        },
    );
}

async function updateOpenDefects() {
    g.openReady = false;

    // build query urls; note these are count_only, only returning the bug count
    const queries = {};
    for (const severity of ["s1", "s2", "s3", "s4", "--"]) {
        const name = severity === "--" ? "su" : severity;
        queries[name] = Bugzilla.queryURL(
            {
                resolution: "---",
                type: "defect",
                severity: severity,
                count_only: "1",
            },
            Global.selectedComponents(),
            "id",
        );
    }

    await BugTable.updateWrapper(
        "openDefects",
        async () =>
            await Promise.all(
                Object.values(queries).map((url) => Bugzilla.rest(url, false, true)),
            ),
        (response) => {
            // coalesce response into template vars
            const names = Object.keys(queries);
            const vars = { sa: 0 };
            for (const [i, name] of names.entries()) {
                vars[name] = response[i].bug_count;
                vars[`${name}url`] = Bugzilla.queryUrlToBuglistUrl(queries[name]);
                vars.sa += vars[name];
            }
            vars.saurl = Bugzilla.queryUrlToBuglistUrl(
                Bugzilla.queryURL(
                    {
                        resolution: "---",
                        type: "defect",
                    },
                    Global.selectedComponents(),
                ),
            );
            return vars;
        },
    );

    g.openReady = true;
    await updateBurnDown();
}

async function updateTrendsDefects() {
    g.trendsReady = false;

    // build queries
    const queries = {};
    for (const weeks of ["1", "4", "12"]) {
        let query = {
            type: "defect",
            f1: "creation_ts",
            o1: "changedafter",
            v1: `-${weeks}w`,
        };
        queries[`w${weeks}_opened`] = Bugzilla.queryURL(
            query,
            Global.selectedComponents(),
            "id,severity",
        );

        query = {
            type: "defect",
            f1: "cf_last_resolved",
            o1: "changedafter",
            v1: `-${weeks}w`,
        };
        if (g.closedBugFilter !== "all") {
            query.f2 = "creation_ts";
            query.o2 = "changedafter";
            query.v2 = `-${g.closedBugFilter}`;
        }
        queries[`w${weeks}_closed`] = Bugzilla.queryURL(
            query,
            Global.selectedComponents(),
            "id,severity",
        );
    }

    await BugTable.updateWrapper(
        "trendsDefects",
        async () =>
            await Promise.all(Object.values(queries).map((url) => Bugzilla.rest(url))),
        (response) => {
            // coalesce response into template vars
            const names = Object.keys(queries);
            const vars = {};
            for (const [i, name] of names.entries()) {
                for (const severity of ["sa", "s1", "s2", "s3", "s4", "su"]) {
                    vars[`${name}_${severity}`] = 0;
                    let bugSeverity;
                    switch (severity) {
                        case "sa": {
                            bugSeverity = "";
                            break;
                        }
                        case "su": {
                            bugSeverity = "--";
                            break;
                        }
                        default: {
                            bugSeverity = severity;
                        }
                    }
                    vars[`${name}_${severity}url`] = Bugzilla.queryUrlToBuglistUrl(
                        queries[name],
                        { bug_severity: bugSeverity },
                    );
                }

                for (const bug of response[i].bugs) {
                    const severity = /^S\d$/.test(bug.severity)
                        ? bug.severity.toLowerCase()
                        : "su";
                    vars[`${name}_${severity}`]++;
                    vars[`${name}_sa`]++;
                }
                vars[`${name}_saurl`] = Bugzilla.queryUrlToBuglistUrl(queries[name]);

                // store totals to be used later for burndown calculation
                const [week, state] = name.split("_");
                if (!(week in g.me)) {
                    g.me[week] = { opened: 0, closed: 0, perc: 0 };
                }
                g.me[week][state] = calcMaintEffect(
                    vars[`${name}_s1`],
                    vars[`${name}_s2`],
                    vars[`${name}_s3`],
                    vars[`${name}_s4`],
                    vars[`${name}_su`],
                );
            }

            // calc period-level maint-effect
            for (const week of Object.keys(g.me)) {
                if (!/^w\d+$/.test(week)) continue;
                const perc =
                    g.me[week].opened > 0
                        ? (g.me[week].closed / g.me[week].opened) * 100
                        : (g.me[week].closed + 1) * 100;
                g.me[week].perc = perc;
                vars[`${week}_me`] = `${Math.round(perc)}%`;
            }

            return vars;
        },
    );
    g.trendsReady = true;
    await updateBurnDown();
}

async function updateBurnDown() {
    if (!(g.openReady && g.trendsReady)) return;

    const queries = {};
    for (const severity of ["s1", "s2", "s3", "s4", "--"]) {
        const name = severity === "--" ? "su" : severity;

        const query = {
            resolution: "---",
            type: "defect",
            severity: severity,
            count_only: "1",
        };
        if (g.closedBugFilter !== "all") {
            query.f1 = "creation_ts";
            query.o1 = "changedafter";
            query.v1 = `-${g.closedBugFilter}`;
        }
        queries[name] = Bugzilla.queryURL(query, Global.selectedComponents(), "id");
    }

    const $trendsDefects = _("#trendsDefects");
    $trendsDefects.classList.add("loading");
    $trendsDefects.classList.remove("error");
    let response;
    try {
        response = await Promise.all(
            Object.values(queries).map((url) => Bugzilla.rest(url)),
        );
        $trendsDefects.classList.remove("loading");
    } catch (error) {
        $trendsDefects.classList.remove("loading");
        $trendsDefects.classList.add("error");
        // eslint-disable-next-line no-console
        console.error(error);
        document.body.classList.add("global-error");
        return;
    }

    const names = Object.keys(queries);
    let vars = {};
    for (const [i, name] of names.entries()) {
        vars[name] = response[i].bug_count;
    }
    g.me.open = calcMaintEffect(vars.s1, vars.s2, vars.s3, vars.s4, vars.su);

    vars = {};
    for (const week of [1, 4, 12]) {
        const key = `w${week}`;
        vars[`w${week}_bd`] =
            g.me[key].opened >= g.me[key].closed
                ? "∞"
                : (g.me.open / (g.me[key].closed - g.me[key].opened)) * (week / 52);
    }

    localiseNumbers(vars);
    updateTemplate(_("#trendsDefects"), vars);
}
