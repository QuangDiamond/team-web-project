# Project-level scripts

## `npm run smoke` – quét lỗi khi mở trang

`smoke-routes.mjs` đăng nhập từng vai trò (khách, học sinh, phụ huynh, gia sư, admin), mở dashboard rồi lần theo
các link nội bộ và báo trang nào bị lỗi lúc chạy: crash khi render (màn lỗi của router), lỗi JS chưa bắt hoặc
`console.error`. Script chỉ mở trang, không bấm nút, nên không tạo/xóa dữ liệu. Lỗi gọi API (4xx/5xx) không tính.

Cần backend và frontend đang chạy (`npm run dev`) và Chrome đã cài trên máy. Trả mã thoát 1 nếu có trang lỗi.

```sh
npm run smoke
```

| Biến môi trường | Mặc định |
|---|---|
| `SMOKE_BASE_URL` | `http://localhost:5173` |
| `SMOKE_API_URL` | `http://localhost:9999/api` |
| `SMOKE_<ROLE>_EMAIL`, `SMOKE_<ROLE>_PASSWORD` (`ROLE` = `STUDENT`, `PARENT`, `TUTOR`, `ADMIN`) | Tài khoản dữ liệu mẫu: `demo.parent01@example.com`, `demo.tutor01@example.com` (`docs/marketplace-seed.md`), `admin@example.com` (`npm run seed:admin`). Học sinh không có mặc định |
| `SMOKE_MAX_PAGES` | `80` trang mỗi vai trò |
| `SMOKE_BROWSER_CHANNEL` | `chrome` |

Vai trò thiếu tài khoản hoặc đăng nhập thất bại thì bị bỏ qua (có in lý do). Trang chi tiết khác id
(`/tutor/classes/<id>`) chỉ mở một lần cho mỗi dạng đường dẫn.
