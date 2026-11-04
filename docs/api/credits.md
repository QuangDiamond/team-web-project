# Credits API (`/api/credits/v1`)

## GET `/balance`
Cần đăng nhập. Trả `{ balance }`: số credit hiện tại của chính người dùng (ví chưa có hoặc role không có ví → `0`). Dùng để hiện "Cost: 1 credit · Balance: N" trước khi ứng tuyển (UC12) hoặc mời gia sư (UC14).

## Quy ước trừ credit (UC12, UC14)
- Mỗi lần ứng tuyển / gửi lời mời trừ **1 credit** bằng một phép cập nhật có điều kiện `balance >= 1`, nên hai request song song không thể làm số dư âm.
- Mỗi lần trừ ghi đúng một dòng `CREDIT_TRANSACTIONS` (`amount: -1`, `type: USED_APPLY | USED_INVITATION`, kèm id đơn / lời mời).
- Không có luồng nào hoàn credit (phụ huynh bỏ qua đơn, gia sư từ chối, rút đơn, hủy lời mời).
- Chưa làm: cấp credit hàng tháng, hết hạn credit, mua credit, lịch sử giao dịch (UC thanh toán / credit).
