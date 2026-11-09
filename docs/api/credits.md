# Credits API (`/api/credits/v1`)

## GET `/balance`
Cần đăng nhập. Trả `{ balance }`: số credit hiện tại của chính người dùng (ví chưa có hoặc role không có ví → `0`). Dùng để hiện "Cost: 1 credit · Balance: N" trước khi ứng tuyển (UC12) hoặc mời gia sư (UC14).

## Quy ước trừ credit (UC12, UC14)
- Mỗi lần ứng tuyển / gửi lời mời trừ **`credits` credit** (người dùng chọn 1 đến 10, mặc định 1) bằng một phép cập nhật có điều kiện `balance >= credits`, nên hai request song song không thể làm số dư âm. Dùng nhiều credit hơn thì được xếp lên đầu danh sách phía nhận (xem applications.md, invitations.md). Giới hạn nằm ở `backend/src/common/constants/credits.js`.
- Mỗi lần trừ ghi đúng một dòng `CREDIT_TRANSACTIONS` (`amount: -credits`, `type: USED_APPLY | USED_INVITATION`, kèm id đơn / lời mời).
- Không có luồng nào hoàn credit (phụ huynh bỏ qua đơn, gia sư từ chối, rút đơn, hủy lời mời).
- Chưa làm: cấp credit hàng tháng, hết hạn credit, mua credit, lịch sử giao dịch (UC thanh toán / credit).
