import * as BugList from "buglist";
import * as Global from "global";
import * as Tabs from "tabs";
import * as UrlHash from "urlhash";
import { _, __, chunked, hashCode, localiseNumbers } from "util";

const TEAM_CODE_LENGTH = 4;

const g = {
    teamsByCode: new Map(),
};

export function initUI() {
    // toggle filters
    _("#buglist-filter-button").addEventListener("click", () => {
        document.body.classList.toggle("show-filters");
        saveToHash();
        setFiltersVisible();
        applyFiltersToSelectedTab();
    });

    // populate teams
    const teams = [...new Set(Global.allComponents().map((c) => c.team))]
        .filter(Boolean)
        .sort();
    _("#filter-team-value").items = teams.map((team) => ({ text: team }));
    for (const team of teams) {
        const code = teamCode(team);
        if (g.teamsByCode.has(code)) {
            // biome-ignore lint/suspicious/noConsole: should never happen
            console.error(`Team code collision: ${g.teamsByCode.get(code)} / ${team}`);
        }
        g.teamsByCode.set(code, team);
    }

    // connect per-filter checkboxes
    for (const $e of __(
        [
            "#buglist-filters .filter input[type=checkbox]",
            "#buglist-filters .filter input[type=radio]",
            "#buglist-filters .filter multi-select",
        ].join(","),
    )) {
        $e.addEventListener("change", (evt) => onFilterChange(evt.target));
    }

    // connect the match-any/match-all selector
    _("#filter-op").addEventListener("change", () => {
        saveToHash();
        applyFiltersToSelectedTab();
    });

    loadFromHash();

    // re-apply filters when tab changes
    document.addEventListener("tab.changed", () => {
        setFiltersVisible();
        applyFiltersToSelectedTab();
    });

    // apply filters when buglist is refreshed
    document.addEventListener("buglist.refresh", (evt) => {
        applyFiltersToBuglist(_(`#${evt.detail.buglistId}`));
    });
}

function setFiltersVisible() {
    // hide filters panel when disabled
    if (!document.body.classList.contains("show-filters")) {
        _("#buglist-filters").classList.add("hidden");
        for (const $buglist of __("#tabs-content .buglist-container")) {
            $buglist.classList.remove("filtered");
            for (const $tr of __($buglist, ".bug-row")) {
                $tr.classList.remove("hidden");
            }
            BugList.updateBuglistButtonState($buglist);
        }
        return;
    }

    // show filters panel, except on tabs that have opt-ed out (eg. 'components')
    const $tab = Tabs.activeTab();
    if ($tab.dataset.noFilter) {
        _("#buglist-filters").classList.add("hidden");
    } else {
        _("#buglist-filters").classList.remove("hidden");
    }
}

function onFilterChange($e, updateFiltered = true) {
    // individual filter checkbox toggled
    const $filter = $e.closest(".filter");
    const $cb = _($filter, "input[type=checkbox]");

    if ($cb.checked) {
        $filter.classList.remove("disabled");
    } else {
        $filter.classList.add("disabled");
    }
    for (const $el of __($filter, "input[type=radio], multi-select")) {
        $el.disabled = !$cb.checked;
    }

    if (updateFiltered) {
        saveToHash();
        applyFiltersToSelectedTab();
    }
}

// read the filters from the ui; undefined means the filter is disabled, while
// an empty array means it's enabled with nothing selected
function readFilters() {
    return {
        op: _("#filter-op").value,
        severity: _("#filter-severity").checked
            ? _("#filter-severity-value").value
            : undefined,
        priority: _("#filter-priority").checked
            ? _("#filter-priority-value").value
            : undefined,
        team: _("#filter-team").checked ? _("#filter-team-value").value : undefined,
        needinfo: _("#filter-needinfo").checked
            ? _("#filter-needinfo-present").checked
            : undefined,
        regressor: _("#filter-regressor").checked
            ? _("#filter-regressor-present").checked
            : undefined,
    };
}

function writeFilters(filters) {
    _("#filter-op").value = filters.op;
    _("#filter-severity").checked = filters.severity !== undefined;
    _("#filter-severity-value").value = filters.severity ?? [];
    _("#filter-priority").checked = filters.priority !== undefined;
    _("#filter-priority-value").value = filters.priority ?? [];
    _("#filter-team").checked = filters.team !== undefined;
    _("#filter-team-value").value = filters.team ?? [];
    _("#filter-needinfo").checked = filters.needinfo !== undefined;
    _("#filter-needinfo-present").checked = filters.needinfo === true;
    _("#filter-needinfo-missing").checked = filters.needinfo !== true;
    _("#filter-regressor").checked = filters.regressor !== undefined;
    _("#filter-regressor-present").checked = filters.regressor === true;
    _("#filter-regressor-missing").checked = filters.regressor !== true;

    for (const $cb of __("#buglist-filters .filter input[type=checkbox]")) {
        onFilterChange($cb, false);
    }
}

// filters are serialised as a list of tokens, each a leading letter followed by
// its value; eg. severity S1+S2 with a needinfo becomes ["s12", "n1"]
function encode(filters) {
    const tokens = [];
    // matching any filter is the default, so only "all" needs a token
    if (filters.op === "and") {
        tokens.push("a");
    }
    if (filters.severity !== undefined) {
        tokens.push(`s${filters.severity.map((v) => v.slice(1)).join("")}`);
    }
    if (filters.priority !== undefined) {
        tokens.push(`p${filters.priority.map((v) => v.slice(1)).join("")}`);
    }
    if (filters.team !== undefined) {
        tokens.push(`t${filters.team.map((team) => teamCode(team)).join("")}`);
    }
    if (filters.needinfo !== undefined) {
        tokens.push(`n${filters.needinfo ? "1" : "0"}`);
    }
    if (filters.regressor !== undefined) {
        tokens.push(`r${filters.regressor ? "1" : "0"}`);
    }
    return tokens;
}

function decode(tokens) {
    const filters = {
        op: "or",
        severity: undefined,
        priority: undefined,
        team: undefined,
        needinfo: undefined,
        regressor: undefined,
    };
    for (const token of tokens) {
        const value = token.slice(1);
        switch (token[0]) {
            case "a":
                filters.op = "and";
                break;
            case "s":
                filters.severity = decodeOptions("#filter-severity-value", "S", value);
                break;
            case "p":
                filters.priority = decodeOptions("#filter-priority-value", "P", value);
                break;
            case "t": {
                const teams = chunked([...value], TEAM_CODE_LENGTH)
                    .map((code) => g.teamsByCode.get(code.join("")))
                    .filter(Boolean);
                filters.team =
                    value.length > 0 && teams.length === 0 ? undefined : teams;
                break;
            }
            case "n":
                filters.needinfo = value === "1";
                break;
            case "r":
                filters.regressor = value === "1";
                break;
        }
    }
    return filters;
}

// eg. ("#filter-severity-value", "S", "13") -> ["S1", "S3"]
function decodeOptions(selector, prefix, value) {
    const valid = new Set(_(selector).items.map((item) => item.value));
    return [...value].map((v) => prefix + v).filter((v) => valid.has(v));
}

// team names are too long for the url, so they're referenced by a fixed-width
// hash of the name, which is stable as teams come and go
function teamCode(team) {
    return (hashCode(team) >>> 0)
        .toString(36)
        .padStart(TEAM_CODE_LENGTH, "0")
        .slice(-TEAM_CODE_LENGTH);
}

function saveToHash() {
    // the panel being open is stored as the presence of the segment, so urls
    // are unchanged from before filtering existed while it's closed
    UrlHash.set(
        "f",
        document.body.classList.contains("show-filters")
            ? encode(readFilters())
            : undefined,
    );
}

export function loadFromHash() {
    const tokens = UrlHash.get("f");
    document.body.classList.toggle("show-filters", tokens !== undefined);
    writeFilters(decode(tokens ?? []));
}

function applyFiltersToSelectedTab() {
    if (!Tabs.activeTab().dataset.noFilter) {
        for (const $buglist of __(".content.selected .buglist-container")) {
            applyFiltersToBuglist($buglist);
        }
    }
}

function applyFiltersToBuglist($buglist) {
    // only if required
    if (!document.body.classList.contains("show-filters")) return;

    // reschedule if we're still loading, unless there's no refresh coming
    if (
        $buglist.classList.contains("loading") &&
        !$buglist.classList.contains("lazy-unloaded") &&
        !$buglist.classList.contains("error")
    ) {
        setTimeout(() => applyFiltersToBuglist($buglist), 100);
        return;
    }

    // skip empty buglists
    if (!_($buglist, ".bug-row")) {
        $buglist.classList.remove("filtered");
        $buglist.classList.remove("all-filtered");
        BugList.updateBuglistButtonState($buglist);
        return;
    }

    // collect filters; an enabled filter with nothing selected matches bugs
    // which have no value set
    const filters = readFilters();
    if (filters.severity?.length === 0) filters.severity = ["-"];
    if (filters.priority?.length === 0) filters.priority = ["-"];
    if (filters.team?.length === 0) filters.team = [undefined, ""];

    // buglists are filtered whenever the panel is open, even if no filters are enabled
    $buglist.classList.add("filtered");

    const visible = {};
    for (const $tr of __($buglist, ".bug-row")) {
        const bug = $tr.bug;

        // bugs have two rows, only need to calc visibility once
        if (!(bug.id in visible)) {
            const matches = [];
            if (filters.severity !== undefined) {
                matches.push(filters.severity.includes(bug.severity));
            }
            if (filters.priority !== undefined) {
                matches.push(filters.priority.includes(bug.priority));
            }
            if (filters.team !== undefined) {
                matches.push(filters.team.includes(bug.team));
            }
            if (filters.needinfo !== undefined) {
                matches.push(filters.needinfo === bug.needinfos.length > 0);
            }
            if (filters.regressor !== undefined) {
                matches.push(filters.regressor === bug.regressed_by.length > 0);
            }
            // no enabled filters means nothing to match against, so every bug stays visible
            visible[bug.id] =
                matches.length === 0 ||
                (filters.op === "and" ? matches.every(Boolean) : matches.some(Boolean));
        }

        // apply visibility
        if (visible[bug.id]) {
            $tr.classList.remove("hidden");
        } else {
            $tr.classList.add("hidden");
        }
    }

    // handle when all bugs are filtered out
    const visibleCount = Object.values(visible).filter(Boolean).length;
    $buglist.classList.toggle("all-filtered", visibleCount === 0);
    BugList.updateBuglistButtonState($buglist);

    const $counter = _($buglist, ".counter-filtered");
    const counterVars = { count: visibleCount, total: $buglist.bugCount };
    localiseNumbers(counterVars);
    $counter.textContent = `${counterVars.count} of ${counterVars.total} bug${$buglist.bugCount === 1 ? "" : "s"}`;
}
