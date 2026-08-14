import { _, cloneTemplate, hashCode, updateTemplate } from "util";

export function info(message) {
    show(message, "info", true);
}

export function error(message) {
    show(message, "error", false);
}

function show(message, severity, sticky) {
    const key = String(hashCode(message));

    if (_(`.notification[data-key="${key}"]`)) return;
    if (loadDismissed()[key]) return;

    const $content = cloneTemplate(_("#notification-template"));
    updateTemplate($content, { message: message, icon: severity });
    const $notification = _($content, ".notification");
    $notification.classList.add(severity);
    $notification.dataset.key = key;
    _($notification, ".notification-dismiss").addEventListener("click", () => {
        if (sticky) {
            setDismissed(key);
        }
        $notification.remove();
    });
    _("#notifications").append($content);
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
