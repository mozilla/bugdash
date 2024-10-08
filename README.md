# BugDash

Dashboard of bug lists for Firefox-related components in Bugzilla, with a focus on
triage and release tracking.

Can be visited directly at https://bugdash.moz.tools/

## Development

To run a web server locally use `make run`.

Use `make format test` to reformat the code and ensure tests pass before
submitting a pull request.

## Deployment

While BugDash is a purely client-side static site, due to the storage of
Bugzilla API-Keys in localStorage it has to be hosted with a unique origin.

The easiest self-service solution we have for this is Heroku.  However, as
Heroku only hosts applications not static sites, we have to wrap a simple PHP
application around BugDash in order for Heroku to work.  The following files
facilitate this:

- `index.php`
- `composer.json`
- `.htaccess`

Deploying a new version requires the `heroku` command line tool and access to
the `mozillacorporation/bmo-bugdash` Heroku application.

Run `make deploy` to deploy a new version.
