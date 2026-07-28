import * as BugList from "buglist";
import * as REO from "buglists/reo";
import * as Global from "global";
import * as Tooltips from "tooltips";
import { _, __, cloneTemplate } from "util";

/* global tippy */

const g = {
    // teams filter: applied set, popover node, and its tippy instance
    appliedTeams: new Set(),
    $popover: undefined,
    tip: undefined,
};

function refreshLists() {
    for (const $buglist of __("#reo-content .buglist-container")) {
        BugList.updateQuery($buglist.id);
    }
}

// unique team names from the loaded Bugzilla components, sorted alphabetically
// with the "(none)" bucket last
function allTeams() {
    const teams = new Set();
    for (const c of Global.allComponents()) {
        teams.add(c.team || "(none)");
    }
    return [...teams].sort((a, b) => {
        if (a === "(none)") return 1;
        if (b === "(none)") return -1;
        return a.localeCompare(b);
    });
}

function checkedTeams() {
    return new Set([...__(g.$popover, "input:checked")].map(($cb) => $cb.value));
}

function sameSet(a, b) {
    return a.size === b.size && [...a].every((x) => b.has(x));
}

// the team rows the search box currently leaves visible
function visibleTeamRows() {
    return [...__(g.$popover, ".reo-teams-row")].filter(
        ($row) => !$row.classList.contains("hidden"),
    );
}

function updateTeamsButtons() {
    const checked = checkedTeams();
    const rows = visibleTeamRows();
    const total = __(g.$popover, ".reo-teams-row").length;

    _(g.$popover, "#reo-teams-apply").disabled = sameSet(checked, g.appliedTeams);
    // "Select none" only unchecks; Apply remains the single point that commits,
    // so this is meaningful whenever something is checked.
    _(g.$popover, "#reo-teams-select-none").disabled = checked.size === 0;
    // "Select all" acts on the rows the search shows, so it's only meaningful
    // while one of those is still unchecked. Naming the count once a search has
    // narrowed the list makes it obvious the hidden rows are left alone.
    const $selectAll = _(g.$popover, "#reo-teams-select-all");
    $selectAll.disabled =
        rows.length === 0 || rows.every(($row) => _($row, "input").checked);
    $selectAll.textContent =
        rows.length < total ? `Select all ${rows.length}` : "Select all";
    // staged selection count; the button label shows the applied count
    _(g.$popover, "#reo-teams-count").textContent =
        checked.size > 0 ? `${checked.size} selected` : "None selected";
}

function updateTeamsButton() {
    const $label = _("#reo-teams-label");
    $label.textContent =
        g.appliedTeams.size > 0
            ? `Filter by teams (${g.appliedTeams.size})`
            : "Filter by teams";
    // hover shows which teams are applied (or the filter's purpose when none).
    // Attached to the label span, not the button, so it doesn't clobber the
    // button's click-popover tippy instance.
    Tooltips.set(
        $label,
        g.appliedTeams.size > 0
            ? [...g.appliedTeams].sort().join("\n")
            : "Filter all lists by team",
    );
}

function applyTeams() {
    g.appliedTeams = checkedTeams();
    REO.setTeams(g.appliedTeams);
    refreshLists();
    saveTeamsToURL();
    updateTeamsButton();
    updateTeamsButtons();
}

function saveTeamsToURL() {
    const url = new URL(window.location.href);
    url.searchParams.delete("reoteam");
    for (const team of g.appliedTeams) {
        url.searchParams.append("reoteam", team);
    }
    if (url.href.length < 2048) {
        window.history.replaceState(undefined, undefined, url.href);
    }
}

// restore the applied teams from the URL, ignoring any that no longer exist
function loadTeamsFromURL() {
    const known = new Set(allTeams());
    const teams = new URLSearchParams(window.location.search)
        .getAll("reoteam")
        .filter((team) => known.has(team));
    g.appliedTeams = new Set(teams);
    for (const $cb of __(g.$popover, "input")) {
        $cb.checked = g.appliedTeams.has($cb.value);
    }
    REO.setTeams(g.appliedTeams);
    updateTeamsButton();
    updateTeamsButtons();
}

function buildPopover() {
    g.$popover = cloneTemplate(_("#reo-teams-popover-template")).firstElementChild;

    // one row per team
    const $list = _(g.$popover, "#reo-teams-list");
    for (const team of allTeams()) {
        const $row = cloneTemplate(_("#reo-teams-row-template")).firstElementChild;
        _($row, "input").value = team;
        _($row, ".reo-teams-name").textContent = team;
        $list.append($row);
    }

    _(g.$popover, "#reo-teams-list").addEventListener("change", updateTeamsButtons);
    _(g.$popover, "#reo-teams-search").addEventListener("input", (event) => {
        const query = event.target.value.trim().toLowerCase();
        for (const $row of __(g.$popover, ".reo-teams-row")) {
            const name = _($row, ".reo-teams-name").textContent.toLowerCase();
            $row.classList.toggle("hidden", query !== "" && !name.includes(query));
        }
        // "Select all" tracks the rows the search leaves visible
        updateTeamsButtons();
    });
    _(g.$popover, "#reo-teams-select-all").addEventListener("click", () => {
        for (const $row of visibleTeamRows()) {
            _($row, "input").checked = true;
        }
        updateTeamsButtons();
    });
    // "Select none" stages a full deselection rather than committing it, so it
    // mirrors "Select all" and can't silently discard an applied filter.
    _(g.$popover, "#reo-teams-select-none").addEventListener("click", () => {
        for (const $cb of __(g.$popover, "input:checked")) {
            $cb.checked = false;
        }
        updateTeamsButtons();
    });
    _(g.$popover, "#reo-teams-apply").addEventListener("click", () => {
        applyTeams();
        g.tip.hide();
    });
}

export function initUI() {
    const $content = _("#reo-content");

    // teams filter
    $content.append(cloneTemplate(_("#reo-teams-template")).firstElementChild);
    buildPopover();
    g.tip = tippy(_("#reo-teams-button"), {
        trigger: "click",
        interactive: true,
        arrow: false,
        placement: "bottom-start",
        appendTo: () => document.body,
        // the popover sets its own width; tippy's 350px default would clamp it
        maxWidth: "none",
        content: g.$popover,
        onShow() {
            // reset any prior search so the full list shows on reopen
            _(g.$popover, "#reo-teams-search").value = "";
            for (const $row of __(g.$popover, ".reo-teams-row")) {
                $row.classList.remove("hidden");
            }
            // reflect the applied state
            for (const $cb of __(g.$popover, "input")) {
                $cb.checked = g.appliedTeams.has($cb.value);
            }
            updateTeamsButtons();
        },
        onShown() {
            // let the user start typing to filter teams immediately
            _(g.$popover, "#reo-teams-search").focus();
        },
    });

    // restore any teams persisted in the URL (before the lists first fetch)
    loadTeamsFromURL();

    const releases = Global.releaseData();
    const versions = [
        {
            name: "release",
            title: "Release",
            release: releases.release.version - 2,
            beta: releases.beta.version - 2,
            nightly: releases.nightly.version - 2,
        },
        {
            name: "beta",
            title: "Beta",
            release: releases.release.version - 1,
            beta: releases.beta.version - 1,
            nightly: releases.nightly.version - 1,
        },
        {
            name: "nightly",
            title: "Nightly",
            release: releases.release.version,
            beta: releases.beta.version,
            nightly: releases.nightly.version,
        },
    ];

    for (const ver of versions) {
        const $group = BugList.newGroup($content);
        REO.init($group, ver);
    }
}
