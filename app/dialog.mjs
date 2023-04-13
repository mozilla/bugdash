import { _ } from "util";

const g = {
    resolve: undefined,
};

export function alert(message) {
    if (g.resolve) {
        return new Promise((resolve) => resolve(false));
    }
    reset();

    return new Promise((resolve) => {
        g.resolve = resolve;
        _("#dialog").classList.add("dialog-alert");
        _("#dialog-message").textContent = message;
        _("#dialog-wrapper").classList.remove("hidden");
    });
}

export function prompt(message, value, placeholder) {
    if (g.resolve) {
        return new Promise((resolve) => resolve(false));
    }
    reset();

    return new Promise((resolve) => {
        g.resolve = resolve;
        _("#dialog").classList.add("dialog-prompt");
        _("#dialog-message").textContent = message;
        if (placeholder) {
            _("#dialog-input").placeholder = placeholder;
        }
        if (value === undefined) {
            _("#dialog-input").value = "";
        } else {
            _("#dialog-input").value = value;
            _("#dialog-input").select();
        }
        _("#dialog-wrapper").classList.remove("hidden");
        _("#dialog-input").focus();
    });
}

export function showSpinner(message) {
    if (!_("#dialog-wrapper").classList.contains("hidden")) return;

    _("#dialog").classList.add("dialog-spinner");
    _("#dialog-message").textContent = message;
    _("#dialog-wrapper").classList.remove("hidden");
}

export function hideSpinner() {
    reset();
}

function reset() {
    _("#dialog-wrapper").classList.add("hidden");
    _("#dialog").classList.remove("dialog-alert", "dialog-prompt", "dialog-spinner");
}

export function initUI() {
    document.addEventListener("keyup", (event) => {
        if (_("#dialog-wrapper").classList.contains("hidden")) return;

        if (event.key === "Escape") {
            _("#dialog-cancel").click();
            return;
        }
        if (event.key === "Enter") {
            _("#dialog-ok").click();
            return;
        }
    });

    _("#dialog-cancel").addEventListener("click", () => {
        _("#dialog-wrapper").classList.add("hidden");
        g.resolve(false);
        g.resolve = undefined;
    });
    _("#dialog-ok").addEventListener("click", () => {
        _("#dialog-wrapper").classList.add("hidden");
        if (_("#dialog").classList.contains("dialog-prompt")) {
            g.resolve(_("#dialog-input").value);
        } else {
            g.resolve(true);
        }
        g.resolve = undefined;
    });
}
