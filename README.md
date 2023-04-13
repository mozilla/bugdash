# BugDash

Dashboard of bug lists for Firefox-related components in Bugzilla, with a focus on
triage and release tracking.

Can be visited directly at https://bugdash.moz.tools/

Uses an [SVG favicon](https://commons.wikimedia.org/wiki/File:Green_bug_and_broom.svg),
provided under the GLGPL by Wikimedia User [Poznaniak](https://commons.wikimedia.org/wiki/User:Poznaniak).

## Development

To run a web server locally use `make run`.

Use `make format test` to reformat the code and ensure tests pass before
submitting a pull request (`yarn` is required to install node based tooling).
