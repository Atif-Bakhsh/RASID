# NestJS and TypeORM Practices

Use this reference only when the repository uses NestJS, TypeORM, or directly analogous layers. Confirm every pattern against current code before applying it.

## Responsibilities

- Keep controllers focused on routes, guards and permission decorators, DTO binding, and response assembly.
- Keep small CRUD services cohesive and orchestration-focused. One service with conventional create, list, find, update, and delete operations is often clearer than one class per operation.
- Put reusable existence, uniqueness, state, and business-policy checks in the repository's established validator or policy classes. Let an existence check return the narrowed entity when that avoids a duplicate query.
- Localize errors at their source when the project has an i18n contract. Do not introduce hard-coded user-facing messages into validators.
- Put dynamic filters, search, and ordering in specifications only when the repository already uses specification-based composition. A fixed query does not earn a new specification.
- Use DTOs for request validation and API documentation, entities for persistence metadata, and migrations for physical schema changes.
- Keep shared request or response value shapes in the feature's existing DTO, types, or interfaces location, not inside an entity. Check runtime imports for cycles.

## Update and persistence semantics

- Directly assign values when no transformation is needed. Avoid rebuilding identical nested objects.
- `Object.assign(entity, dto)` is appropriate for ordinary patch semantics only when DTO-exposed fields are all caller-updatable. It copies supplied keys and preserves omitted ones.
- For cross-field PATCH validation, construct an effective state from the stored entity and explicit DTO values. Validate it, then apply only supplied fields.
- Treat validation as observational. Do not null discriminator-dependent fields unless backend-owned cleanup is a confirmed contract.
- Attach validated relations before `repository.create()` or `save()` and verify spread order cannot overwrite them. Do not reattach the relation after save without evidence that persistence loses it.
- Align entity decorators, runtime types, migration defaults, nullable behavior, creation behavior, and response types.
- For JSON or JSONB, verify whether the accepted payload is a record, array, or structured object. Type annotations, Swagger examples, runtime validation, and storage are separate contracts that must agree.

## Query and authorization safety

- Allow-list client-provided ordering fields. Never interpolate arbitrary input into SQL identifiers.
- Follow the repository's shared `order` and `orderBy` vocabulary instead of creating a feature-specific sorting dialect.
- Treat Swagger security decorators as documentation unless the project explicitly wires them to runtime guards. Verify actual authentication and permission enforcement.
- Prefer capability-oriented permission names only when that matches the repository's authorization model. Adding a permission constant may require an operational role-data rollout; report that dependency.

## Shared infrastructure

- Reuse existing upload or infrastructure endpoints when they satisfy the confirmed contract.
- Do not change shared service limits, parameters, or behavior for one feature without an explicit shared-contract decision.
- When removing a feature-specific endpoint, verify the generic flow's real file types, size limits, and authorization. Report any gap rather than assuming equivalence.

## Focused tests

- Validator tests cover success and each business or localized error path.
- Specification tests cover filters, search, ordering defaults, and allow-listed fields.
- Service tests cover orchestration, repository calls, supplied-versus-omitted update fields, and relation mapping.
- Controller tests cover routes, guards or permission decorators, DTO binding, and forwarding.
- Migration or integration tests protect actual schema defaults and ORM-returned values when mocks cannot represent them reliably.

After a simplification, delete tests for the removed abstraction and replace them with tests of the surviving behavior. Search for obsolete providers, factories, methods, paths, permissions, DTOs, and imports.
