import { _, __, chunked, cloneTemplate, shuffle, timeAgo, updateTemplate } from "util";
import * as Bugzilla from "bugzilla";
import * as Dialog from "dialog";
import * as Global from "global";
import * as Menu from "menus";
import * as Tooltips from "tooltips";

/* global tippy */

const g = {
    buglists: {},
};

export function initUI() {
    document.addEventListener("click", async (event) => {
        // check for clicks within a buglist header
        if (event.target.closest(".buglist-header")) {
            const $buglist = event.target.closest(".buglist-container");
            if (!$buglist) return;

            // refresh button
            const $refreshBtn = event.target.closest(".refresh-btn");
            if ($refreshBtn) {
                if (
                    $buglist.classList.contains("lazy") &&
                    $buglist.classList.contains("closed")
                ) {
                    await Dialog.alert(
                        "This list is expensive, and must be expanded before bugs can be loaded.",
                    );
                } else {
                    refresh($buglist.id);
                }
                return;
            }

            // open-in-bugzilla button
            const $buglistBtn = event.target.closest(".buglist-btn");
            if ($buglistBtn) {
                window.open(Bugzilla.buglistUrl($buglistBtn.bugIDs), "_blank");
                return;
            }

            // toggle open/closed
            if (
                !$buglist.classList.contains("no-bugs") ||
                $buglist.classList.contains("lazy")
            ) {
                $buglist.classList.toggle("closed");
                if (
                    !$buglist.classList.contains("closed") &&
                    $buglist.classList.contains("lazy") &&
                    $buglist.classList.contains("loading")
                ) {
                    _($buglist, ".buglist-header .counter").textContent = "-";
                    refresh($buglist.id);
                }
            }
            return;
        }

        // buglist group actions
        if (event.target.closest(".buglist-group-actions")) {
            const $target = event.target;
            if ($target.nodeName !== "A") return;
            const collapse = $target.dataset.action === "collapse";
            for (const $container of $target
                .closest(".buglist-group")
                .querySelectorAll(".buglist-container")) {
                if ($container.classList.contains("no-bugs")) continue;
                if (collapse) {
                    $container.classList.add("closed");
                } else {
                    $container.classList.remove("closed");
                }
            }
            event.preventDefault();
        }
    });

    // listen for global refresh event
    document.addEventListener("refresh", () => {
        const componentsSelected = Global.selectedComponents().length > 0;
        for (const id of Object.keys(g.buglists)) {
            if (g.buglists[id].usesComponents && !componentsSelected) {
                continue;
            }
            if (g.buglists[id].initialised) {
                refresh(id);
            }
        }
    });
}

export function initUiLast() {
    for (const $button of __(".order-btn")) {
        const buglist = g.buglists[$button.closest(".buglist-container").id];
        const $menuAction = $button.closest(".action");
        Menu.initOptionsMenu(
            $menuAction,
            _("#order-menu-template"),
            () => {
                return buglist.order;
            },
            (value, text) => {
                Tooltips.set($menuAction, value === "default" ? "" : text);
                $button.dataset.mode = value;
                buglist.order = value;
                refresh(buglist.id);
            },
        );
    }
}

export function newGroup($container) {
    const $root = cloneTemplate(_("#buglist-group-template")).querySelector(
        ".buglist-group",
    );
    $container.append($root);
    return $root;
}

export function append({
    id,
    $container,
    title,
    description,
    query,
    include,
    template,
    augment,
    order,
    usesComponents,
    lazyLoad,
    limit,
    augmentRow,
} = {}) {
    const $root = cloneTemplate(_("#buglist-template")).querySelector(
        ".buglist-container",
    );
    $root.id = id;

    if (lazyLoad) {
        description = `${description.trim()}\n\nThis list is expensive to generate and will only load when expanded.`;
    }
    updateTemplate($root, { title: title, description: description });

    $container.append($root);
    g.buglists[id] = {
        id: id,
        $root: $root,
        query: query,
        includeFn: include,
        $timestampTemplate: _(`#bug-row-timestamp-${template || "creation"}`),
        augmentFn: augment,
        order: "default",
        orderFn: order,
        usesComponents: usesComponents,
        lazyLoad: lazyLoad,
        limit: limit,
        url: undefined,
        initialised: false,
        augmentRow: augmentRow,
    };
    if (lazyLoad) {
        $root.classList.add("lazy");
        $root.classList.add("lazy-unloaded");
    }
}

export function updateQuery(id) {
    const buglist = g.buglists[id];
    const url = Bugzilla.queryURL(
        buglist.query,
        buglist.usesComponents ? Global.selectedComponents() : undefined,
    );
    if (url !== buglist.url) {
        buglist.url = url;
        refresh(id);
    }
}

const typeMaterialIconNames = {
    defect: "brightness_7",
    enhancement: "add_box",
    task: "assignment",
    private: "lock",
};

const severityTitles = {
    S1: "Catastrophic",
    S2: "Serious",
    S3: "Normal",
    S4: "Trivial",
    "n/a": "Not Applicable",
    normal: "Retriage",
};

function setErrorState(buglist) {
    buglist.$root.classList.remove("loading");
    buglist.$root.classList.add("closed");
    buglist.$root.classList.add("no-bugs");
    buglist.$root.classList.add("error");
    if (buglist.$root.classList.contains("lazy")) {
        buglist.$root.classList.add("lazy-unloaded");
        buglist.$root.classList.add("loading");
    }
    _(buglist.$root, ".buglist-header .counter").textContent = "Failed to load bugs";
}

export async function refresh(id) {
    const buglist = g.buglists[id];

    for (const $button of __(buglist.$root, "button")) {
        if (!$button.classList.contains("refresh-btn")) {
            $button.disabled = true;
        }
    }

    if (buglist.lazyLoad) {
        if (buglist.$root.classList.contains("closed")) {
            // don't load bugs in lazy-and-collapsed lists
            return;
        }
        buglist.$root.classList.remove("lazy-unloaded");
    }

    const $list = _(buglist.$root, ".buglist");
    buglist.$root.classList.add("loading");
    buglist.$root.classList.remove("no-bugs");
    buglist.$root.classList.remove("error");
    buglist.initialised = true;
    $list.innerHTML = "";

    // execute query
    let response;
    try {
        response = await Bugzilla.rest(buglist.url);
    } catch (error) {
        setErrorState(buglist);
        return;
    }

    // exit early if there are too many bugs to avoid hitting BMO rate limits
    // we do this before applying filters as some filters request more data from BMO
    const limit = buglist.limit || 2000;
    if (response.bugs.length >= limit) {
        buglist.$root.classList.remove("loading");
        buglist.$root.classList.add("no-bugs");
        buglist.$root.classList.add("error");
        _(buglist.$root, ".buglist-header .counter").textContent =
            "Too many bugs (" + response.bugs.length + ")";
        return;
    }

    // build results
    const now = Date.now();
    let bugs = [];
    for (const bug of response.bugs) {
        bug.url = `https://bugzilla.mozilla.org/show_bug.cgi?id=${bug.id}`;
        bug.severity_title = severityTitles[bug.severity] || "";
        bug.creation_epoch = Date.parse(bug.creation_time);
        bug.creation_ago = timeAgo(bug.creation_epoch);
        bug.creation = new Date(bug.creation_epoch).toLocaleString();
        bug.updated_epoch = Date.parse(bug.last_change_time);
        bug.updated_ago = timeAgo(bug.updated_epoch);
        bug.updated = new Date(bug.updated_epoch).toLocaleString();
        bug.type_icon = typeMaterialIconNames[bug.type];
        if (bug.groups.length > 0) {
            bug.groups = bug.groups.join(",");
            bug.groups_icon = typeMaterialIconNames.private;
        }
        bug.owner =
            bug.assigned_to === "nobody@mozilla.org"
                ? "-"
                : bug.assigned_to_detail.nick || bug.assigned_to_detail.real_name;
        if (
            bug.assigned_to !== "nobody@mozilla.org" &&
            bug.owner !== bug.assigned_to_detail.real_name
        ) {
            bug.owner_name = bug.assigned_to_detail.real_name;
        }
        bug.reporter = bug.creator_detail.nick || bug.creator_detail.real_name;
        if (bug.reporter !== bug.creator_detail.real_name) {
            bug.reporter_name = bug.creator_detail.real_name;
        }
        bug.severity = bug.severity === "--" ? "-" : bug.severity;
        bug.priority = bug.priority === "--" ? "-" : bug.priority;

        if (bug.flags !== undefined) {
            const needinfos = [];
            for (const flag of bug.flags) {
                if (flag.name === "needinfo") {
                    flag.epoch = Date.parse(flag.creation_date);
                    flag.date = new Date(flag.epoch).toLocaleString();
                    flag.age = Math.ceil((now - flag.epoch) / (1000 * 3600 * 24));
                    flag.ago = timeAgo(flag.epoch);
                    needinfos.push(flag);
                }
            }
            bug.needinfos = needinfos.sort((a, b) => b.age - a.age);
        }

        if (bug.keywords) {
            bug.keywords = bug.keywords.join(" ");
        }

        bugs.push(bug);
    }

    // apply filters
    if (buglist.includeFn !== undefined) {
        if (buglist.includeFn.constructor.name === "AsyncFunction") {
            // async function (eg. queries Bugzilla)
            // run in parallel, but no more than 10 at a time
            let failed = false;
            const chunkedBugs = chunked(bugs, 10);
            for (const bugChunk of chunkedBugs) {
                const includePromises = [];
                for (const bug of bugChunk) {
                    includePromises.push(
                        // biome-ignore lint/suspicious/noAsyncPromiseExecutor:
                        new Promise(async (resolve) => {
                            try {
                                bug.include = await buglist.includeFn(bug);
                            } catch (error) {
                                failed = true;
                            }
                            resolve(true);
                        }),
                    );
                }
                await Promise.allSettled(includePromises);
            }
            if (failed) {
                setErrorState(buglist);
                return;
            }
        } else {
            for (const bug of bugs) {
                bug.include = buglist.includeFn(bug);
            }
        }
        bugs = bugs.filter((bug) => bug.include);
    }

    _(buglist.$root, ".buglist-header .counter").textContent = `${bugs.length} bug${
        bugs.length === 1 ? "" : "s"
    }`;

    // get details of needinfo requestees
    const usernamesSet = new Set();
    for (const bug of bugs) {
        for (const ni of bug.needinfos) {
            usernamesSet.add(ni.requestee);
        }
    }
    const usernames = Array.from(usernamesSet);
    if (usernames.length > 0) {
        const users = {};
        if (Global.getAccount()) {
            // auth is required to get full user details
            const chunkedUsernames = chunked(usernames, 100);
            for (const usernamesChunk of chunkedUsernames) {
                const args = ["include_fields=email,nick,real_name"];
                for (const username of usernamesChunk) {
                    args.push(`names=${encodeURIComponent(username)}`);
                }
                const res = await Bugzilla.rest("user", args.join("&"));
                for (const user of res.users) {
                    users[user.email] = user;
                }
            }
        } else {
            for (const username of usernames) {
                users[username] = {
                    email: username,
                    nick: username.split("@")[0],
                    // eslint-disable-next-line camelcase
                    real_name: "",
                };
            }
        }
        for (const bug of bugs) {
            for (const ni of bug.needinfos) {
                ni.requestee_detail = users[ni.requestee];
            }
        }
    }

    // augment and sort bug lists
    for (const bug of bugs) {
        bug.assigned_to_nick =
            bug.assigned_to === "nobody@mozilla.org"
                ? "-"
                : bug.assigned_to_detail.nick || bug.assigned_to_detail.real_name;
        bug.assigned_to_name =
            bug.assigned_to === "nobody@mozilla.org" ||
            bug.assigned_to_nick === bug.assigned_to_detail.real_name
                ? ""
                : bug.assigned_to_detail.real_name;

        bug.creator_nick = bug.creator_detail.nick || bug.creator_detail.real_name;
        bug.creator_name =
            bug.creator_nick === bug.creator_detail.real_name
                ? ""
                : bug.creator_detail.real_name;
        // eslint-disable-next-line camelcase
        bug.needinfo_icon = " ";

        if (bug.needinfos.length > 0) {
            for (const ni of bug.needinfos) {
                ni.requestee_nick =
                    ni.requestee_detail.nick || ni.requestee_detail.real_name;
                ni.requestee_name =
                    ni.requestee_nick === ni.requestee_detail.real_name
                        ? ""
                        : ni.requestee_detail.real_name;
            }
            // eslint-disable-next-line camelcase
            bug.needinfo_icon = "live_help";
            // eslint-disable-next-line camelcase
            bug.needinfo_target =
                `NEEDINFO: ${bug.needinfos[0].requestee_nick} ` +
                `(${bug.needinfos[0].ago})`;
        }
    }
    if (buglist.augmentFn !== undefined) {
        for (const bug of bugs) {
            buglist.augmentFn(bug);
        }
    }
    for (const bug of bugs) {
        if (!bug.timestamp) {
            bug.timestamp = bug.creation;
            bug.timestamp_ago = bug.creation_ago;
        }
    }

    // sort
    switch (buglist.order) {
        case "oldest": {
            bugs.sort((a, b) => a.creation_epoch - b.creation_epoch);
            break;
        }
        case "newest": {
            bugs.sort((a, b) => b.creation_epoch - a.creation_epoch);
            break;
        }
        case "random": {
            bugs = shuffle(bugs);
            break;
        }
        default: {
            if (buglist.orderFn) {
                bugs.sort(buglist.orderFn);
            } else {
                bugs.sort((a, b) => a.creation_epoch - b.creation_epoch);
            }
            break;
        }
    }

    // update dom
    for (const $button of __(buglist.$root, "button")) {
        $button.disabled = false;
    }
    if (bugs.length > 0) {
        _(buglist.$root, ".buglist-header .buglist-btn").bugIDs = bugs.map(
            (bug) => bug.id,
        );
        _(buglist.$root, ".buglist-header .buglist-btn").dataset.url =
            Bugzilla.buglistUrl(bugs.map((bug) => bug.id));

        // add to dom
        const $template = _("#bug-row-template");
        let i = 0;
        for (const bug of bugs) {
            // main row
            const $row = cloneTemplate($template);
            updateTemplate($row, bug);
            // replace the timestamp cell
            const $timestamp = cloneTemplate(buglist.$timestampTemplate);
            updateTemplate($timestamp, bug);
            _($row, ".timestamp").append($timestamp);
            // set odd/even class
            for (const $tr of __($row, "tr")) {
                $tr.classList.add(i % 2 === 0 ? "odd" : "even");
            }
            if (buglist.augmentRow) {
                buglist.augmentRow($row);
            }
            i++;
            $list.append($row);
        }
    } else {
        buglist.$root.classList.add("closed");
        buglist.$root.classList.add("no-bugs");
        _(buglist.$root, ".buglist-header .counter").textContent = "No bugs";
        _(buglist.$root, ".buglist-header .order-btn").disabled = true;
        _(buglist.$root, ".buglist-header .buglist-btn").disabled = true;
    }

    buglist.$root.classList.remove("loading");
}
