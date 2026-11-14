# Moderation API (`/api/moderation/v1`) – UC38 Moderate Content & Reports

Chỉ dành cho role `ADMIN` (kiểm tra bằng `authentication` và `assertRole(req.user, 'ADMIN')`).

## GET `/`
Query: `status`, `severity`, `target_type`.
Trả về `{ summary: { total, pendingCount, criticalCount, resolvedCount }, reports }` kèm `target_preview` của nội dung bị báo cáo.

## GET `/audit-logs`
Trả về nhật ký kiểm duyệt trong `ADMIN_AUDIT_LOGS` (mới nhất trước).

## GET `/:reportId`
Chi tiết một báo cáo vi phạm.

## POST `/:reportId/resolve`
Body: `{ "action": "NONE" | "WARNING_SENT" | "CONTENT_HIDDEN" | "CONTENT_REMOVED" | "USER_BANNED", "admin_note": "Lý do bắt buộc (BR-20)", "ban_user_id": "<ObjectId tùy chọn>" }`.
- Cập nhật trạng thái báo cáo (`RESOLVED` hoặc `DISMISSED`).
- Thực thi hành động lên nội dung (`TutorPost`, `Review`) hoặc khóa tài khoản (`User.account_status = 'BANNED'`).
- Ghi bản ghi truy vết vào `ADMIN_AUDIT_LOGS` theo quy tắc BR-20.

