import { _, localiseNumbers, updateTemplate } from "util";
import * as BugTable from "bugtable";
import * as Bugzilla from "bugzilla";
import * as Global from "global";

/* eslint-disable camelcase */

const g = {
    openReady: false,
    trendsReady: false,
    me: {},
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
            "id,severity,status",
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

            // store totals to be used later for burndown calculation
            g.me.open = calcMaintEffect(vars.s1, vars.s2, vars.s3, vars.s4, vars.su);

            return vars;
        },
    );
    g.openReady = true;
    updateBurnDown();
}

async function updateTrendsDefects() {
    g.trendsReady = false;

    // build queries
    const queries = {};
    for (const weeks of ["1", "4", "12"]) {
        queries[`w${weeks}_opened`] = Bugzilla.queryURL(
            {
                type: "defect",
                chfield: "[Bug creation]",
                chfieldfrom: `-${weeks}w`,
            },
            Global.selectedComponents(),
            "id,severity",
        );
        queries[`w${weeks}_closed`] = Bugzilla.queryURL(
            {
                type: "defect",
                chfield: "cf_last_resolved",
                chfieldfrom: `-${weeks}w`,
            },
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
    updateBurnDown();
}

function updateBurnDown() {
    if (!(g.openReady && g.trendsReady)) return;

    const vars = {};
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
