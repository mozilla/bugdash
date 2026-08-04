import { _, __ } from "util";

/* global tippy */

export function initOptionsMenu(
    $container,
    $optionsTemplate,
    valueGetter,
    valueSetter,
) {
    const $button = _($container, "button");
    tippy($button, {
        trigger: "click",
        interactive: true,
        arrow: false,
        placement: "bottom",
        offset: [0, 2],
        allowHTML: true,
        content: () => {
            const $content = $optionsTemplate.cloneNode(true);
            $content.id = "";
            $content.classList.add("options-menu");
            $content.classList.remove("hidden");
            return $content.outerHTML;
        },
        onShow(instance) {
            for (const $li of __(instance.popper, ".options-menu li")) {
                $li.classList.remove("selected");
            }
            const value = valueGetter();
            _(
                instance.popper,
                `.options-menu li[data-value="${value}"]`,
            )?.classList.add("selected");
        },
        onShown(instance) {
            if (!instance.popper.dataset.initialised) {
                instance.popper.addEventListener("click", (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    instance.hide();

                    valueSetter(event.target.dataset.value, event.target.textContent);
                });
                instance.popper.dataset.initialised = "1";
            }
        },
    });
    $button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
}

const sharedMenu = {
    $button: null,
    instance: null,
};

function hideSharedMenu() {
    sharedMenu.$button?.classList.remove("menu-open");
    sharedMenu.$button = null;
    sharedMenu.instance?.hide();
}

export function initSharedMenu(selector, $optionsTemplate, onSelect, onShow) {
    document.addEventListener("click", (event) => {
        if (event.target.closest("[data-tippy-root]")) return;

        const $button = event.target.closest(selector);
        if (!$button) {
            hideSharedMenu();
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if ($button === sharedMenu.$button) {
            hideSharedMenu();
            return;
        }

        sharedMenu.$button?.classList.remove("menu-open");
        sharedMenu.instance?.destroy();
        sharedMenu.$button = $button;
        $button.classList.add("menu-open");
        sharedMenu.instance = tippy($button, {
            trigger: "manual",
            hideOnClick: false,
            interactive: true,
            arrow: false,
            placement: "bottom",
            offset: [0, 2],
            allowHTML: true,
            content: () => {
                const $menu = $optionsTemplate.cloneNode(true);
                $menu.id = "";
                $menu.classList.add("options-menu");
                $menu.classList.remove("hidden");
                onShow?.($button, $menu);
                return $menu.outerHTML;
            },
            onShown(instance) {
                instance.popper.addEventListener("click", (menuEvent) => {
                    const $item = menuEvent.target.closest("li[data-value]");
                    if (!$item) return;
                    menuEvent.preventDefault();
                    menuEvent.stopPropagation();
                    hideSharedMenu();
                    onSelect($button, $item);
                });
            },
            onHidden(instance) {
                setTimeout(() => instance.destroy(), 0);
            },
        });
        sharedMenu.instance.show();
    });
}
