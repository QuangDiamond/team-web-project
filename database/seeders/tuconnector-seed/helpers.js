// Hàm tiện ích để dữ liệu đúng kiểu BSON mà validator yêu cầu.
// - Số nguyên JS (vd 5) được driver lưu thành Int32  → dùng trực tiếp cho field Int32.
// - Field Double phải bọc dbl(), nếu không 5 sẽ thành Int32 và bị validator chặn.
// - Field tiền (Decimal128) dùng money().
const { ObjectId, Double, Decimal128 } = require('mongodb');

const money = (v) => Decimal128.fromString(String(v));
const dbl = (v) => new Double(v);
const d = (iso) => new Date(iso); // nên ghi kèm múi giờ, vd '2026-10-20T19:00:00+07:00'

// Hạn dùng cho dữ liệu có TTL index (token, session, cache AI).
// TTL index tự xóa document khi quá mốc này, nên seed để xa trong tương lai.
const FAR_FUTURE = new Date('2027-12-31T23:59:59+07:00');

module.exports = { ObjectId, money, dbl, d, FAR_FUTURE };
