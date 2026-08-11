// app state stored in the document hash
//
// this module owns the grammar only; each feature owns the meaning of its own
// segment ("tab" belongs to tabs, "f" to filters)

const SEGMENT_DELIMITER = "|";
const KEY_DELIMITER = ".";
const KEY_ORDER = ["tab", "f"];

export function read() {
    const state = new Map();
    for (const segment of document.location.hash.slice(1).split(SEGMENT_DELIMITER)) {
        if (segment === "") continue;
        const [key, ...values] = segment.split(KEY_DELIMITER);
        state.set(key, values);
    }
    return state;
}

export function get(key) {
    return read().get(key);
}

export function set(key, values, options) {
    // pass undefined values to drop the segment
    const state = read();
    if (values === undefined) {
        state.delete(key);
    } else {
        state.set(key, values);
    }
    write(state, options);
}

export function write(state, { push = false, path } = {}) {
    const url =
        (path ?? document.location.pathname + document.location.search) +
        serialise(state);
    if (!push) {
        history.replaceState("", "", url);
    } else if (new URL(url, document.location.href).href !== document.location.href) {
        history.pushState("", "", url);
    }
}

function serialise(state) {
    const keys = [...state.keys()].sort((a, b) => keyIndex(a) - keyIndex(b));
    const segments = keys.map((key) => [key, ...state.get(key)].join(KEY_DELIMITER));
    return segments.length === 0 ? "" : `#${segments.join(SEGMENT_DELIMITER)}`;
}

function keyIndex(key) {
    const index = KEY_ORDER.indexOf(key);
    return index === -1 ? KEY_ORDER.length : index;
}
