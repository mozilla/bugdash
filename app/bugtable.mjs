import { _, cloneTemplate, localiseNumbers, updateTemplate } from "util";

const g = {
    bugtables: {},
};

export function initUI() {
    document.addEventListener("click", async (event) => {
        // check for clicks within a bugtabler header
        if (event.target.closest(".bugtable-header")) {
            const $bugtable = event.target.closest(".bugtable-container");
            if (!$bugtable) return;

            // refresh button
            const $refreshBtn = event.target.closest(".refresh-btn");
            if ($refreshBtn) {
                g.bugtables[$bugtable.id].updateRequired = true;
                g.bugtables[$bugtable.id].update();
            }
        }
    });

    // listen for global refresh event
    document.addEventListener("refresh", () => {
        for (const bugtable of Object.values(g.bugtables)) {
            bugtable.updateRequired = true;
            bugtable.update();
        }
    });
}

export function append({ id, $container, template, tableContiner, updateFunc } = {}) {
    const $root = _(cloneTemplate(_(template)), tableContiner);
    $root.id = id;
    $root.classList.add("open");
    $container.append($root);
    $container.append(document.createElement("br"));

    g.bugtables[id] = {
        id: id,
        $root: $root,
        update: updateFunc,
        updateRequired: true,
    };
}

export function refresh(id) {
    g.bugtables[id].updateRequired = true;
    g.bugtables[id].update();
}

export async function updateWrapper(id, loadHandler, updateHandler) {
    const bugtable = g.bugtables[id];
    if (!bugtable.updateRequired) {
        return;
    }

    // reset all values in table to "-"
    let vars = {};
    for (const $el of bugtable.$root.querySelectorAll("*[data-field]")) {
        vars[$el.dataset.field] = "-";
    }
    updateTemplate(bugtable.$root, vars);

    // load data from bugzilla
    bugtable.$root.classList.add("loading");
    bugtable.$root.classList.remove("error");
    let response;
    try {
        response = await loadHandler();
        bugtable.$root.classList.remove("loading");
    } catch (error) {
        bugtable.$root.classList.remove("loading");
        bugtable.$root.classList.add("error");
        // eslint-disable-next-line no-console
        console.error(error);
        return;
    }

    // generate vars and update dom
    vars = await updateHandler(response);
    localiseNumbers(vars);
    updateTemplate(bugtable.$root, vars);

    bugtable.updateRequired = false;
}
