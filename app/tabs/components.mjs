import * as Dialog from "dialog";
import * as Global from "global";
import * as Tooltips from "tooltips";
import { _, __, debounce } from "util";

const g = {
    $table: undefined,
    lastQuery: undefined,
};

const onSelectedChanged = debounce(() => {
    const selected = Global.selectedComponents();

    // counter in tab
    _("#selected-components-count").textContent =
        selected.length === 0 ? "" : `(${selected.length})`;

    // disabled tabs
    for (const $tab of __("#components-tab-group .tab")) {
        if ($tab.dataset.tab !== "components") {
            if (selected.length === 0) {
                $tab.classList.add("disabled");
            } else {
                $tab.classList.remove("disabled");
            }
        }
    }

    // tab tooltip
    const tooltip = [];
    if (selected.length === 0) {
        tooltip.push("No components selected.");
    } else {
        for (const c of selected) {
            tooltip.push(c.title);
        }
    }
    if (selected.length > 50) {
        Tooltips.set(
            _("#selected-components-title"),
            "More than 50 components selected"
        );
    } else {
        Tooltips.set(_("#selected-components-title"), tooltip.join("\n"));
    }

    // "selected only" checkbox
    if (!_("#filter-selected").checked) {
        _("#filter-selected").disabled = selected.length === 0;
        if (selected.length === 0) {
            _("label[for=filter-selected]").classList.add("disabled");
        } else {
            _("label[for=filter-selected]").classList.remove("disabled");
        }
    }

    saveToURL();
}, 10);

function onFilterKeyUp(event) {
    if (event.key === "Escape") {
        // escape to clear the filter and show all
        _("#component-filter").value = "";
        for (const $tr of __("#components tr")) {
            $tr.classList.remove("hidden");
        }
        _("#tab-components").classList.remove("no-matching-components");
        g.lastQuery = undefined;
        return;
    }

    applyFilter();
}

function applyFilter() {
    // no need to filter if unchanged
    const queryOptions = [
        _("#component-filter").value.trim().toLowerCase(),
        _("#filter-scope").value,
        _("#filter-selected").checked.toString(),
    ].join("\n");
    if (queryOptions === g.lastQuery) {
        return;
    }
    g.lastQuery = queryOptions;

    const query = _("#component-filter").value.trim().toLowerCase();

    // component title or team that contain all of the filter words
    const queryWords = query.split(/\s+/);
    let matches = 0;
    const field = _("#filter-scope").value;
    for (const c of Global.allComponents()) {
        if (queryWords.every((w) => c[field].toLowerCase().includes(w))) {
            _(`#c${c.id}-row`).classList.remove("hidden");
            matches++;
        } else {
            _(`#c${c.id}-row`).classList.add("hidden");
        }
    }

    if (matches === 0) {
        _("#tab-components").classList.add("no-matching-components");
    } else {
        _("#tab-components").classList.remove("no-matching-components");
    }

    onSelectedChanged();
}

export async function initUI() {
    g.$table = _("#components tbody");

    _("#components").addEventListener("click", (event) => {
        if (event.target.nodeName === "TD") {
            // clicking anywhere on a row should toggle the checkbox
            const $row = event.target.closest("tr");
            if ($row && $row.classList.contains("row")) {
                _($row, "input[type=checkbox]").click();
            }
        }
        if (event.target.nodeName === "INPUT") {
            onSelectedChanged();
        }
    });

    _("#component-filter").addEventListener("keyup", debounce(onFilterKeyUp, 100));
    _("#filter-scope").addEventListener("change", applyFilter);

    _("#filter-all").addEventListener("click", async () => {
        const components = __("#components tr:not(.hidden) input:not(:checked)");
        if (components.length > 50) {
            await Dialog.alert(
                "Too many visible components. Please filter to show fewer than 50."
            );
            return;
        }
        for (const $cb of components) {
            $cb.click();
        }
    });
    _("#filter-none-visible").addEventListener("click", () => {
        for (const $cb of __("#components tr:not(.hidden) input:checked")) {
            $cb.click();
        }
    });
    _("#filter-none").addEventListener("click", () => {
        for (const $cb of __("#components input:checked")) {
            $cb.click();
        }
    });
    _("#filter-selected").addEventListener("click", () => {
        if (_("#filter-selected").checked) {
            _("#component-filter").disabled = true;
            _("#filter-scope").disabled = true;
            for (const $cb of __("#components input")) {
                const $tr = $cb.closest("tr");
                if ($cb.checked) {
                    $tr.classList.remove("hidden");
                } else {
                    $tr.classList.add("hidden");
                }
            }
            g.lastQuery = undefined;
        } else {
            _("#component-filter").disabled = false;
            _("#filter-scope").disabled = false;
            applyFilter();
        }
    });

    // always start with an empty filter, even if the browser restored the input
    _("#component-filter").value = "";

    refreshTable();
    loadFromURL();
    onSelectedChanged();

    document.addEventListener("tab.components", () => {
        document.body.classList.remove("component-warning");
        saveToURL();
        _("#component-filter").focus();
    });
}

function loadFromURL() {
    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.has("team")) {
        const team = searchParams.get("team");
        for (const c of Global.allComponents()) {
            if (c.team === team) {
                _(`#c${c.id}`).checked = true;
            }
        }
    } else {
        const selectedComponents = new Set(searchParams.getAll("component"));
        for (const c of Global.allComponents()) {
            const key = `${c.product}:${c.component}`;
            if (selectedComponents.has(key)) {
                _(`#c${c.id}`).checked = true;
                selectedComponents.delete(key);
            }
        }
        if (selectedComponents.size > 0) {
            document.body.classList.add("component-warning");
        }
    }
}

function saveToURL() {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    searchParams.delete("component");
    searchParams.delete("team");

    const selected = Global.selectedComponents();

    // if the filter scope is a team and all components in that team are selected
    // then use that team as the search params
    if (selected.length > 0 && _("#filter-scope").value === "team") {
        const team = selected[0].team;
        const teamComponents = Global.allComponents().filter((c) => c.team === team);
        if (
            selected.every((c) => c.team === team) &&
            selected.length === teamComponents.length
        ) {
            searchParams.append("team", team);
        }
    }

    // otherwise use individual components
    if (!searchParams.has("team")) {
        for (const c of selected) {
            searchParams.append("component", `${c.product}:${c.component}`);
        }
    }
    if (url.href.length < 2048) {
        window.history.replaceState(undefined, undefined, url.href);
    }
}

function refreshTable() {
    for (const $tr of __(g.$table, ".row")) {
        $tr.remove();
    }

    const $template = _("#components-row");
    for (const component of Global.allComponents()) {
        // create <tr> from <template>
        const $row = document.importNode($template.content, true).querySelector("tr");

        // set row id from component id
        $row.dataset.component = component.id;
        const id = `c${component.id}`;
        $row.id = `c${component.id}-row`;
        _($row, "input[type=checkbox]").id = id;
        for (const $label of __($row, "label")) {
            // associate <label> with this row's checkbox
            $label.setAttribute("for", id);
            // set cell content
            $label.textContent = component[$label.dataset.field];
        }

        g.$table.append($row);
    }
}
