---
name: repository-native-backend-review
description: Plan, implement, refactor, or review backend changes so they satisfy confirmed requirements and follow an established repository's conventions. Use for PR feedback, repository-native feature work, and backend changes involving API contracts, validation, persistence, authorization, schema, or tests. Do not use as a substitute for product requirements or for greenfield architecture with no repository evidence.
---

# Repository-Native Backend Review

Build the smallest solution that satisfies the confirmed contract and looks like it belongs in the repository.

## Establish the contract

1. Read repository instructions, the user story, acceptance criteria, and all supplied review threads before editing.
2. Inspect the current branch and two or three genuinely analogous modules. Compare only the layers relevant to the task: routes, DTOs, services, validators, query construction, persistence, authorization, migrations, and tests.
3. Convert requirements and review comments into one decision ledger with the source, intended behavior, affected code, and verification. Distinguish confirmed requirements from inferences.
4. Resolve references such as “this,” “validation,” or “remove it” from the exact commented line and surrounding code. Do not broaden a local comment into unrelated behavior.
5. Surface contradictions that would materially change the API, stored data, security, or feature capability. Prefer a newer explicit decision when the user asks to implement it, and report the behavior it supersedes.

For multiple or conflicting review comments, read [review reconciliation](references/review-reconciliation.md).

## Design from repository evidence

- Treat repeated local structure as the primary design guide. Current repository code overrides examples and assumptions in this skill.
- Preserve public routes, request and response shapes, status codes, authorization, and persistence behavior unless a confirmed requirement changes them.
- Match existing naming, folder layout, imports, error handling, pagination, filtering, ordering, localization, and testing conventions.
- Classify each operation before placing it: validation observes and rejects; normalization converts an accepted value; cleanup mutates data; persistence saves intended state. Do not disguise cleanup as validation.
- Earn new abstractions with independent variation, reuse, extension pressure, or a repository convention. Prefer a local branch or focused helper for a small closed set of cases.
- Avoid speculative dependencies, endpoints, DTO hierarchies, mappers, constraints, indexes, and shared-infrastructure changes.

For NestJS or TypeORM work, read [NestJS and TypeORM practices](references/nestjs-typeorm-practices.md).

## Implement conservatively

- Keep the change bounded to the decision ledger. Do not add adjacent improvements unless they are necessary for correctness.
- For PATCH-like behavior, validate an effective state made from stored values plus supplied fields when cross-field checks require it, but persist only caller-supplied fields. The validation snapshot is not automatically the update payload.
- Do not silently clear unrelated fields because a discriminator makes them irrelevant. Cleanup needs an explicit backend-owned canonicalization requirement.
- When deleting or collapsing an abstraction, remove its complete implementation footprint while preserving domain concepts and public contracts that remain required.
- Keep schema declarations, entity metadata, runtime types, validation, API documentation, and migrations aligned.
- Do not compensate in production code for an unrealistic mock. Verify framework or ORM behavior and protect the real contract with a focused test.
- Never serialize, cast, or weaken a value merely to satisfy an inaccurate annotation; correct the contract at the appropriate boundary.

## Verify the whole change

1. Map every ledger item to changed code, a test, or a documented reason that no change is needed.
2. Search for removed symbols, stale imports, old routes or permissions, dead registrations, empty folders, and tests that preserve deleted behavior.
3. Run the repository's formatter, focused lint, typecheck or build, and the smallest meaningful test set. Expand testing in proportion to risk.
4. Run `git diff --check`, inspect the complete diff against the intended base, and confirm no unrelated user changes were overwritten.
5. Report verification honestly. Separate feature failures from environment or pre-existing failures and identify any unverified assumption.

Do not commit, push, resolve review threads, deploy, migrate live data, or change external systems unless the user authorizes that action.

## Hand off the result

Lead with the outcome. Summarize the contract implemented, meaningful tradeoffs or removed capabilities, files or layers changed, and verification performed. Explain non-obvious placement decisions in terms of repository consistency and ownership; do not claim the result is immune to future correction.
