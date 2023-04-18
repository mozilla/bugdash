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
        if (selected.length === 0) {
            $tab.classList.add("disabled");
        } else {
            $tab.classList.remove("disabled");
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
}, 10);

function onFilterKeyUp(event) {
    if (event.key === "Escape") {
        // escape to clear the filter and show all
        _("#component-filter").value = "";
        for (const $tr of __("#components tr")) {
            $tr.classList.remove("hidden");
        }
        _("#tab-components").classList.remove("no-matching-components");
        return;
    }

    // no need to filter if unchanged
    const query = _("#component-filter").value.trim().toLowerCase();
    if (query === g.lastQuery) {
        return;
    }
    g.lastQuery = query;

    // component title that contain all of the filter words
    const queryWords = query.split(/\s+/);
    let matches = 0;
    for (const c of Global.allComponents()) {
        if (queryWords.every((w) => c.title.toLowerCase().includes(w))) {
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
            saveToURL();
        }
    });

    _("#component-filter").addEventListener("keyup", debounce(onFilterKeyUp, 100));

    _("#filter-all").addEventListener("click", () => {
        for (const $cb of __("#components tr:not(.hidden) input:not(:checked)")) {
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
        } else {
            g.lastQuery = undefined;
            _("#component-filter").disabled = false;
            onFilterKeyUp();
        }
        for (const $cb of __("#components input")) {
            const $tr = $cb.closest("tr");
            if ($cb.checked) {
                $tr.classList.remove("hidden");
            } else {
                $tr.classList.add("hidden");
            }
        }
    });
    _("#filter-selected").addEventListener("click", () => {
        const filtered = _("#filter-selected").checked;
        for (const $cb of __("#components input")) {
            const $tr = $cb.closest("tr");
            if (!filtered || $cb.checked) {
                $tr.classList.remove("hidden");
            } else {
                $tr.classList.add("hidden");
            }
        }
        onSelectedChanged();
    });

    // always start with an empty filter, even if the browser restored the input
    _("#component-filter").value = "";

    refreshTable();
    loadFromURL();
    onSelectedChanged();

    document.addEventListener("tab.components", () => {
        _("#component-filter").focus();
    });
}

function loadFromURL() {
    const searchParams = new URLSearchParams(window.location.search);
    const selectedComponents = new Set(searchParams.getAll("component"));
    for (const c of Global.allComponents()) {
        if (selectedComponents.has(`${c.product}:${c.component}`)) {
            _(`#c${c.id}`).checked = true;
        }
    }
}

function saveToURL() {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    searchParams.delete("component");
    for (const c of Global.selectedComponents()) {
        searchParams.append("component", `${c.product}:${c.component}`);
    }
    if (url.href.length < 2048) {
        window.history.pushState(undefined, undefined, url.href);
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
