# Categories: subjects and education levels

Admin screen: `/admin/categories`. Types: `subjects` (existing SUBJECTS collection)
and `grades` (new GRADE_LEVELS collection, displayed as “Cấp học / Trình độ”).
Level names are free text up to 50 characters: Lớp 1–12, IELTS, TOEIC, Đại học, etc.
Subject names are free text up to 100 characters. No dependency or post schema change.

## Endpoints

| Method | URL | Access |
| --- | --- | --- |
| GET | `/api/categories/v1/:type` | Public; active entries only |
| GET | `/api/admin/v1/categories/:type` | ADMIN; active and inactive |
| POST | `/api/admin/v1/categories/:type` | ADMIN; create |
| PUT | `/api/admin/v1/categories/:type/:id` | ADMIN; update |
| DELETE | `/api/admin/v1/categories/:type/:id` | ADMIN; delete unused entry |

GET supports `page=1`, `limit=10` (maximum 100), optional `q` (literal name search,
maximum 100 characters). Returns `responseCommon` with `data.items` and
`data.pagination { page, limit, total, totalPages }`. Sorted by sort_order, name, ID.

POST/PUT body:

```json
{ "name": "IELTS", "sort_order": 13, "is_active": true, "reason": "Thêm trình độ" }
```

DELETE body: `{ "reason": "Không còn sử dụng" }`. Returns `data: { deleted: true }`.
Every mutation records UPDATE_SETTINGS in AdminAuditLog with reason and snapshots.
Middleware order: authentication → authorize ADMIN → Zod body validator → controller.
Unknown type or invalid/missing ID returns 404, invalid body/query returns 422,
duplicate name or delete/rename of an item referenced by posts, requests or tutor teaching categories returns 409.

## Existing content

Posts and parent requests store names rather than category IDs. To keep historical
content searchable, a referenced name cannot be renamed/deleted; turn it off and
create another entry instead. Existing forms retain an old selected name when
editing; inactive names are absent from new selections. No existing posts are rewritten.
Subjects and grades in public tutor filters now match exact names (case-insensitive),
consistent with request filters. Old free-text/range labels are not migrated.

## Shared frontend source

`useSubjectNames` loads both catalogs through `categoryService` and fetches all
pages. Consumers: Tutor PostForm, parent RequestForm, RequestFilters,
TutorSearchFilters and homepage grade selector. Loading failures show no static fallback.
An admin change is visible on the next page mount/reload; no live push is implemented.

## Initialize existing environments

From `backend/`, run `npm run seed:categories` once using the same backend database
configuration. This creates missing seeded subjects and Lớp 1–12, and unique name
indexes. `$setOnInsert` preserves existing admin edits/disabled entries. It does not
rewrite posts or clear collections. The script has NOT been run by the agent.

Do not run the full database restore just for this change. Other new levels can be
created from the admin screen. The older authenticated `/api/subjects/v1` endpoint
is retained for compatibility.
