import * as Bugzilla from "bugzilla";
import * as Dialog from "dialog";
import * as Global from "global";
import { _, __, chunked, cloneTemplate, timeAgo, updateTemplate } from "util";

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
                refresh($buglist.id);
                return;
            }

            // open-in-bugzilla button
            const $buglistBtn = event.target.closest(".buglist-btn");
            if ($buglistBtn) {
                if (event.shiftKey) {
                    if ($buglistBtn.bugIDs.length > 50) {
                        await Dialog.alert("Unable to open more than 50 tabs.");
                        return;
                    }
                    for (const id of $buglistBtn.bugIDs.reverse()) {
                        const url = Bugzilla.bugUrl(id);
                        // eslint-disable-next-line no-console
                        console.log("opening", url);
                        window.open(url, "_blank");
                    }
                } else {
                    window.open(Bugzilla.buglistUrl($buglistBtn.bugIDs), "_blank");
                }
                return;
            }

            // toggle open/closed
            if (!$buglist.classList.contains("no-bugs")) {
                $buglist.classList.toggle("closed");
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
    document.addEventListener("buglist.refresh", () => {
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

export function newGroup($container) {
    const $root = cloneTemplate(_("#buglist-group-template")).querySelector(
        ".buglist-group"
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
} = {}) {
    const $root = cloneTemplate(_("#buglist-template")).querySelector(
        ".buglist-container"
    );
    $root.id = id;
    updateTemplate($root, { title: title, description: description });
    $container.append($root);
    g.buglists[id] = {
        $root: $root,
        query: query,
        includeFn: include,
        $timestampTemplate: _(`#bug-row-timestamp-${template || "creation"}`),
        augmentFn: augment,
        orderFn: order,
        usesComponents: usesComponents,
        url: undefined,
        initialised: false,
    };
}

export function updateQuery(id) {
    const buglist = g.buglists[id];
    const url = Bugzilla.queryURL(
        buglist.query,
        buglist.usesComponents ? Global.selectedComponents() : undefined
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

export async function refresh(id) {
    const buglist = g.buglists[id];
    const $list = _(buglist.$root, ".buglist");
    buglist.$root.classList.add("loading");
    buglist.$root.classList.remove("no-bugs");
    buglist.initialised = true;
    for (const $button of __(buglist.$root, "button")) {
        $button.disabled = true;
    }
    $list.innerHTML = "";

    // execute query
    const response = await Bugzilla.rest(buglist.url);

    // build results
    const now = Date.now();
    let bugs = [];
    for (const bug of response.bugs) {
        bug["url"] = `https://bugzilla.mozilla.org/${bug.id}`;
        bug["severity_title"] = severityTitles[bug.severity] || "";
        bug["creation_epoch"] = Date.parse(bug.creation_time);
        bug["creation_ago"] = timeAgo(bug.creation_epoch);
        bug["creation"] = new Date(bug.creation_epoch).toLocaleString();
        bug["updated_epoch"] = Date.parse(bug.last_change_time);
        bug["updated_ago"] = timeAgo(bug.updated_epoch);
        bug["updated"] = new Date(bug.updated_epoch).toLocaleString();
        bug["type_icon"] = typeMaterialIconNames[bug.type];
        if (bug.groups.length > 0) {
            bug.groups = bug.groups.join(",");
            bug["groups_icon"] = typeMaterialIconNames.private;
        }
        bug.owner =
            bug.assigned_to === "nobody@mozilla.org"
                ? "-"
                : bug.assigned_to_detail.nick || bug.assigned_to_detail.real_name;
        if (
            bug.assigned_to !== "nobody@mozilla.org" &&
            bug.owner !== bug.assigned_to_detail.real_name
        ) {
            bug["owner_name"] = bug.assigned_to_detail.real_name;
        }
        bug.reporter = bug.creator_detail.nick || bug.creator_detail.real_name;
        if (bug.reporter !== bug.creator_detail.real_name) {
            bug["reporter_name"] = bug.creator_detail.real_name;
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
            const chunkedBugs = chunked(bugs, 10);
            for (const bugChunk of chunkedBugs) {
                const includePromises = [];
                for (const bug of bugChunk) {
                    includePromises.push(
                        // eslint-disable-next-line no-async-promise-executor
                        new Promise(async (resolve) => {
                            bug.include = await buglist.includeFn(bug);
                            resolve(true);
                        })
                    );
                }
                await Promise.allSettled(includePromises);
            }
        } else {
            for (const bug of bugs) {
                bug.include = buglist.includeFn(bug);
            }
        }
        bugs = bugs.filter((bug) => bug.include);
    }

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
                ni["requestee_detail"] = users[ni.requestee];
            }
        }
    }

    // augment and sort bug lists
    for (const bug of bugs) {
        bug["assigned_to_nick"] =
            bug["assigned_to"] === "nobody@mozilla.org"
                ? "-"
                : bug.assigned_to_detail.nick || bug.assigned_to_detail.real_name;
        bug["assigned_to_name"] =
            bug.assigned_to === "nobody@mozilla.org" ||
            bug.assigned_to_nick === bug.assigned_to_detail.real_name
                ? ""
                : bug.assigned_to_detail.real_name;

        bug["creator_nick"] = bug.creator_detail.nick || bug.creator_detail.real_name;
        bug["creator_name"] =
            bug.creator_nick === bug.creator_detail.real_name
                ? ""
                : bug.creator_detail.real_name;
        // eslint-disable-next-line camelcase
        bug.needinfo_icon = " ";

        if (bug.needinfos.length > 0) {
            for (const ni of bug.needinfos) {
                ni["requestee_nick"] =
                    ni.requestee_detail.nick || ni.requestee_detail.real_name;
                ni["requestee_name"] =
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
            bug["timestamp_ago"] = bug.creation_ago;
        }
    }
    bugs = buglist.orderFn
        ? bugs.sort(buglist.orderFn)
        : bugs.sort((a, b) => a.creation_epoch - b.creation_epoch);

    // update dom
    for (const $button of __(buglist.$root, "button")) {
        $button.disabled = false;
    }
    if (bugs.length > 0) {
        _(buglist.$root, ".buglist-header .buglist-btn").bugIDs = bugs.map(
            (bug) => bug.id
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
            i++;
            $list.append($row);
        }

        const summary = `${bugs.length} bug${bugs.length === 1 ? "" : "s"}`;
        _(buglist.$root, ".buglist-header .counter").textContent = summary;
    } else {
        buglist.$root.classList.add("closed");
        buglist.$root.classList.add("no-bugs");
        _(buglist.$root, ".buglist-header .counter").textContent = "No bugs";
        _(buglist.$root, ".buglist-header .buglist-btn").disabled = true;
    }

    buglist.$root.classList.remove("loading");
}
