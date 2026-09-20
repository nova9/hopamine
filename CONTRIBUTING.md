# Contributing

Thank you for helping improve Hopamine Virtual Events.

## Before you start

- Check existing issues and pull requests to avoid duplicate work.
- Open an issue before a large behavioral or architectural change.
- Follow the product requirements in `docs/req.md` and the implementation plan
  in `docs/plan.md`.
- Follow the repository instructions in `AGENTS.md`.

## Development workflow

1. Fork the repository and create a focused branch.
2. Install dependencies with `pnpm install`.
3. Apply the local database migrations with `pnpm migrate-local`.
4. Make a small, focused change using existing project patterns.
5. Run the required checks:

   ```sh
   pnpm lint
   pnpm build
   ```

6. Open a pull request describing the problem, the solution, and how you tested
   it. Include screenshots for visible UI changes.

## Project conventions

- Keep public and moderator permissions enforced in the Worker API.
- Do not edit generated shadcn primitives by hand. Add or update them with the
  shadcn CLI.
- Do not edit `src/index.css`, `vite.config.ts`, or `.oxlintrc.json`.
- Reuse canonical types, schemas, constants, and business rules.
- Add a new numbered migration instead of changing a migration that may already
  have been applied.
- Never commit credentials, `.dev.vars`, local databases, uploaded files, or
  Cloudflare account-specific identifiers.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
