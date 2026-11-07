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
  "monthly_credits": 30,
  "ai_quota": 100,
  "max_classrooms": null,
  "sms_reminders_enabled": true,
  "is_active": true
}
```
- `target_role`: `TUTOR` | `PARENT`
- `name`: `FREE_DEFAULT` (gói Free) | `PRO`
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

## PUT `/plans/:id`
Sửa gói (UC39 bước 2–4). Phải gửi đủ các field.

Body:
```json
{
  "monthly_price": 199000,
  "monthly_credits": 30,
  "ai_quota": 100,
  "max_classrooms": null,
  "sms_reminders_enabled": true,
  "reason": "Adjust Pro price for Q4"
}
```
- `monthly_price`: số nguyên ≥ 0, tối đa 1,000,000,000. **Gói `FREE_DEFAULT` phải giữ giá 0** (422 `Free plan price must be 0`, `errors.monthly_price`)
- `monthly_credits`: số nguyên ≥ 1 (tối đa 1,000,000), áp dụng cho mọi gói kể cả Free (quyết định D1)
- `ai_quota`: số nguyên ≥ 0 (tối đa 1,000,000)
- `max_classrooms`: số nguyên 1–1000 **hoặc `null` (không giới hạn)**
- `sms_reminders_enabled`: boolean
- `reason`: chuỗi, trim, 1–500 ký tự
- `target_role`, `name`, `is_active` không sửa qua API này (field lạ bị bỏ qua)

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
