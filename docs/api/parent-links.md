# Parent Links API (`/api/parent-links/v1`) – liên kết phụ huynh – học sinh

Phụ huynh và học sinh liên kết tài khoản bằng **lời mời xác nhận**, độc lập với lớp học. Sau khi học sinh chấp nhận, phụ huynh theo dõi được mọi lớp học sinh tham gia (UC35, xem [child-progress.md](child-progress.md)) mà không cần tham gia lớp.

Dùng collection có sẵn `PARENT_CHILD_LINKS` (model `ParentChildLink`, trạng thái `PENDING` / `ACCEPTED` / `DECLINED`, unique `{ parent_user_id, student_user_id }`). Không thêm schema mới.

| Status | Khi nào |
|---|---|
| 200 / 201 | Thành công |
| 401 | Chưa đăng nhập |
| 403 | Sai role (xem từng API) |
| 404 | `linkId` sai định dạng, không tồn tại, hoặc không thuộc người đang gọi |
| 409 | Trạng thái liên kết không cho phép thao tác (xem từng API) |
| 422 | Body / query không hợp lệ (có field thừa cũng 422) |

## POST `/` – phụ huynh mời học sinh (role `PARENT`)
```json
{ "student_email": "hocsinh@example.com" }
```
Email được cắt khoảng trắng và đổi chữ thường. **Luôn trả 201 `data: null` cùng một thông báo**, dù email có phải học sinh hay không, để không dò được tài khoản. Chỉ tạo lời mời khi email thuộc tài khoản `STUDENT` đang `ACTIVE`; học sinh nhận một thông báo trong ứng dụng.

409 khi:
- đã liên kết (`ACCEPTED`) với học sinh này;
- đã có lời mời `PENDING` tới học sinh này;
- học sinh đã từ chối (`DECLINED`) trong vòng **7 ngày** (sau 7 ngày lời mời được mở lại trên chính bản ghi cũ, không tạo bản ghi mới);
- phụ huynh đang có **20** lời mời `PENDING`.

## GET `/` – danh sách liên kết của chính mình (role `PARENT`, `STUDENT`)
Query: `status` (`PENDING|ACCEPTED|DECLINED`, tùy chọn), `page` (mặc định 1), `limit` (mặc định 10, tối đa 100). Mới nhất trước.
```json
{
  "items": [
    {
      "_id": "...", "status": "PENDING",
      "created_at": "2026-11-13T00:00:00.000Z", "updated_at": "2026-11-13T00:00:00.000Z",
      "student": { "_id": "...", "full_name": "Đỗ Gia Bình", "email": "binh@example.com", "avatar_url": null }
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```
Phụ huynh nhận field `student`, học sinh nhận field `parent` (cùng dạng). Chỉ có `_id`, `full_name`, `email`, `avatar_url`; không có dữ liệu nhạy cảm.

## POST `/:linkId/respond` – học sinh trả lời (role `STUDENT`)
```json
{ "action": "ACCEPT" }
```
`action` là `ACCEPT` hoặc `DECLINE`. Chỉ lời mời của chính học sinh và còn `PENDING`, trả liên kết sau khi cập nhật (kèm `parent`). Phụ huynh nhận thông báo về kết quả. 409 nếu lời mời không còn `PENDING` (kể cả hai lần trả lời đồng thời: chỉ một lần thắng).

## DELETE `/:linkId` – hủy lời mời / hủy liên kết (role `PARENT`, `STUDENT`)
Trả `{ "_id": "..." }`.
- Phụ huynh: hủy lời mời `PENDING` hoặc hủy liên kết `ACCEPTED`.
- Học sinh: chỉ hủy liên kết `ACCEPTED` (lời mời đang chờ thì dùng `respond`).
- Liên kết `DECLINED` không xóa được (409) để giữ thời gian chờ 7 ngày.

Sau khi hủy liên kết, phụ huynh mất quyền xem ngay: các API `child-progress` trả 404 và học sinh biến khỏi danh sách `GET /api/parent-requests/v1/children`.

## Giao diện
- Phụ huynh: `/parent/children` – khung mời khi chưa có con; nút "Liên kết học sinh" (hộp thoại) khi đã có con.
- Học sinh: `/student/parent-links` – lời mời đang chờ (Chấp nhận / Từ chối) và phụ huynh đã liên kết (Hủy liên kết).

## Lưu ý
Luồng cũ trong `classroom.service.js` (phụ huynh chọn con khi tham gia lớp, `/api/classroom/v1/parent-links/*`) vẫn tạo liên kết `PENDING` và có API trả lời riêng; chưa có giao diện dùng API đó. Hai luồng cùng ghi vào `PARENT_CHILD_LINKS` nên kết quả luôn thống nhất.
