export function _(parentOrSelector, selector) {
    return selector
        ? parentOrSelector.querySelector(selector)
        : document.querySelector(parentOrSelector);
}

export function __(parentOrSelector, selector) {
    return selector
        ? parentOrSelector.querySelectorAll(selector)
        : document.querySelectorAll(parentOrSelector);
}

export function setLoadingStage(stage) {
    setTimeout(() => (_("#loading-stage").textContent = `Loading ${stage}`), 0);
}

export function debounce(targetFunction, wait) {
    let timeout;
    return function () {
        let originalArguments = arguments;
        let later = function () {
            timeout = undefined;
            targetFunction.apply(undefined, originalArguments);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function cloneTemplate($template) {
    return document.importNode($template.content, true);
}

export function updateTemplate($content, data) {
    // simple templating engine built on data- attributes
    //   data-field        -> set textContent
    //   data-href-field   -> set href attribute
    //   data-title-field  -> set title attribute
    //   data-id-field     -> set id attribute
    // eg.
    // <div data-field="name"></div> + {"name": "bob"}
    // --> <div data-field="name">bob</div>

    for (const [name, value] of Object.entries(data)) {
        for (const $el of __($content, `*[data-field=${name}]`)) {
            $el.textContent = value;
        }
        for (const field of ["href", "title", "id"]) {
            for (const $el of __($content, `*[data-${field}-field=${name}]`)) {
                $el.setAttribute(field, value);
            }
        }
    }
}

export function timeAgo(timestamp) {
    const ss = Math.round(Date.now() - timestamp) / 1000;
    const mm = Math.round(ss / 60),
        hh = Math.round(mm / 60),
        dd = Math.round(hh / 24),
        mo = Math.round(dd / 30),
        yy = Math.round(mo / 12);
    if (ss < 10) return "Just now";
    if (ss < 45) return ss + " seconds ago";
    if (ss < 90) return "1 minute ago";
    if (mm < 45) return mm + " minutes ago";
    if (mm < 90) return "1 hour ago";
    if (hh < 24) return hh + " hours ago";
    if (hh < 36) return "1 day ago";
    if (dd < 30) return dd + " days ago";
    if (dd < 45) return "1 month ago";
    if (mo < 12) return mo + " months ago";
    if (mo < 18) return "1 year ago";
    return yy + " years ago";
}

export function hashCode(s) {
    // https://stackoverflow.com/a/15710692/953
    // eslint-disable-next-line unicorn/no-array-reduce
    return s.split("").reduce(function (a, b) {
        a = (a << 5) - a + b.codePointAt(0);
        return a & a;
    }, 0);
}

export function chunked(list, size) {
    // eslint-disable-next-line unicorn/new-for-builtins
    return [...Array(Math.ceil(list.length / size))].map((_, i) =>
        list.slice(i * size, i * size + size)
    );
}

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
