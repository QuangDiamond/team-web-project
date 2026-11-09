# Admin – Plans & Pricing API (`/api/admin/v1`) – UC39

Response chung: `{ "success": 1 | false, "message": "...", "data": ... }`.
Lỗi validate (422) có thêm `errors`: `{ "<field>": ["message", ...] }`.

Mọi endpoint: cần đăng nhập (cookie `token` hoặc `Authorization: Bearer <token>`) và role `ADMIN`.

| Status | Khi nào (chung cho mọi endpoint) |
|---|---|
| 401 | `Unauthorize` / token sai hoặc hết hạn |
| 403 | `Forbidden`: user không phải ADMIN |
| 404 | `Plan not found` / `Credit pack not found`: id không phải ObjectId hợp lệ hoặc không tồn tại |
| 422 | Dữ liệu không hợp lệ (E1). Validate body chạy trước khi tìm theo id |

Tiền là **số nguyên VND dạng number** (trong DB lưu Decimal128).

**BR-16 Audit:** mỗi thao tác ghi (PUT/POST/PATCH) thành công ghi 1 document `ADMIN_AUDIT_LOGS`:
`action: "UPDATE_PLAN"`, `admin_user_id`, `reason` (đã trim), `ip_address` (`req.ip`) và
`details_json: { entity: "PLAN" | "CREDIT_PACK", operation: "UPDATE" | "CREATE" | "ENABLE" | "DISABLE", target_id, before, after }`
(`before` = `null` khi tạo mới). Request lỗi không ghi log.

## Phân trang (GET danh sách)
Query `page` (mặc định 1), `limit` (mặc định 10, tối đa 100). Giá trị không hợp lệ thì dùng mặc định
(`limit > 100` bị đưa về 100).

```json
{ "success": 1, "message": "...", "data": { "items": [], "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 } } }
```

## Plan object
```json
{
  "_id": "57d94341621103294eababa8",
  "target_role": "TUTOR",
  "name": "PRO",
  "monthly_price": 199000,
  "billing_period": "YEARLY",
  "annual_discount_percent": 15,
  "monthly_credits": 30,
  "ai_quota": 100,
  "max_classrooms": null,
  "sms_reminders_enabled": true,
  "is_active": true
}
```
- `target_role`: `TUTOR` | `PARENT`
- `billing_period`: `MONTHLY` | `YEARLY`; dữ liệu cũ mặc định `MONTHLY`
- `annual_discount_percent`: số nguyên 0–99; chỉ áp dụng khi `billing_period: "YEARLY"`; 0 nghĩa là không giảm
- Giá checkout theo năm là `round(monthly_price × 12 × (100 - annual_discount_percent) / 100)`; theo tháng là `monthly_price`
- `name`: chuỗi 1–100 ký tự; `FREE_DEFAULT` là tên dành riêng cho gói Free, `PRO` là tên Pro hiện có.
- `max_classrooms`: `null` = không giới hạn
- `sms_reminders_enabled`: có thể `null` với dữ liệu cũ (gói PARENT), coi như `false`

## Credit pack object
```json
{ "_id": "...", "target_role": "TUTOR", "name": "Gói 30 credit", "credit_amount": 30, "price": 129000, "is_active": true }
```
- `target_role`: `TUTOR` | `PARENT` | `null` (`null` = bán cho cả gia sư và phụ huynh, chỉ có ở dữ liệu seed cũ; API tạo mới bắt buộc chọn role)
- `is_active: false` = đã tắt, ẩn với user (A1)

## GET `/plans?page=1&limit=10`
Danh sách gói, sắp theo `target_role` rồi `monthly_price`. `data: { items: Plan[], pagination }`.

## POST `/plans`

Create a subscription plan (ADMIN only). Send all PUT fields below plus `name` (trimmed,
1–100 characters) and `target_role` (`TUTOR` or `PARENT`). `is_active` is optional and
defaults to `true`; send `false` to create an unavailable plan. Returns 201 with the
created Plan. A `FREE_DEFAULT` plan must have price 0. The admin reason is required;
the audit operation is `CREATE`, with `before: null` and the created plan as `after`.

Schema update: Mongoose `Plan` now stores `billing_period` and `annual_discount_percent`.
Both fields default to `MONTHLY` and `0`, so existing documents keep their monthly behavior
without a database migration.

## PUT `/plans/:id`
Sửa gói (UC39 bước 2–4). Phải gửi đủ các field.

Body:
```json
{
  "monthly_price": 199000,
  "billing_period": "YEARLY",
  "annual_discount_percent": 15,
  "monthly_credits": 30,
  "ai_quota": 100,
  "max_classrooms": null,
  "sms_reminders_enabled": true,
  "reason": "Adjust Pro price for Q4"
}
```
- `monthly_price`: số nguyên ≥ 0, tối đa 1,000,000,000. **Gói `FREE_DEFAULT` phải giữ giá 0** (422 `Free plan price must be 0`, `errors.monthly_price`)
- `billing_period`: optional `MONTHLY` | `YEARLY`; bỏ qua thì giữ chu kỳ hiện tại
- `annual_discount_percent`: optional số nguyên 0–99; chỉ gói năm được áp dụng; bỏ qua thì giữ giá trị hiện tại
- `FREE_DEFAULT` chỉ dùng chu kỳ tháng và không có chiết khấu
- `monthly_credits`: số nguyên ≥ 1 (tối đa 1,000,000), áp dụng cho mọi gói kể cả Free (quyết định D1)
- `ai_quota`: số nguyên ≥ 0 (tối đa 1,000,000)
- `max_classrooms`: số nguyên 1–1000 **hoặc `null` (không giới hạn)**
- `sms_reminders_enabled`: boolean
- `reason`: chuỗi, trim, 1–500 ký tự
- `is_active`: optional boolean; `false` hides the plan from the user catalog and blocks
  new checkout orders, `true` makes it available again. Omit to preserve the current
  value for older callers. Existing subscriptions and orders are not modified.
- `target_role` không sửa qua API này. `name` là tùy chọn, trim 1–100 ký tự; gói `FREE_DEFAULT` giữ nguyên tên để bảo toàn quy tắc gói miễn phí.

| Status | Khi nào |
|---|---|
| 200 | Thành công, `data` là Plan sau khi sửa |
| 404 | Không tìm thấy gói |
| 422 | Sai dữ liệu / gói Free có giá khác 0 |

## GET `/credit-packs?page=1&limit=10`
Danh sách gói credit (cả gói đang tắt), sắp theo `target_role` rồi `price`. `data: { items: CreditPack[], pagination }`.

## POST `/credit-packs`
Thêm gói credit (A1). Gói mới luôn `is_active: true`.

Body:
```json
{ "target_role": "PARENT", "name": "Gói 20 credit", "credit_amount": 20, "price": 89000, "reason": "New pack for parents" }
```
- `target_role`: `TUTOR` | `PARENT`
- `name`: trim, 1–100 ký tự
- `credit_amount`: số nguyên ≥ 1 (E1: 0 credit không hợp lệ), tối đa 1,000,000
- `price`: số nguyên > 0, tối đa 1,000,000,000
- `reason`: trim, 1–500 ký tự

| Status | Khi nào |
|---|---|
| 201 | Tạo thành công, `data` là CreditPack |
| 422 | Sai dữ liệu |

## PUT `/credit-packs/:id`
Sửa gói credit. Không đổi `target_role` / `is_active` ở đây.

Body: `{ "name": "...", "credit_amount": 25, "price": 99000, "reason": "..." }` (rule giống POST).

| Status | Khi nào |
|---|---|
| 200 | Thành công, `data` là CreditPack sau khi sửa |
| 404 | Không tìm thấy gói |
| 422 | Sai dữ liệu |

## PATCH `/credit-packs/:id/status`
Bật / tắt mở bán gói credit (A1). Gói tắt bị ẩn với user ở UC17.

Body: `{ "is_active": false, "reason": "Stop selling this pack" }` (`is_active` phải là boolean thật).

| Status | Khi nào |
|---|---|
| 200 | Thành công, `data` là CreditPack sau khi đổi |
| 404 | Không tìm thấy gói |
| 422 | Sai dữ liệu |
