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
    setTimeout(() => {
        _("#loading-stage").textContent = `Loading ${stage}`;
    }, 0);
}

export function debounce(targetFunction, wait) {
    let timeout;
    return (...args) => {
        const later = () => {
            timeout = undefined;
            targetFunction.apply(undefined, args);
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

const UNITS = [
    ["y", 365 * 86400],
    ["mo", 30 * 86400],
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
];

export function timeAgo(timestamp) {
    const elapsed = Math.floor((Date.now() - timestamp) / 1000);
    for (let i = 0; i < UNITS.length; i++) {
        const [unit, secs] = UNITS[i];
        if (elapsed >= secs) {
            const value = Math.floor(elapsed / secs);
            const next = UNITS[i + 1];
            if (next) {
                const value2 = Math.floor((elapsed % secs) / next[1]);
                if (value2 > 0) return `${value}${unit} ${value2}${next[0]}`;
            }
            return `${value}${unit}`;
        }
    }
    return "just now";
}

export function hashCode(s) {
    // https://stackoverflow.com/a/15710692/953
    // eslint-disable-next-line unicorn/no-array-reduce
    return s.split("").reduce((a, b) => {
        a = (a << 5) - a + b.codePointAt(0);
        return a & a;
    }, 0);
}

export function chunked(list, size) {
    // eslint-disable-next-line unicorn/new-for-builtins
    return [...Array(Math.ceil(list.length / size))].map((_, i) =>
        list.slice(i * size, i * size + size),
    );
}

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function localiseNumbers(vars) {
    for (const field of Object.keys(vars)) {
        const value = vars[field];
        if (typeof value === "number" && Number.isFinite(value)) {
            vars[field] = value.toLocaleString(undefined, {
                maximumFractionDigits: 2,
                trailingZeroDisplay: "stripIfInteger",
            });
        }
    }
}

export function arraysSameElements(a, b) {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((v, i) => v === sortedB[i]);
}
