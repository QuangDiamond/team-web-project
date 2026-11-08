# Backend cleanup

## Scope

Scanned 159 JavaScript source files with the installed Espree parser for identical
function bodies, then checked call sites and source before consolidating helpers.
Matching names alone do not imply duplication: route handlers, services and DTOs
with different permissions, filters or response shapes remain separate.

## Changes

- `parseQuery` is the single query-schema parsing helper. Admin users, payments,
  AI suggestions and student dashboards now use it, retaining the same Zod
  transformations, first error message, 422 status and field errors.
- Student dashboard pagination uses the shared `buildPagination`.
- AI suggestions and plan/pack DTOs use the shared `decimalToNumber`. Non-finite
  billing values become explicit null, matching their previous JSON serialization.
- Admin user searches use the existing `escapeRegex`.
- Email and mock-checkout HTML use one `escapeHtml` implementation in `html.js`.
- Migrated all 20 legacy response calls to
  `responseCommon(res, data, message, statusCode, success)`. Removed the overloads;
  HTTP statuses and the `{ success, message, data }` response envelope are preserved.

No schema, dependency, route URL or frontend changes. Authentication and business
checks were preserved. No files, routes or models were deleted based only on graph
degree or apparent name similarity.

## Follow-up outside the cleanup

- `/api/user/v1/get` is currently unauthenticated and reads full User documents.
  It is an active route, not dead code. Restrict access and project safe fields in
  a separate change; it must not expose password hashes or authentication data.

Verification uses backend unit tests and ESLint; no live database, SMTP or PSP
requests are required for this cleanup.

Result: 71/71 backend tests and `npm run lint` pass.
