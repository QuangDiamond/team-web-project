# TuConnector – dữ liệu mẫu (seed)

Mỗi collection một file trong `collections/` (vd `collections/User.js`), export ra một mảng document.
`ids.js` giữ `_id` cố định cho mọi document để các file tham chiếu chéo nhau đúng.

## Cài
```
npm install
```

## Các lệnh
| Lệnh | Việc |
|---|---|
| `npm run validate` | Kiểm tra seed với validator trong `init_tuconnector.js` (không cần kết nối DB) |
| `MONGODB_URI="..." npm run seed` | Nạp dữ liệu (upsert theo `_id`, chạy lại nhiều lần không lỗi) |
| `MONGODB_URI="..." npm run seed:drop` | Xóa dữ liệu cũ các collection rồi nạp lại |
| `MONGODB_URI="..." node seed.js --only=User,PLANS` | Chỉ nạp vài collection |
| `npm run export-json` | Xuất `json/<Tên>.json` để import tay bằng Compass |

Windows PowerShell: `$env:MONGODB_URI="..."; npm run seed`

Dùng luôn URI trong `backend/.env` (không phải dán mật khẩu ra terminal): `node --env-file=../../../backend/.env seed.js`

## Tên database
`init_tuconnector.js` và `seed.js` ghi vào DB ghi trong URI (vd `.../WDP_DB` → `WDP_DB`), khớp với backend.
URI không ghi tên DB (vd `mongodb://localhost:27017`) thì dùng `tuconnector`. `seed.js` có thể ép tên bằng biến `DB_NAME`.

## Thứ tự lần đầu
1. `mongosh "<connection string>" --file init_tuconnector.js` (tạo collection + validator + index)
2. `npm run validate`
3. `npm run seed`

## Import tay bằng Compass
Chọn collection → **Add Data → Import JSON or CSV file** → chọn `json/<Tên collection>.json`.

## Lưu ý khi sửa / thêm dữ liệu
- Field **Double** (average_rating, match_score, score, provisional_score, final_score) phải bọc `dbl()`, vd `dbl(5)`. Viết `5` sẽ thành Int32 và bị validator chặn.
- Field tiền (price, budget, amount, agreed_price, monthly_price) dùng `money()`.
- Ngày dùng `d('2026-10-20T19:00:00+07:00')`.
- Thêm document mới: thêm tên vào `NAMES` trong `ids.js`, rồi dùng `ids.<tên>`.
- Token, session, cache AI có TTL index nên hạn để `FAR_FUTURE`, nếu không MongoDB sẽ tự xóa.
- Số dư `User.credit_wallet.balance` phải bằng tổng `amount` trong `CREDIT_TRANSACTIONS` của user đó.
- Mật khẩu mẫu: `Tuconnector@123`. `password_hash` trong seed là giá trị giả, đăng nhập thật cần hash bcrypt thật.
