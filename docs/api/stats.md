# Admin statistics

- `GET /api/stats/v1?period=30d` returns the existing `{ success, message, data }` envelope.
- `GET /api/stats/v1/export?period=30d` returns `{ exportedAt, filename, summaryText, data }` inside the envelope. The frontend downloads `data` as JSON.
- Both endpoints require authentication and ADMIN authorization. `period` accepts `7d`, `30d`, `90d`, `1y` (365 days); default `30d`. Invalid queries return 422.
- `data.kpis` contains cumulative database counts and successful payment totals. `aiQuotaUtilized` is the sum of current subscription AI quota usage, not a lifetime usage estimate.
- `data.trends` covers the complete rolling period up to the request timestamp, without overlapping buckets or synthetic fallback values. Labels use Vietnam time. Revenue uses successful orders with `paid_at`; old successful orders lacking this timestamp remain in cumulative totals but cannot be assigned to a chart bucket. User growth and new agreements use their stored creation timestamps.
- `data.roleDistribution` includes all account statuses and all four roles. Existing Vietnamese role labels are retained.
- No schema, stored payment data or public homepage contract is changed.

## Frontend organization

The admin screens reuse PageHeader, StatCard, SectionCard, Alert, EmptyState and Modal. Their CSS stays in `frontend/src/styles/{AdminDashboard,Moderation,Notifications}.css`; feature components and data hooks are split into their existing frontend layers. Icons use lucide-react. No new dependency is introduced. Notification settings correspond directly to the existing six backend preference flags.
