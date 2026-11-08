# AGENTS.md

## Project overview
- `backend/`: Node.js (ESM), Express 5, Mongoose, Zod, JWT
- `frontend/`: React 19, Vite, React Router 7, Axios
- `database/`: seeders for initializing / restoring the DB
- Backend flow: `Route → Middleware → Controller → Service (business logic only) → Mongoose Model`
- Frontend flow: `Page → Components/Hooks → Services → API`
- Commands: backend `npm run dev | lint | test`; frontend `npm run dev | build`
- Git workflow and commit convention: see `CONTRIBUTING.md`

## 1. General rules
- Write simple, explicit code. Do not compress code just to save lines: no nested ternaries,
  no hard-to-read `&&` / `?.` / destructuring chains, no one-liners packing multiple steps.
  Use descriptive names for variables and functions.
- Change only what the task asks for. Do not refactor, rename, or delete unrelated code.
  If you notice other problems, list them under "Việc nên làm tiếp theo?".
- Before writing new code, read similar existing code (backend reference: the auth module).
- **If anything is unclear, ask instead of deciding on your own.** Always ask before:
  changing a DB schema, changing an API contract (URL, request, response), adding a new
  dependency, or deleting a file.
- Never commit `.env` files or hardcode secrets.
- Before reporting a task as done, run the relevant lint/build and report the real result.

## 2. Frontend
- **Components:** before creating a component, search `src/components/` for an existing one to reuse.
  - Used by 2+ screens → `src/components/common/`
  - Used by one screen only → `src/components/<feature>/`
- **Pages:** pages only compose components and call hooks/services. Split repeated or long
  UI blocks into components to keep each file small.
- **CSS:** one CSS file per screen at `src/styles/<screen>.css`; shared styles go in
  `src/styles/index.css`. No inline styles except for dynamic values.
- **API calls:** all API calls go through `src/services/<feature>Service.js` using the `api`
  instance from `src/services/api.js`. Check whether the service function already exists
  before adding one. Never import axios or use `fetch` inside pages/components.

## 3. Backend (reference: auth module)
### Checklist for a new API
1. **Route:** `routes/<feature>.routes.js`, mounted in `routes/index.routes.js` as `/<feature>/v1`.
2. **Middleware order:** `authentication` → `authorize(...roles)` → `validator(schema)` → controller.
   Skip `authentication` only for public APIs (login, register, …) and add a comment explaining why.
3. **Validator:** `common/validator/<feature>Schema.js` (Zod), required for every POST/PUT/PATCH API.
4. **Controller:** `controllers/<feature>.controller.js`. Wrap each handler with `asyncHandler`
   and respond with `responseCommon`.
5. **Basic CRUD:** call Mongoose model methods directly (`Model.find`, `findById`, `create`,
   `findByIdAndUpdate`, …) from the controller or service. Do not create repository files.
6. **Service:** `services/<feature>.service.js`, created only for business logic (checking rules,
   combining several models, hashing passwords, issuing tokens, …). Do not create a service
   function that only wraps a single CRUD call.
7. **Errors:** `throw new AppError(message, status)`. Do not `try/catch` and call `res.status()`
   in controllers; the error middleware handles it.
8. **Docs:** document every new endpoint in `docs/api/`.

### Pagination (required for every GET API that returns a list)
- Query: `page` (default 1), `limit` (default 10, max 100)
- Response:
  ```json
  { "success": 1, "message": "...", "data": { "items": [], "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 } } }
  ```

### Planned — not implemented yet (do not build unless asked)
- `validator(schema, source)` supporting `body` / `query` / `params`, so GET query params
  (`page`, `limit`, filters) can be validated.
- `authorize(...roles)` middleware for role-based access. Until it exists, leave it out of
  routes and add a `// TODO: authorize(...)` comment where it is needed.

### Comment above every service function
```js
/**
 * Register a new account
 * @param {Object} data - { full_name, email, password, role }
 * @returns {Promise<{ user: Object, token: string }>} user (without password_hash) and JWT
 */
```

## 4. Summary after every task (required)
```
**Đã hoàn thành việc gì?**
- <task 1>
- <task 2>

**Sửa những file nào?**
- `path/to/file.js`: <what changed> (liên quan: <task 1>)
- `path/to/other.js`: <what changed> (liên quan: <task 2>)

**Việc nên làm tiếp theo?** (short and to the point, no filler)
- [High|Medium|Low] <task> — <why>
- [High|Medium|Low] <task> — <why>
```
