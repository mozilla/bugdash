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
