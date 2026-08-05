import * as Bugzilla from "bugzilla";
import * as Dialog from "dialog";
import * as Global from "global";
import * as Menu from "menus";
import * as Tooltips from "tooltips";
import {
    _,
    __,
    arraysSameElements,
    chunked,
    cloneTemplate,
    localiseNumbers,
    shuffle,
    timeAgo,
    updateTemplate,
} from "util";

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
                        "This list can be expensive, and must be expanded before bugs can be loaded.",
                    );
                } else {
                    refresh($buglist.id);
                }
                return;
            }

            // open-in-bugzilla button
            const $buglistBtn = event.target.closest(".buglist-btn");
            if ($buglistBtn) {
                window.open($buglistBtn.dataset.url, "_blank");
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

    Menu.initSharedMenu(
        ".bug-menu-btn",
        _("#bug-menu-template"),
        (_evt, $button, $item) => {
            const item = $item.dataset.value;
            if (item === "hackbot") {
                const bug = $button.closest(".bug-row").bug;
                const buglistId = $button.closest(".buglist-container").id;
                const hackbotAgent = Global.getHackbotAgent(buglistId, bug);
                let url = `https://hackbot.moz.tools/?bug_id=${bug.id}`;
                if (hackbotAgent) {
                    url = `${url}&agent=${hackbotAgent}`;
                }
                _($item, "a").href = url;
            } else if (item === "of") {
                const bug = $button.closest(".bug-row").bug;
                const endday = new Date();
                const startday = new Date(endday);
                startday.setUTCDate(startday.getUTCDate() - 7);
                const format = (date) => date.toISOString().slice(0, 10);
                const url =
                    "https://treeherder.mozilla.org/intermittent-failures/bugdetails" +
                    `?startday=${format(startday)}&endday=${format(endday)}&tree=all&bug=${bug.id}`;
                _($item, "a").href = url;
            }
        },
        (bug, $menu) => {
            if (!bug.keywords.includes("intermittent-failure")) {
                _($menu, "li[data-value=of]").classList.add("disabled");
            }
        },
    );
}

export function initUiLast() {
    for (const $button of __(".order-btn")) {
        const buglist = g.buglists[$button.closest(".buglist-container").id];
        if (!buglist) continue;
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
        if (buglist.counterGuidelines !== undefined) {
            _(buglist.$root, ".buglist-header .counter-guidelines").textContent =
                "guidelines";
            Tooltips.set(
                _(buglist.$root, ".buglist-header .counter-guidelines"),
                buglist.counterGuidelines,
            );
        }
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
    // {string} unique id, used as the container's dom id
    id,
    // {Element} parent element to append the list's dom to
    $container,
    // {string} heading shown in the list's header
    title,
    // {string} explanatory text shown in the list's header
    description,
    // {object} bugzilla search query used to build the default request url
    query,
    // {(bug) => boolean|Promise<boolean>} per-bug filter, run on full records;
    // return falsy to exclude a bug
    include,
    // {boolean} if true, also run `include` during overflow ranking, against
    // partial records, before full records are fetched
    earlyFilter,
    // {string} timestamp cell template name to use (defaults to "creation")
    template,
    // {(bug) => void} per-bug function to add/derive extra template fields,
    // run after the built-in ones
    augment,
    // {(a, b) => number} default sort comparator, used until the user picks
    // another order from the list's menu
    order,
    // {string[]} extra bug fields that `include`/`order` need from a partial
    // (pre-truncation) record, beyond the fields fetched by default
    partialFields,
    // {boolean} if true, scope the query to the selected components, and skip
    // refresh when none are selected
    usesComponents,
    // {boolean} if true, don't fetch until the list is expanded
    lazyLoad,
    // {number} max bugs to fetch/display before truncating (defaults to 2000)
    limit,
    // {string} text shown behind a "guidelines" link next to the counter
    counterGuidelines,
    // {(buglist) => void} called at the start of refresh, before fetching
    beforeRefresh,
    // {(buglist) => string[]} builds the list of request urls to fetch
    // (defaults to a single query url built from `query`)
    urlsBuilder,
} = {}) {
    const $root = cloneTemplate(_("#buglist-template")).querySelector(
        ".buglist-container",
    );
    $root.id = id;

    if (lazyLoad) {
        description = `${description.trim()}\n\nThis list can be expensive to generate and will only load when expanded.`;
    }
    updateTemplate($root, { title: title, description: description });

    $container.append($root);
    g.buglists[id] = {
        id: id,
        $root: $root,
        query: query,
        includeFn: include,
        earlyFilter: !!earlyFilter,
        $timestampTemplate: _(`#bug-row-timestamp-${template || "creation"}`),
        augmentFn: augment,
        order: "default",
        orderFn: order,
        partialFields: partialFields || [],
        usesComponents: usesComponents,
        lazyLoad: lazyLoad,
        limit: limit,
        urls: [],
        initialised: false,
        counterGuidelines: counterGuidelines,
        beforeRefresh: beforeRefresh,
        urlsBuilder: urlsBuilder || _defaultUrlsBuilder,
    };
    if (lazyLoad) {
        $root.classList.add("lazy");
        $root.classList.add("lazy-unloaded");
    }
}

export function updateQuery(id) {
    const buglist = g.buglists[id];
    const updatedUrls = buglist.urlsBuilder(buglist);
    if (!arraysSameElements(updatedUrls, buglist.urls)) {
        buglist.urls = updatedUrls;
        refresh(id);
    }
}

function _defaultUrlsBuilder(buglist) {
    return [
        Bugzilla.queryURL(
            buglist.query,
            buglist.usesComponents ? Global.selectedComponents() : undefined,
        ),
    ];
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

// fields needed to rank/filter a partial record, before its full record is fetched;
// a list adds to this via the `partialFields` option to append()
const BASE_PARTIAL_FIELDS = ["id", "creation_time", "last_change_time"];

// bug?id=... URLs get too long past a few hundred ids, so full-record refetches
// after truncation are chunked, and the same threshold decides whether the
// open-in-bugzilla button can list ids explicitly or must link to the query instead
const ID_FETCH_CHUNK_SIZE = 400;

const orderTooltips = {
    default: "the list order",
    oldest: "oldest first",
    newest: "newest first",
    updated: "last updated",
    random: "a random order",
};

function deriveSortFields(bug, now) {
    // fields derived from raw bugzilla data that a list's order/include functions
    // may use; works equally on a partial record (ranking, pre-truncation) and a
    // full one (final sort), so a comparator written against these fields needs no
    // knowledge of which record shape it is given
    bug.creation_epoch = Date.parse(bug.creation_time);
    bug.creation_ago = timeAgo(bug.creation_epoch);
    bug.creation = new Date(bug.creation_epoch).toLocaleString();
    bug.updated_epoch = Date.parse(bug.last_change_time);
    bug.updated_ago = timeAgo(bug.updated_epoch);
    bug.updated = new Date(bug.updated_epoch).toLocaleString();

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
}

function sortBugs(bugs, buglist) {
    switch (buglist.order) {
        case "oldest": {
            return bugs.sort((a, b) => a.creation_epoch - b.creation_epoch);
        }
        case "newest": {
            return bugs.sort((a, b) => b.creation_epoch - a.creation_epoch);
        }
        case "updated": {
            return bugs.sort((a, b) => a.updated_epoch - b.updated_epoch);
        }
        case "random": {
            return shuffle(bugs);
        }
        default: {
            if (buglist.orderFn) {
                return bugs.sort(buglist.orderFn);
            }
            return bugs.sort((a, b) => a.creation_epoch - b.creation_epoch);
        }
    }
}

async function fetchMerged(urls) {
    const responses = await Promise.all(urls.map((url) => Bugzilla.rest(url)));
    const byId = new Map();
    for (const response of responses) {
        for (const bug of response.bugs) {
            byId.set(bug.id, bug);
        }
    }
    return Array.from(byId.values());
}

async function rankOverflow(buglist, limit) {
    // a list has more matching bugs than `limit`: fetch just enough fields to
    // filter and order every matching bug, then return the winning ids so their
    // full records can be fetched afterwards. this avoids ever holding more than
    // `limit` full bug records at once.
    const fields = Array.from(
        new Set([...BASE_PARTIAL_FIELDS, ...buglist.partialFields]),
    );
    const urls = buglist.urls.map((url) =>
        Bugzilla.withParams(url, { limit: "0", include_fields: fields.join(",") }),
    );
    let bugs = await fetchMerged(urls);

    const now = Date.now();
    for (const bug of bugs) {
        deriveSortFields(bug, now);
    }

    if (buglist.earlyFilter && buglist.includeFn) {
        bugs = bugs.filter((bug) => buglist.includeFn(bug));
    }

    // note: this total is measured after the early filter (if any), but the
    // overflow decision that led here was made on the raw, unfiltered count, so
    // it's possible for `total` to end up <= limit here after all
    const total = bugs.length;
    bugs = sortBugs(bugs, buglist);
    const truncated = bugs.length > limit;
    if (truncated) {
        bugs = bugs.slice(0, limit);
    }
    return { ids: bugs.map((bug) => bug.id), total, truncated };
}

function setErrorState(buglist) {
    buglist.$root.classList.remove("loading");
    buglist.$root.classList.add("closed");
    buglist.$root.classList.add("no-bugs");
    buglist.$root.classList.add("error");
    buglist.$root.classList.remove("truncated");
    if (buglist.$root.classList.contains("lazy")) {
        buglist.$root.classList.add("lazy-unloaded");
        buglist.$root.classList.add("loading");
    }
    const $counter = _(buglist.$root, ".buglist-header .counter");
    $counter.textContent = "Failed to load bugs";
    Tooltips.set($counter, "");
}

export async function refresh(id) {
    const buglist = g.buglists[id];
    if (buglist.beforeRefresh) {
        buglist.beforeRefresh(buglist);
    }

    for (const $button of __(buglist.$root, "button")) {
        if (!$button.classList.contains("refresh-btn")) {
            $button.disabled = true;
        }
    }

    if (buglist.lazyLoad) {
        _(buglist.$root, ".buglist-header .counter").textContent = "";
        if (buglist.$root.classList.contains("closed")) {
            // don't load bugs in lazy-and-collapsed lists
            // instead reset their state to force a reload when next opened
            buglist.$root.classList.add("lazy-unloaded");
            buglist.$root.classList.add("loading");
            buglist.$root.classList.remove("no-bugs");
            _(buglist.$root, ".buglist").innerHTML = "";
            return;
        }
        buglist.$root.classList.remove("lazy-unloaded");
    }

    const $list = _(buglist.$root, ".buglist");
    buglist.$root.classList.add("loading");
    buglist.$root.classList.remove("no-bugs");
    buglist.$root.classList.remove("error");
    buglist.$root.classList.remove("truncated");
    buglist.initialised = true;
    $list.innerHTML = "";
    Tooltips.set(_(buglist.$root, ".buglist-header .buglist-btn"), "");

    if (buglist.outdatedTimer) {
        clearTimeout(buglist.outdatedTimer);
        buglist.outdatedTimer = undefined;
    }

    // execute query, capped one above the limit so overflow can be detected without
    // downloading more than necessary
    const limit = buglist.limit ?? 2000;
    let responseBugs;
    let total;
    let truncated = false;
    try {
        responseBugs = await fetchMerged(
            buglist.urls.map((url) => Bugzilla.withParams(url, { limit: limit + 1 })),
        );
        if (responseBugs.length > limit) {
            // more bugs match than the limit allows: rank the full match set from a
            // cheap partial fetch, then fetch full records for only the winners, to
            // avoid hitting BMO rate limits by downloading everything
            const ranked = await rankOverflow(buglist, limit);
            total = ranked.total;
            truncated = ranked.truncated;
            responseBugs =
                ranked.ids.length === 0
                    ? []
                    : await fetchMerged(
                          chunked(ranked.ids, ID_FETCH_CHUNK_SIZE).map((chunk) =>
                              Bugzilla.idsURL(chunk),
                          ),
                      );
        } else {
            total = responseBugs.length;
        }
    } catch (_error) {
        setErrorState(buglist);
        return;
    }

    buglist.$root.classList.remove("outdated");
    buglist.outdatedTimer = setTimeout(
        () => {
            buglist.$root.classList.add("outdated");
        },
        1000 * 60 * 60 * 24,
    );

    // build results
    const now = Date.now();
    let bugs = [];
    for (const bug of responseBugs) {
        deriveSortFields(bug, now);
        bug.url = `https://bugzilla.mozilla.org/show_bug.cgi?id=${bug.id}`;
        bug.severity_title = severityTitles[bug.severity] || "";
        bug.type_icon = typeMaterialIconNames[bug.type];
        if (bug.groups.length > 0) {
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
        bug.team = Global.getComponent(bug.product, bug.component)?.team;

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
                        // biome-ignore lint/suspicious/noAsyncPromiseExecutor: it's fine
                        new Promise(async (resolve) => {
                            try {
                                bug.include = await buglist.includeFn(bug);
                            } catch (_error) {
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

    buglist.$root.classList.toggle("truncated", truncated);
    const $counter = _(buglist.$root, ".buglist-header .counter");
    if (truncated) {
        const counterVars = { count: bugs.length, total: total };
        localiseNumbers(counterVars);
        $counter.textContent = `${counterVars.count} of ${counterVars.total} bugs`;
        Tooltips.set(
            $counter,
            `Limited to the first ${counterVars.count} bugs` +
                (buglist.order === "default"
                    ? ""
                    : `, sorted by ${orderTooltips[buglist.order]}`),
        );
    } else {
        $counter.textContent = `${bugs.length} bug${bugs.length === 1 ? "" : "s"}`;
        Tooltips.set($counter, "");
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
        bug.stalled = bug.keywords.includes("stalled");
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
    bugs = sortBugs(bugs, buglist);

    // update dom
    for (const $button of __(buglist.$root, "button")) {
        $button.disabled = false;
    }
    if (bugs.length > 0) {
        const ids = bugs.map((bug) => bug.id);
        const $buglistBtn = _(buglist.$root, ".buglist-header .buglist-btn");
        if (ids.length <= ID_FETCH_CHUNK_SIZE) {
            $buglistBtn.dataset.url = Bugzilla.buglistUrl(ids);
        } else if (buglist.urls.length === 1) {
            // too many ids to list explicitly in a buglist.cgi url, so link to
            // the underlying query instead
            $buglistBtn.dataset.url = Bugzilla.queryUrlToBuglistUrl(buglist.urls[0]);
        } else {
            // too many ids to list explicitly, and the list spans more than one
            // query (eg. uplift-candidates), so there's no single query url that
            // covers every matching bug either
            $buglistBtn.disabled = true;
            Tooltips.set($buglistBtn, "Too many bugs to open in Bugzilla");
        }

        // add to dom
        const $template = _("#bug-row-template");
        let i = 0;
        for (const bug of bugs) {
            // build keywords html
            bug.keywords_html = bug.keywords
                .map((kw) => `<span class="keyword-${kw}">${kw}</span>`)
                .join(" ");
            // main row
            const $row = cloneTemplate($template);
            updateTemplate($row, bug);
            // replace the timestamp cell
            const $timestamp = cloneTemplate(buglist.$timestampTemplate);
            updateTemplate($timestamp, bug);
            _($row, ".timestamp").append($timestamp);
            // bug-row attributes
            for (const $tr of __($row, "tr")) {
                $tr.classList.add(i % 2 === 0 ? "odd" : "even");
                $tr.bug = bug;
                if (bug.stalled) {
                    $tr.classList.add("stalled-bug");
                }
            }
            i++;
            $list.append($row);
        }
    } else {
        buglist.$root.classList.add("closed");
        buglist.$root.classList.add("no-bugs");
        buglist.$root.classList.remove("truncated");
        _(buglist.$root, ".buglist-header .counter").textContent = "No bugs";
        Tooltips.set(_(buglist.$root, ".buglist-header .counter"), "");
        _(buglist.$root, ".buglist-header .order-btn").disabled = true;
        _(buglist.$root, ".buglist-header .buglist-btn").disabled = true;
    }

    buglist.$root.classList.remove("loading");
}
