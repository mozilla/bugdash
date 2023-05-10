import { _, cloneTemplate, updateTemplate } from "util";

/* eslint-disable camelcase */

export function initUI() {
    const header_values = {
        title: "Example Bug List",
        description: "A description of the parameters of the bug list",
    };
    const $fragment = cloneTemplate(_("#buglist-template"));
    updateTemplate($fragment, header_values);
    _("#help-sample").append($fragment);
    const $sample = _("#help-sample .buglist-container");
    _($sample, ".refresh-btn").title = "Reloads the bug list";
    _($sample, ".buglist-btn").title = "Open the list of bugs in Bugzilla.";
    $sample.classList.remove("loading", "closed");

    const bug_values = {
        id: "123456",
        summary: "Sample Bug Summary",
        type_icon: "brightness_7",
        type: "Bug type (defect, enhancement, task)",
        needinfo_icon: "live_help",
        needinfo_target:
            "Shown on bugs with an open NEEDINFO request. " +
            "If multiple requests details of the oldest is show",
        groups_icon: "lock",
        groups: "Padlock shown on private bugs",
        severity: "S2",
        severity_title: "Severity",
        priority: "P3",
        priority_title: "Priority",
        product: "Core",
        component: "General",
        component_title: "Product and Component",
        creator_nick: "glob",
        creator_name: "Reporter",
        assigned_to_nick: "somebody",
        assigned_to_name: "Assignee",
        keywords: "regression, topcrash",
        keywords_title: "Keywords",
        timestamp_ago: "3 days ago",
        timestamp: "Relevant timestamp; usually bug's creation",
    };
    const $row = cloneTemplate(_("#bug-row-template"));
    updateTemplate($row, bug_values);
    const $timestamp = cloneTemplate(_("#bug-row-timestamp-creation"));
    updateTemplate($timestamp, bug_values);
    _($row, ".timestamp").append($timestamp);
    _($sample, ".buglist").append($row);

    $sample.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
}
