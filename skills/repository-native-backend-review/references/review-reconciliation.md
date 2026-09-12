# Review Reconciliation

Read this reference when implementing several review threads, ambiguous line comments, or feedback that changes an earlier plan.

## Build one decision set

Create a compact ledger before editing:

| Source | Exact request | Interpretation | Affected contract | Code/tests | Status |
| --- | --- | --- | --- | --- | --- |
| Story, review, or user | Preserve the operative wording | State what changes and what stays | API, data, auth, or internal only | Expected locations | Pending, resolved, or needs clarification |

Use the ledger to detect conflicts across threads. Several local comments may express one broader preference, such as fewer parallel contracts, clearer ownership, or less indirection. Implement that preference only as far as the comments and repository evidence support it.

## Interpret comments narrowly and concretely

- Anchor pronouns and vague nouns to the commented expression. A request to remove a cleanup call does not automatically remove DTO validation, database constraints, or a separate required-field rule.
- A question about an abstraction asks for its concrete maintenance value. If its only effect is indirection around a few short branches, collapse it.
- A request to remove a post-save assignment does not remove relation validation or response mapping unless those are also called out.
- A request to move a type alias changes ownership and imports, not its serialized shape.
- “Frontend-owned” validation or cleanup is a trust-boundary decision. Remove the backend behavior when explicitly directed and report the resulting acceptance of client input.

Do not preserve rejected behavior under a new helper or abstraction. If an explicit later decision reverses an earlier one, update the ledger and tests to the new contract.

## Escalate only material ambiguity

Ask for clarification when plausible interpretations would differ in public API, authorization, persisted data, destructive behavior, or feature capability. Otherwise follow the narrowest interpretation supported by the exact comment and repository convention, and state the assumption in the handoff.

## Remove implementation footprints completely

When feedback removes an abstraction or behavior, search for and address:

- factories, registrations, providers, imports, exports, and implementation-only types;
- old routes, request fields, permission constants, and service calls;
- package dependencies and configuration added solely for the removed behavior;
- tests that assert the old architecture rather than the surviving contract;
- dead files and empty directories.

Preserve domain enums, database columns, migrations, and public fields unless the accepted decision also removes them.

## Verify reviewer intent

For every thread, record one of:

- the changed file and focused verification;
- why existing code already satisfies it;
- the contradiction or missing decision that prevents a safe change.

Report capabilities lost or responsibility transferred elsewhere. That is part of the result, not an implementation footnote.
