# BugDash

Dashboard of bug lists for Firefox-related components in Bugzilla, with a focus on
triage and release tracking.

Can be visited directly at https://bugdash.moz.tools/

## Development

To run a web server locally use `make run`.

Use `make format test` to reformat the code and ensure tests pass before
submitting a pull request.

## Deployment

BugDash runs on Netlify; pushes to main are automatically deployed.
