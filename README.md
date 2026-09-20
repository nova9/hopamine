# Hopamine Virtual Events

Hopamine Virtual Events is a community event hub for discovering upcoming
virtual events and preserving the presentations, documents, and other resources
shared around them.

Visitors can browse events and contribute submissions to upcoming events.
Moderators can create and edit events, manage event media, and remove
submissions. Completed events become a read-only public archive.

## Features

- Upcoming and past event listings with permanent event pages
- Public community submissions with document and presentation uploads
- Cloudflare Access-protected moderator tools
- Automatic event status based on the event date
- D1 persistence, R2 file storage, and Worker-side authorization
- Responsive UI built with React and the shadcn Lyra design system

## Technology

- React, TypeScript, Vite, and TanStack Router
- Hono on Cloudflare Workers
- Cloudflare D1, R2, Access, and rate limiting
- Tailwind CSS and shadcn/ui
- pnpm

## Local development

### Prerequisites

- Node.js 22 or later
- pnpm 11 or later
- A Cloudflare account for deployment (not required for basic local development)

Install dependencies and initialize the local D1 database:

```sh
pnpm install
pnpm migrate-local
pnpm dev
```

Wrangler provides a simulated moderator identity during local development. The
site is available at the URL printed by Vite.

## Cloudflare setup

Before deploying a fork:

1. Create a D1 database named `hopamine-db`.
2. Create an R2 bucket named `hopamine-files`.
3. Copy `wrangler.jsonc.example` to `wrangler.jsonc` and replace its
   `REPLACE_WITH_*` values with identifiers from your Cloudflare account.
4. Configure a Cloudflare Access application as described in
   [docs/cloudflare-access.md](docs/cloudflare-access.md).
5. Apply migrations and deploy with `pnpm run deploy`.

If you choose different resource names, update both `wrangler.jsonc` and
`scripts/deploy.sh`.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the local development server |
| `pnpm build` | Type-check and create a production build |
| `pnpm lint` | Run Oxlint |
| `pnpm migrate-local` | Apply D1 migrations locally |
| `pnpm deploy` | Validate resources, migrate D1, and deploy |

## Project structure

```text
src/          React application and routes
worker/       Hono API and Cloudflare Worker code
migrations/   Ordered D1 database migrations
docs/         Operational documentation
scripts/      Deployment tooling
```

The product requirements live in [docs/req.md](docs/req.md), with the
implementation and design constraints in [docs/plan.md](docs/plan.md).

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before
opening a pull request. Do not report security issues in a public issue.

## License

Licensed under the [MIT License](LICENSE).
