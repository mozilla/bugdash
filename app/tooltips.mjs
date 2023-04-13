import { __ } from "util";

/* global tippy */

export function set($el, content) {
    if ($el._tippy) {
        $el._tippy.destroy();
    }
    if (content.length === 0) return;
    tippy($el, {
        delay: 0,
        duration: 0,
        offset: [0, 4],
        arrow: false,
        theme: "light",
    }).setContent(content);
}

export function setFromTitle($el) {
    set($el, $el.title);
    $el.title = "";
}

export function initUI() {
    for (const $el of __("*[title]")) {
        setFromTitle($el);
    }

    const observer = new MutationObserver((mutationList) => {
        for (const mutation of mutationList) {
            // set tooltips on elements as they are added to dom
            for (const $rootEl of mutation.addedNodes) {
                if ($rootEl.nodeType === Node.ELEMENT_NODE) {
                    for (const $el of __($rootEl, "*[title]")) {
                        setFromTitle($el);
                    }
                }
            }
        }
    });
    observer.observe(document.documentElement, {
        attributes: false,
        childList: true,
        subtree: true,
    });
}
