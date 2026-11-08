# Subjects API (`/api/subjects/v1`)

Danh mục môn học cho ô chọn môn trong form tạo yêu cầu (phụ huynh) và form bài đăng (gia sư). Dữ liệu nằm ở collection `SUBJECTS`.

## GET `/`
Cần đăng nhập (mọi role). Chỉ trả môn có `is_active = true`, sắp xếp theo `sort_order` rồi `name`.

Query: `page` (mặc định 1), `limit` (mặc định 10, tối đa 100). Ô chọn môn gọi với `limit=100`.

```json
{
  "success": 1,
  "message": "Get subjects successfully!",
  "data": {
    "items": [{ "_id": "...", "name": "Toán", "sort_order": 1, "is_active": true }],
    "pagination": { "page": 1, "limit": 100, "total": 27, "totalPages": 1 }
  }
}
```

## Nạp dữ liệu môn học
```
cd database/seeders/tuconnector-seed
# 1. (một lần) tạo collection SUBJECTS + validator + index: chạy lại init_tuconnector.js bằng mongosh, an toàn với DB đã có dữ liệu
mongosh "<connection string>" --file init_tuconnector.js
# 2. nạp danh sách môn
node --env-file=../../../backend/.env seed.js --only=SUBJECTS
```
Seed dùng upsert theo `_id` nên chạy lại nhiều lần không trùng và không xóa dữ liệu khác. Thêm / ẩn môn: sửa `collections/SUBJECTS.js` rồi chạy lại, hoặc đặt `is_active: false`.

## Lưu ý
- `subject_name` của request / post vẫn là chuỗi tự do (không đổi schema); form chỉ cho chọn từ danh mục. Dữ liệu cũ có môn ngoài danh mục (vd "Python") vẫn hiển thị và sửa được bình thường.
