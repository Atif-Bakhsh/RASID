# RASID repository map

RASID is one repository. The current NestJS/TypeScript backend lives at the repository root (`src/`, `test/`, root `package.json`); PostgreSQL is the database, accessed through TypeORM. The planned Next.js frontend belongs in `frontend/`, with separate dependencies/build. Do not move the backend to scaffold it.

This is an Arabic-first, synthetic/manual/sanitized-demo-data portfolio project, not a banking or financial-advice service.

## Read first

- [README.md](README.md): scope, setup, commands, limitations.
- [docs/CODEX_HANDOFF.md](docs/CODEX_HANDOFF.md): current-state handoff and next step.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DECISIONS.md](docs/DECISIONS.md): boundaries, data model, tradeoffs.
- [docs/VERIFICATION.md](docs/VERIFICATION.md): dated evidence of checks actually performed.
- [docs/LEARNING_GUIDE.md](docs/LEARNING_GUIDE.md): request traces and ownership exercises.
- [docs/FRONTEND_HANDOFF.md](docs/FRONTEND_HANDOFF.md) and [docs/openapi.json](docs/openapi.json): frontend behavior and API contracts.

## Working rules

- Inspect repository state, relevant DTOs/controllers/services, migrations, tests, and existing API contracts before changing behavior. Preserve unrelated changes.
- Do not rewrite or duplicate backend behavior without a clear reason. Keep authorization, financial calculations, validation, and import semantics in the existing backend.
- For intentional API changes, update tests/documentation and regenerate the contract with `pnpm openapi:export`.
- Repository state and documented evidence are more reliable than assumptions from previous conversation history. Historical passing checks are not proof of the current environment.

## Verification (from repository root)

```sh
pnpm check
TEST_DATABASE_URL=postgresql://rasid:rasid-local-demo-only@localhost:55432/postgres pnpm test:e2e
```

`pnpm check` runs formatting, lint, strict typecheck, unit tests, and build. HTTP/database tests require local PostgreSQL and a role with `CREATEDB`; they create/drop only an isolated `rasid_test_*` database. The URL above is local-demo configuration, never production.

Run `pnpm smoke:demo` against the running, seeded demo for runtime/reconciliation checks; see README for setup.

Before claiming success on code changes, run appropriate lint, typecheck, success/failure tests, and build for each affected application. Report failures or checks not run. Documentation-only changes require formatting, link, and diff checks; do not claim fresh backend test results from those checks.
