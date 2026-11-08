# Implementation brief: UC39, UC17, UC18, UC37

Shared source of truth for every agent working on these use cases. Read this file, `AGENTS.md`
and `docs/requirements/uc17_18_37_39.md` (SRS excerpt) before starting.

## 1. Use cases and screens (SRS numbering)

| Order | UC | Name | Actors | SRS screen | Figma reference (`C:\otherDisk\dev\Sem8\WDP\screens\src\pages\FeatureScreens.tsx`) |
|---|---|---|---|---|---|
| 1 | UC39 | Manage Plans & Pricing | Admin | SC41 Plans & Pricing | **No Figma screen.** Design it in the same style as the admin screens (`AdminList`, `system-settings` "Payments & Fees") |
| 2 | UC17 | Upgrade Plan & Buy Credits | Tutor, Parent | SC20 Checkout, SC21 Payment Result | `Checkout`, `PaymentResult` (page keys `checkout`, `payment-result`) |
| 3 | UC18 | View Credits & Transactions | Tutor, Parent | SC12 Credits & Transactions | `TransactionsScreen` (page key `transactions`) |
| 4 | UC37 | Manage User Accounts | Admin | SC39 User Management | `AdminList kind="users"` (page key `user-management`) |

The Figma export is a React + Tailwind prototype. Our frontend is React + plain CSS (no Tailwind):
reproduce the **visual design** (layout, spacing, colors, typography, sidebar shell) with CSS files
following `AGENTS.md`; do not copy Tailwind classes or add Tailwind. The dashboard shell (sidebar +
top bar) is in `FeatureScreens.tsx` (`NAV`/sidebar section) and `Dashboard.tsx`.

Business rules:
- **BR-06 Payment orders**: all amounts in VND; each order has a unique order code (idempotent
  processing); a pending order expires after 15 minutes.
- **BR-16 Admin audit**: every Admin action requires a reason and is written to `AdminAuditLog`:
  suspend/ban = `LOCK_USER`, reactivate = `UNLOCK_USER`, plan/pack changes = `UPDATE_PLAN`,
  other settings = `UPDATE_SETTINGS`.
- Plans per role (UC17): Tutor Free (5 credits/month, basic classroom, email reminders),
  Tutor Pro (30 credits/month, higher AI quota, SMS reminders); Parent Free / Pro configurable in UC39.
  A user can only buy a plan of their own role. Credit packs also have a `target_role`.
- Credits (UC18): 1 credit deducted from the tutor when applying, from the parent when inviting;
  spent credits are not refunded.

## 2. Decisions already made with the user (do not re-ask)

1. **Payment = TuConnector is a client of the PSP service** (`C:\otherDisk\dev\PSP`, read-only;
   never read its `.env`). PSP contract: `docs/srs.md` there — `POST /api/v1/payments`
   (`order_id, amount, currency: "VND", provider: "vnpay", description, return_url, expires_in: 900,
   metadata`) → `{ payment_id, status, checkout_url, expires_at }`; headers `X-Client-Id`,
   `X-Timestamp`, `X-Signature` = HMAC-SHA256(secret, method + path + timestamp + body),
   `Idempotency-Key` on POST; results are pushed to the client by a webhook signed with
   HMAC-SHA256 + timestamp; `GET /payments/{id}` to query status.
   - **Every place that must call the PSP API is a stub with a `// TODO(PSP): ...` comment**
     describing the exact PSP call. Keep all PSP calls in one module
     `backend/src/common/utils/pspClient.js`.
   - So UC17/UC18 can be tested without PSP: when `PSP_BASE_URL` is empty and
     `NODE_ENV !== 'production'`, `createPayment` returns a **mock checkout URL** pointing to a
     dev-only backend route that lets the tester choose "success" / "failed" and then runs the
     same internal "apply payment result" function the webhook would run. This mock must be
     impossible to use in production.
   - The old VNPay demo (`payment.controller.js` `get-payment-url`) is replaced by this module.
2. Bug fixing uses the **ponytail** skill (installed plugin: invoke the Skill `ponytail` /
   `ponytail-review`; if the Skill tool cannot find it, read
   `C:\Users\QuangAnh\.claude\plugins\cache\ponytail\ponytail\5.3.3\skills\ponytail\SKILL.md` and follow it).
   Backend work follows the `agent-skills` skills (e.g. `agent-skills:api-and-interface-design`,
   `agent-skills:incremental-implementation`, `agent-skills:security-and-hardening`).
   Frontend work uses `ui-ux-pro-max:ui-ux-pro-max`.
3. Order of work: UC39 → UC17 → UC18 → UC37, one UC at a time; a UC is done only after the tester passes it.
4. Foundation work allowed before UC39 (approved): `authorize(...roles)` middleware, a logged-in
   dashboard layout with sidebar matching Figma, a seed script for an Admin account plus default
   plans/credit packs (reuse `database/seeders/tuconnector-seed/json/PLANS.json`, `CREDIT_PACKS.json`).
5. Scope reductions (all recorded in `docs/TODO.md`, add to it if you defer anything else):
   - UC17 A1 auto-renew reminder: not implemented (needs a scheduler).
   - UC18 A1 export: CSV only (no Excel/PDF library).
   - UC18 receipt: printable HTML receipt view.
   - UC37 "revoke sessions": `authentication` middleware rejects users whose `account_status`
     is not `ACTIVE` (403) on every request.
   - UC37 "user is notified": email via existing `backend/src/common/utils/mailer.js`.
   - UC37 A1 create admin with a temporary password: implemented.
6. No DB schema changes unless unavoidable — if one is needed, STOP and report it to the
   orchestrator instead of changing the schema.
7. No new npm dependency without approval — report the need to the orchestrator.

8. When the SRS flow does not cover a case, the orchestrator decides and records it in
   `docs/requirements/decisions.md` (Vietnamese). Follow that file; if you hit a new uncovered
   case, propose a decision in your report instead of silently choosing.

## 3. Conventions (from AGENTS.md, summarised)

- Backend: Route → Middleware (`authentication` → `authorize` → `validator`) → Controller
  (`asyncHandler` + `responseCommon`) → Service (business logic only, JSDoc comment above every
  function) → Mongoose model. Basic CRUD calls models directly. Zod validator for every
  POST/PUT/PATCH. Every list GET is paginated (`page` default 1, `limit` default 10 max 100,
  response `{ items, pagination: { page, limit, total, totalPages } }`). Errors via `AppError`.
  Document every endpoint in `docs/api/<feature>.md`.
- Frontend: reuse `src/components/common` first; one CSS file per screen in `src/styles/`; all
  API calls through `src/services/<feature>Service.js`; icons from `lucide-react` (no emoji icons);
  simple explicit code; accessible forms (labels, inline errors, aria).
- UI text in English. Code comments may be Vietnamese like the existing code.
- Never commit; never touch `.env` files (edit `.env.example` instead).

## 4. Test environment

- Local MongoDB (`backend/.env` → `mongodb://localhost:27017/WDP_DB`).
- The user may already run dev servers on ports 9999 (backend) and 5173 (Vite). Each agent has its
  OWN ports (never use another agent's ports; stop only the processes you started):
  | Agent | Backend | Vite |
  |---|---|---|
  | Backend agent | 9996 (`CORS_ORIGIN=http://localhost:5176`) | — |
  | Frontend agent | 9998 (`CORS_ORIGIN=http://localhost:5174`) | 5174 |
  | Tester agent | 9997 (`CORS_ORIGIN=http://localhost:5175`) | 5175 |
  Start backend: `cd backend && PORT=<p> API_URL=http://localhost:<p>/api CORS_ORIGIN=<origin> node src/server.js`
  (`API_URL` is required: mock checkout links and verify-email links are built from it); Vite:
  `cd frontend && VITE_API_BASE_URL=http://localhost:<p>/api npx vite --port <vitePort> --strictPort`.
  Restart your backend after backend code changes (it does not auto-reload).
- Test data created by agents must use emails ending in `@example.com` and be deleted afterwards.
