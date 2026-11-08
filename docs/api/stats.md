# System Statistics API (`/api/stats/v1`) – UC40 View System Statistics

## GET `/public`
API công khai (không cần đăng nhập) phục vụ trang chủ (`Home.jsx`): trả về danh sách gia sư tiêu biểu (`featuredTutors`), đánh giá đã duyệt (`testimonials`) và số liệu tổng quan (`platformStats`).

## GET `/`
Chỉ dành cho role `ADMIN` (`authentication` + `assertRole`).
Query: `period` (`7d` | `30d` | `90d` | `1y`).
Trả về `{ period, kpis, trends, roleDistribution }` tổng hợp trực tiếp từ các collection `USERS`, `TUTOR_PROFILES`, `PARENT_REQUESTS`, `TUTORING_AGREEMENTS`, `PAYMENT_ORDERS`, `CLASSROOMS`, `AI_SUGGESTIONS`.

## GET `/export`
Chỉ dành cho role `ADMIN`. Xuất dữ liệu báo cáo thống kê định dạng JSON theo kỳ `period`.

