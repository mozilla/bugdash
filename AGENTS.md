# BugDash

Dashboard of Bugzilla bug lists for Firefox components, aimed at triage owners
and release managers.

It is a static client-side app: plain ES modules loaded via an inline importmap,
no bundler, no build step, no backend.  Every byte of bug data is fetched live
from bugzilla.mozilla.org (BMO) in the user's browser.  Pushes to main deploy to
Netlify.

## Discuss before coding

Some changes need agreement on a GitHub issue before any code is written.  If
one is requested and no issue covers it, say so and help write the issue instead
of writing the change.

- **UI and UX changes** - layout, wording, list ordering, tooltip content, new
  buttons, icons or columns.  Every existing UI element has a defined purpose;
  don't overload one with adjacent information because it happens to be nearby.
- **Architectural changes** - anything altering the shape of `buglist.mjs`,
  `tabs.mjs`, `filters.mjs`, `bugzilla.mjs`, the url-hash grammar, or how
  queries are built and fetched.

Not gated: adding a tab, adding a bug list, and changing what an existing list
queries.  These are ordinary work.

## Framework-level, not per-list

BugDash is a small framework (`buglist`, `filters`, `tabs`, `bugzilla`,
`menus`, `multiselect`, `urlhash`) plus thin declarative modules under
`app/buglists/` and `app/tabs/` that use it.  Keep that shape.

- Generic behaviour belongs in the framework, expressed as a declarative option
  on `BugList.append()` or via the existing document events (`refresh`,
  `tab.changed`, `buglist.refresh`).
- Never solve a generic problem inside a single buglist or tab module, and never
  copy a solution across tabs.  Filtering, ordering, counting and truncation
  are framework concerns; a page-local version of any of them is wrong even if
  it works.
- Do not add a new callback or hook option to `append()` to unblock one list.
  If a list needs something the framework cannot currently express, **stop and
  raise it** rather than bolting on a hook - the framework change is the
  interesting part of the work and needs to be designed, not worked around.
- Write general-purpose solutions.  No hard-coded ids, names or values to make a
  single case work; if something can't be done properly, say so rather than
  working around it.
- Modules under `app/buglists/` stay declarative: identity, description, query,
  plus `include` / `augment` / `order` functions.  No DOM manipulation or event
  listeners.  Fetching from these modules is highly discouraged and should be
  reserved for cases that cannot be expressed using bug data from the list's
  query.
- Bug-list modules under `app/tabs/` only compose - create groups and initialise
  lists.  Special-purpose tabs such as components, overview and help own their
  tab-specific behaviour.

## Bugzilla is a shared resource

BMO is rate limited and shared with every other consumer.  Requests are paid for
by real users on real page loads, so cost is a design constraint, not an
optimisation to do later.

- Never fetch or hold full bug records for more than a list's `limit`.  When a
  query overflows, ranking happens on a cheap partial-fields fetch first, and
  only the winning ids get full records.  An `include` or `order` function that
  needs an extra field at that stage declares it via `partialFields`, and works
  correctly against both partial and full records.
- Request only the fields needed - `include_fields` is always set.  Add to the
  default field list only when most lists need the field.
- Batch and chunk.  Multiple ids per request, but respect the existing chunk
  size; `bug?id=` urls break past a few hundred ids.
- Cache what is stable, never bug data.  The component list is cached in
  localStorage; bug data staleness is surfaced in the UI instead (lists mark
  themselves outdated after 24 hours).
- Derive, don't duplicate.  A bug's team comes from the component data already
  loaded, Firefox version numbers and dates come from the release data already
  loaded.  Hardcoding a product, component, team or version list into a feature
  duplicates data that BMO already owns, and it will rot.
- An api-key is only needed for private bugs and full user details.  The app
  must stay usable without one - degrade, don't fail.
- Failures are expected, not exceptional: surface them in the list's own UI
  (error state, counter text) rather than throwing away the whole page.

## Third-party services and dependencies

- No new third-party endpoint, hosted service or JS library without prior
  agreement on an issue.
- Anything BugDash links to or fetches from must be productionised and stable.
  Demo, alpha and pre-alpha targets are not acceptable however they are labelled
  in the UI - the integration outlives the label.
- Frontend dependencies are vendored, version-pinned files in `assets/` with a
  `.txt` provenance note beside them.  There is no bundler, no runtime npm
  dependency and no build step; don't introduce one.
- Tooling (biome, ruff, zizmor, GitHub actions) is pinned to exact versions and
  shas in the Makefile and workflow.  Keep new tooling pinned the same way.

## Conventions

- DOM element variables are `$`-prefixed (`$buglist`, `$row`).  Select with
  `_` and `__` from `util`, not `document.querySelector` directly.
- Markup lives in `<template>` elements in `index.html`, cloned and populated
  through the `data-field` / `data-html` / `data-*-field` bindings.  Don't build
  HTML strings in JS.
- UI state is a class on a container (`loading`, `closed`, `no-bugs`, `hidden`,
  `filtered`, `all-filtered`, `truncated`, `outdated`, `lazy`, ...) styled in
  CSS.  No inline styles, no per-element styling from JS.
- Module state lives in a single module-local `g = {}`.  Modules are imported by
  bare importmap name (`import * as Global from "global"`) and expose
  `initUI()` or `init($container)`.
- State that should survive a reload or be shareable goes in the url hash.
  `urlhash.mjs` owns the grammar; each feature owns the meaning of its own
  segment key.
- Keep comments minimal and lowercase, explaining why rather than what.  The
  documented option block on `BugList.append()` and the framework's
  why-comments are deliberate; per-line narration is not.  Never add a comment
  saying an issue is being fixed.
- UK spelling everywhere - code, comments and UI text.  No emoji anywhere.
- `console.*` is lint-banned.  A genuine can't-happen diagnostic gets an
  explicit `biome-ignore` with a reason.

## Working on the code

- After making implementation changes, run `make format test` as a single
  command before finishing.  Not two separate make invocations - formatting,
  cache-busting and index.html formatting are ordered within the one target.
- There is deliberately no unit-test framework.  `make test` is linting,
  formatting and cache-bust verification.  Don't add a test framework and don't
  propose one.
- Verify changes by hand: `make run` serves the repo on 127.0.0.1:8000, then
  check the affected tab and lists.
- Linting and formatting passing is not verification that an issue is resolved.
