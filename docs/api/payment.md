# Payment API (`/api/payment/v1`) – UC17 Upgrade Plan & Buy Credits

Response chung: `{ "success": 1 | false, "message": "...", "data": ... }`. Lỗi validate (422) có thêm `errors`.
Tiền là **số nguyên VND dạng number**.

Trừ webhook, mọi endpoint cần đăng nhập và role `TUTOR` hoặc `PARENT`
(401 chưa đăng nhập, 403 role khác).

Demo VNPay cũ `GET /get-payment-url` đã bỏ (D11), thanh toán đi qua PSP (`backend/src/common/utils/pspClient.js`).

## Luồng
1. `GET /catalog` → user chọn gói Pro (số tháng) hoặc credit pack (số lượng).
2. `POST /orders` → nhận `checkout_url`, frontend chuyển trình duyệt sang đó (`window.location.href`).
3. User thanh toán. Kết quả về backend qua webhook PSP (hoặc trang thanh toán giả khi dev).
4. Trình duyệt quay về `{CORS_ORIGIN}/payment/result?order=<order_code>`; frontend gọi `GET /orders/:orderCode`.
   Nếu vẫn `PENDING` thì gọi lại sau vài giây (webhook có thể đến sau).

## GET `/catalog`
Danh mục theo role của user (D10, không phân trang). Chỉ mục đang bật (`is_active`).
```json
{
  "role": "TUTOR",
  "plans": [
    { "_id": "...", "target_role": "TUTOR", "name": "FREE_DEFAULT", "monthly_price": 0, "monthly_credits": 5, "ai_quota": 10,
      "max_classrooms": 1, "sms_reminders_enabled": false, "is_active": true, "is_free": true },
    { "_id": "...", "target_role": "TUTOR", "name": "PRO", "monthly_price": 199000, "monthly_credits": 30, "ai_quota": 100,
      "max_classrooms": null, "sms_reminders_enabled": true, "is_active": true, "is_free": false }
  ],
  "packs": [
    { "_id": "...", "target_role": null, "name": "Gói 10 credit", "credit_amount": 10, "price": 49000, "is_active": true }
  ]
}
```
- `plans`: sắp theo giá. Gói `is_free: true` chỉ để so sánh, không mua được.
- `packs`: `target_role` = role của user hoặc `null` (dùng chung, D4). Sắp theo giá.
- `max_classrooms: null` = không giới hạn.

## GET `/me`
Gói hiện tại (UC17, UC18 dùng lại).
```json
{
  "plan": { "_id": "...", "name": "PRO", "is_free": false },
  "subscription": { "status": "ACTIVE", "start_date": "...", "expires_at": "..." },
  "credit_balance": 120,
  "ai_quota_left": 100
}
```
- Subscription còn hạn → gói của subscription; hết hạn hoặc chưa có → gói Free của role.
- `subscription`: `null` nếu chưa từng mua; `status: "EXPIRED"` nếu đã quá `expires_at`.
- `ai_quota_left` = `plan.ai_quota` − `ai_quota_used` (không âm).

## POST `/orders`
Tạo đơn `PENDING` (BR-06), hết hạn sau 15 phút. **Số tiền do server tính** từ giá hiện tại (D9), không nhận từ client.

Body (một trong hai):
```json
{ "item_type": "PLAN_UPGRADE", "plan_id": "<id>", "duration_months": 3, "payment_method": "VIETQR" }
{ "item_type": "CREDIT_PACK", "pack_id": "<id>", "quantity": 2, "payment_method": "ATM_CARD" }
```
- `duration_months`: 1–12; `quantity`: 1–10 (D9)
- `payment_method`: `VIETQR` | `ATM_CARD` | `CREDIT_CARD`

201:
```json
{ "order_code": "TC20261105DB9451", "item_type": "PLAN_UPGRADE", "amount": 597000,
  "expires_at": "2026-11-05T08:36:56.577Z", "checkout_url": "http://..." }
```

| Status | Khi nào |
|---|---|
| 201 | Tạo thành công |
| 404 | `Plan not found` / `Credit pack not found` (không tồn tại hoặc đang tắt) |
| 422 | Sai dữ liệu; `This plan is not available for your role`; `The Free plan cannot be purchased`; `This credit pack is not available for your role` |
| 503 | PSP configuration is incomplete |
| 502 | PSP request failed, timed out, or returned an invalid response. Order remains PENDING for reconciliation |

## GET `/orders/:orderCode`
Chỉ chủ đơn xem được (đơn của người khác → 404). Đơn `PENDING` quá 15 phút được lưu thành `EXPIRED`.
```json
{
  "order_code": "TC20261105DB9451", "item_type": "PLAN_UPGRADE", "status": "SUCCESS", "amount": 199000,
  "payment_method": "VIETQR", "created_at": "...", "paid_at": "...", "expires_at": "...",
  "item": { "_id": "...", "name": "PRO", "duration_months": 1, "monthly_credits": 30 },
  "buyer": { "full_name": "Nguyen Van A", "email": "a@example.com" },
  "receipt": { "receipt_url": "http://localhost:5173/receipts/TC20261105DB9451", "created_at": "..." }
}
```
- `status`: `PENDING` | `SUCCESS` | `FAILED` | `CANCELLED` | `EXPIRED`
- `item` của credit pack: `{ _id, name, quantity, credit_amount }`
- `receipt`: `null` khi chưa thanh toán thành công. `receipt_url` trỏ tới trang biên lai của frontend `/receipts/:orderCode` (D13)
- Trang biên lai (UC18) dùng chính API này: `order_code`, `buyer`, `item` (+ `duration_months` / `quantity`), `amount`,
  `payment_method`, `paid_at`. Chỉ hiển thị biên lai khi `status = "SUCCESS"`
- Đơn còn `PENDING`: backend hỏi lại PSP (`pspClient.getPayment`, signed lookup by order_id, chế độ giả trả `null`)

## POST `/orders/:orderCode/cancel`
Hủy đơn `PENDING` của chính mình (E1). Không có body.

| Status | Khi nào |
|---|---|
| 200 | `data: { order_code, status: "CANCELLED" }` |
| 404 | Không có đơn hoặc không phải chủ đơn |
| 409 | `Only pending orders can be cancelled` (đã thanh toán / thất bại / đã hủy / đã hết hạn) |

## Xử lý kết quả thanh toán (`applyPaymentResult`, dùng chung cho webhook và trang giả)
- Đơn không tồn tại hoặc không còn `PENDING` → bỏ qua, ghi log (E2, idempotent).
- Đơn quá hạn → `EXPIRED`, không cộng gì.
- `FAILED` → đơn `FAILED`, không thay đổi gì khác (E1).
- `SUCCESS` → đơn `SUCCESS` + `paid_at` + `receipt`, rồi:
  - `PLAN_UPGRADE`: đặt `user.subscription` (ACTIVE). Đang còn hạn thì **cộng dồn** `expires_at` (D8), không thì
    bắt đầu từ bây giờ. Cộng ngay `monthly_credits` của gói vào ví + `CreditTransaction` `MONTHLY_GRANT`
    (hạn 1 tháng) (D7).
  - `CREDIT_PACK`: cộng `credit_amount × quantity` vào ví + `CreditTransaction` `PURCHASE` (không hết hạn).
- Chỉ một request chuyển được `PENDING → SUCCESS` (update có điều kiện), nên kết quả gửi trùng không cộng hai lần.

## POST `/psp/webhook`
PSP gọi server-to-server nên không qua `authentication`; xác thực bằng chữ ký HMAC-SHA256 + timestamp.
Chữ ký sai hoặc timestamp quá hạn trả **401**. Webhook hợp lệ được đối chiếu lại với PSP trước khi cập nhật đơn.

## Trang thanh toán giả (chỉ khi dev, D5)
Chỉ bật khi `PSP_BASE_URL` rỗng **và** `NODE_ENV !== 'production'`; ngược lại trả 404.
Cần đăng nhập (cookie `token`, trình duyệt tự gửi vì cùng `localhost`) và phải là **chủ đơn** (D12):
chưa đăng nhập → 401, đơn của người khác → 404.
- `GET /mock-checkout/:orderCode`: trang HTML hiện mã đơn, số tiền và 2 nút "Pay successfully" / "Fail payment"
  (đơn không còn `PENDING` thì chỉ hiện trạng thái). 404 nếu không có đơn hoặc không phải chủ đơn.
- `POST /mock-checkout/:orderCode` (form `result=SUCCESS|FAILED`): chạy `applyPaymentResult` rồi redirect 303 về
  `{CORS_ORIGIN}/payment/result?order=<order_code>`. 404 nếu không có đơn / không phải chủ đơn, 422 nếu `result` sai.

---

# UC18 View Credits & Transactions

Cùng prefix `/api/payment/v1`, cần đăng nhập + role `TUTOR` | `PARENT` (401 / 403). Chỉ trả dữ liệu của chính user.
Gói hiện tại, ngày gia hạn (`subscription.expires_at`), số dư credit và AI quota còn lại: dùng `GET /me` ở trên.

**Bộ lọc ngày** `from` / `to`: dạng `YYYY-MM-DD`, tính theo **giờ Việt Nam (UTC+7)**, lấy trọn ngày (`to` bao gồm cả ngày đó),
lọc theo `created_at`. Sai định dạng / ngày không có thật / `from > to` → 422 (`errors.from` / `errors.to`).
Phân trang `page`, `limit` như mọi danh sách (giá trị sai dùng mặc định, `limit` tối đa 100).

## GET `/credit-transactions?page=1&limit=10&type=&from=&to=`
Biến động credit, mới nhất trước. `type` (tùy chọn, 1 giá trị): `MONTHLY_GRANT` | `PURCHASE` | `USED_APPLY` |
`USED_INVITATION` | `EXPIRED_GRANT` (sai → 422).
```json
{
  "items": [
    { "_id": "...", "type": "USED_APPLY", "amount": -1, "created_at": "...", "expires_at": null,
      "related": { "kind": "APPLY", "id": "...", "title": "Tìm gia sư Toán lớp 9 ôn thi vào 10" } },
    { "_id": "...", "type": "MONTHLY_GRANT", "amount": 30, "created_at": "...", "expires_at": "...", "related": null }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 2, "totalPages": 1 }
}
```
- `amount` có dấu: `+` với `MONTHLY_GRANT`, `PURCHASE`; `−` với `USED_APPLY`, `USED_INVITATION`, `EXPIRED_GRANT`
  (dữ liệu lưu sai dấu được chuẩn hóa).
- `related`: `APPLY` (lượt ứng tuyển) hoặc `INVITATION` (lời mời), `title` = tiêu đề yêu cầu tìm gia sư; `null` nếu
  không tìm được. `related = null` khi giao dịch không gắn với lượt nào.
- Không có dữ liệu → `items: []`, `total: 0` (E1: frontend hiện empty state + link sang UC17).

## GET `/orders?page=1&limit=10&status=&from=&to=`
Lịch sử thanh toán (mọi trạng thái), mới nhất trước. `status` (tùy chọn): `PENDING` | `SUCCESS` | `FAILED` |
`CANCELLED` | `EXPIRED`. Đơn `PENDING` quá 15 phút được lưu thành `EXPIRED` trước khi lọc.
```json
{
  "items": [
    { "order_code": "TC20261105DB9451", "item_type": "CREDIT_PACK", "item_name": "Gói 30 credit", "status": "SUCCESS",
      "amount": 129000, "payment_method": "VIETQR", "created_at": "...", "paid_at": "...", "has_receipt": true }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```
- `has_receipt`: `true` khi `status = "SUCCESS"` và đã có biên lai → mở `/receipts/:orderCode` (dữ liệu từ `GET /orders/:orderCode`).

## Xuất CSV (A1, D14)
- `GET /credit-transactions/export?type=&from=&to=` → file `credit-transactions-YYYYMMDD.csv`
  Cột: `Date, Type, Credits, Expires at, Related to, Request title`
- `GET /orders/export?status=&from=&to=` → file `payment-history-YYYYMMDD.csv`
  Cột: `Order code, Created at, Item type, Item, Status, Amount (VND), Payment method, Paid at`

Chung:
- Cùng bộ lọc và rule validate như API danh sách (422 trả JSON), không phân trang, tối đa **5000 dòng** mới nhất.
- `Content-Type: text/csv; charset=utf-8`, có BOM UTF-8 (Excel hiện đúng tiếng Việt), xuống dòng CRLF,
  `Content-Disposition: attachment; filename="..."`.
- Ngày giờ dạng `dd/MM/yyyy HH:mm` theo giờ Việt Nam (UTC+7) (D16). Ô có `,` `"` hoặc xuống dòng được bọc `"..."` (`"` → `""`). Ô chữ bắt đầu bằng
  `=` `+` `-` `@` (tab, CR) được thêm `'` phía trước để chống CSV formula injection (số âm như `-1` không bị đổi).
- Loại / trạng thái / phương thức / tên gói dùng nhãn tiếng Anh giống giao diện (D17), vd `Used for application`,
  `Paid`, `VietQR`, `Pro plan`, `Credit pack`. Tên file theo ngày Việt Nam.
- Frontend tải bằng link thường `<a href="{API}/payment/v1/orders/export?..." download>`: cookie `token` vẫn được
  gửi vì frontend và API cùng site (`localhost` / cùng domain gốc). Lưu ý: khi hết phiên hoặc lọc sai, API trả
  **JSON lỗi (401 / 403 / 422)** thay vì CSV, trình duyệt sẽ tải/hiện nội dung JSON đó; frontend nên validate bộ lọc
  trước khi tạo link.

## PSP integration (2026-11-07)

Configure PSP_BASE_URL, PSP_CLIENT_ID and PSP_CLIENT_SECRET in the backend environment.
PSP_BASE_URL accepts an origin or a URL ending in /api/v1. Requests sign METHOD + path with query + Unix
seconds + raw body using HMAC-SHA256. POST requests use the local order code as the idempotency key.
Payment lookup uses GET /api/v1/payments?order_id= because the schema does not store payment_id.
Cancellation calls PSP before changing the local order. Network errors during creation keep the local order
pending for reconciliation.

Register a public HTTPS webhook URL ending in /api/payment/v1/psp/webhook at PSP. The receiver checks
X-PGS-Timestamp (five-minute tolerance), X-PGS-Event-Id, and X-PGS-Signature over timestamp + "." + raw JSON.
The event contains event_id, type and payment. Signed payment events are reconciled against PSP by order id,
amount and VND currency before applying benefits. Unrelated events return 200. Unconfirmed events return
502 so PSP can retry. Duplicate completed orders retain their existing result.

The existing mock checkout is active only when PSP_BASE_URL is empty outside production.
The gateway contract currently selects payment methods on the VNPay page.

## Required payer IP (2026-11-07)

The order controller passes Express req.ip through createOrder to pspClient.createPayment.
The backend validates it as IPv4 or IPv6 before creating the local order and sends payer_ip in the signed
POST /api/v1/payments body. Missing or invalid IP returns HTTP 400. The browser order body stays the same.
The IP is captured when the payment is created. PSP stores that IP and reuses it for confirmation.

Express currently uses its direct socket peer because trust proxy is disabled by default. For deployment
behind a reverse proxy, configure trust proxy with the actual trusted proxy addresses or hops before using
this flow. Raw X-Forwarded-For and callback query parameters are not read as payer IP sources.
On localhost, req.ip can be ::1 or an IPv4-mapped loopback address. Use a new transaction from the intended
client network when comparing provider results. Existing PSP transaction IP values remain historical.

Static review checked the controller-to-service-to-adapter flow and signing of the serialized body containing
payer_ip. Runtime tests, lint, typecheck and build were skipped at the user's request for this change.
