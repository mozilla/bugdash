# BugDash

Dashboard of bug lists for Firefox-related components in Bugzilla, with a focus on
triage and release tracking.

Can be visited directly at https://bugdash.moz.tools/

## Development

To run a web server locally use `make run`.

Use `make format test` to reformat the code and ensure tests pass before
submitting a pull request (`yarn` is required to install node based tooling).

## Deployment

While BugDash is a purely client-side static site, due to the storage of
Bugzilla API-Keys in localStorage it has to be hosted with a unique origin;
this means that `github.io` or CNAMEs pointing to it are not viable hosting
solutions.

The easiest self-service solution we have for this is Heroku.  BugDash exists
on Heroku as the `bmo-bugdash` app under the `mozillacorporation` organisation.
However, as Heroku only hosts applications not static sites, we have to wrap a
simple PHP application around BugDash in order for Heroku to work.  The
following files facilitate this:

- `index.php`
- `composer.json`
- `.htaccess`

Deploying a new version requires the `heroku` command line tool:

Setup:

1. `heroku login`
2. `heroku git:remote -a bmo-bugdash`

Deploy:

1. `git push heroku main`
