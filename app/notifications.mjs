import { _, cloneTemplate, hashCode, updateTemplate } from "util";

export function info(message, { key, onClick } = {}) {
    show({
        message: message,
        key: key,
        severity: "info",
        sticky: true,
        onClick: onClick,
    });
}

export function error(message, { key, onClick } = {}) {
    show({
        message: message,
        key: key,
        severity: "error",
        sticky: false,
        onClick: onClick,
    });
}

function show({ message, key, severity, sticky, onClick } = {}) {
    key ??= String(hashCode(message ?? ""));

    if (_(`.notification[data-key="${key}"]`)) return;
    if (loadDismissed()[key]) return;

    const $content = cloneTemplate(_("#notification-template"));
    updateTemplate($content, { message: message, icon: severity });
    const $notification = _($content, ".notification");
    $notification.classList.add(severity);
    $notification.dataset.key = key;

    if (onClick) {
        $notification.classList.add("clickable");
        _($notification, ".notification-message").addEventListener("click", onClick);
    }

    _($notification, ".notification-dismiss").addEventListener("click", () => {
        if (sticky) {
            setDismissed(key);
        }
        $notification.remove();
    });
    _("#notifications").append($content);
}

export function remove({ key } = {}) {
    if (key) {
        _(`.notification[data-key="${key}"]`)?.remove();
        unsetDismissed(key);
    }
}

function loadDismissed() {
    let dismissed = {};
    try {
        const stored = JSON.parse(
            window.localStorage.getItem("dismissed-notifications") ?? "{}",
        );
        if (typeof stored === "object" && !Array.isArray(stored)) {
            // dismissals expire after 90 days
            dismissed = Object.fromEntries(
                Object.entries(stored).filter(
                    ([, timestamp]) =>
                        timestamp >= Date.now() - 90 * 24 * 60 * 60 * 1000,
                ),
            );
        }
    } catch {
        // malformed
    }
    return dismissed;
}

function setDismissed(key) {
    const dismissed = loadDismissed();
    dismissed[key] = Date.now();
    window.localStorage.setItem("dismissed-notifications", JSON.stringify(dismissed));
}

function unsetDismissed(key) {
    const dismissed = loadDismissed();
    delete dismissed[key];
    window.localStorage.setItem("dismissed-notifications", JSON.stringify(dismissed));
}
