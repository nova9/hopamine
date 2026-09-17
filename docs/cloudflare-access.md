# Cloudflare Access setup

Event management is restricted to moderators. Public event browsing remains open.

Create a Cloudflare Access self-hosted application for the deployed Hopamine hostname and protect both path groups:

- `/admin/*`
- `/api/admin/*`

Create an Allow policy containing only the moderator email addresses or moderator identity-provider group. Keep the public `/events/*` and `/api/events*` paths outside that policy.

The Worker also checks for a verified Cloudflare Access identity on every `/api/admin/*` request. Requests without that identity receive `401 Unauthorized`, even if someone discovers the API endpoint directly.

Local development uses Wrangler's `access.dev` simulation with `moderator@hopamine.local`. This identity exists only in local development and does not grant production access.

Do not expose the deployment through an unprotected alternate hostname. Disable the public `workers.dev` route or apply the same Access policy to it.
