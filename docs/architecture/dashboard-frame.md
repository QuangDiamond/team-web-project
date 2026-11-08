# Dashboard Frame dùng chung (Student / Tutor / Parent / Admin)

Khung dashboard theo Figma (`StudentDashboard.tsx`, `TutorDashboard.tsx`): Sidebar (logo, thẻ user, menu theo role, Log Out) + Header (nút mở menu trên mobile, tiêu đề trang, nút hành động) + Main Content. Bản đầu tiên dùng cho UC36 – Student Dashboard.

## Thành phần

| File | Vai trò |
|---|---|
| `frontend/src/layouts/DashboardLayout.jsx` | Khung chính, nhận prop `menu`, render `<Outlet />` vào Main Content |
| `frontend/src/components/layout/DashboardSidebar.jsx` | Sidebar: logo, avatar + tên (`useAuth().user`), nhóm menu, Log Out |
| `frontend/src/components/layout/DashboardHeader.jsx` | Header: nút hamburger (< 1024px), tiêu đề, nút chuông (chưa có UC thông báo), `headerActions` |
| `frontend/src/routes/RoleRoute.jsx` | Guard theo role: chưa đăng nhập → `/login`, sai role → `/` |
| `frontend/src/constants/dashboardMenus.js` | Cấu hình menu, **mỗi role một export** (`STUDENT_MENU`, …) |
| `frontend/src/components/common/SectionCard.jsx` | Card có tiêu đề + vùng `action` bên phải |
| `frontend/src/components/common/StatCard.jsx` | Ô số liệu, `tone`: `primary` \| `info` \| `warning` \| `success` |
| `frontend/src/components/common/EmptyState.jsx` | Trạng thái rỗng (icon lucide, tiêu đề, mô tả) |
| `frontend/src/styles/index.css` | Style dùng chung: các section `DashboardLayout`, `Card dùng chung trong dashboard`, `.status-badge`, `.btn-sm` |

Frame **không chứa nội dung riêng của role nào**. Nội dung từng dashboard đặt ở `pages/<role>/`, `components/<role>Dashboard/`, `styles/<role>Dashboard.css`.

## Responsive

- ≥ 1024px: sidebar cố định 240px bên trái.
- < 1024px: sidebar ẩn, bấm nút ☰ để mở (trượt từ trái + lớp phủ). Đóng bằng: bấm lớp phủ, bấm một mục menu, hoặc phím `Esc`.
- ≤ 640px: giảm padding, ẩn `headerActions` (chỉ còn chuông).

## Cấu hình menu

```js
// frontend/src/constants/dashboardMenus.js
import { LayoutDashboard, Inbox, BookOpen } from 'lucide-react';

export const TUTOR_MENU = {
  roleLabel: 'Tutor',                       // badge dưới tên user
  groups: [
    {
      label: 'MAIN MENU',
      items: [
        { label: 'Overview', to: '/tutor/dashboard', icon: LayoutDashboard, end: true },
        { label: 'Hire Requests', to: '/tutor/hire-requests', icon: Inbox },
        { label: 'Classroom', icon: BookOpen },   // không có `to` → hiện mờ, "Coming soon"
      ],
    },
  ],
  headerActions: [{ label: 'Public Site', to: '/' }],                 // tùy chọn
  footerAction: { label: 'Browse Jobs & Posts →', to: '/jobs' },      // tùy chọn
};
```

| Field | Bắt buộc | Ghi chú |
|---|---|---|
| `roleLabel` | ✔ | Chữ trong badge role |
| `groups[].label` | ✔ | Tiêu đề nhóm (viết hoa như Figma) |
| `groups[].items[].label` | ✔ | Tên mục, cũng là `key` nên không trùng trong 1 nhóm |
| `groups[].items[].icon` | | Component icon của `lucide-react` |
| `groups[].items[].to` | | Đường dẫn. Bỏ trống = mục chưa có màn hình (disabled) |
| `groups[].items[].end` | | `true` để chỉ active khi URL khớp chính xác (dùng cho trang Overview) |
| `headerActions[]` | | `{ label, to }`, nút viền bên phải header |
| `footerAction` | | `{ label, to }`, nút viền đứt ở cuối sidebar |

Không khai báo **Log Out**: frame tự thêm và gọi `useAuth().logout()` rồi chuyển về `/login`.

## Thêm dashboard cho role mới (ví dụ Tutor)

1. Thêm `TUTOR_MENU` vào `constants/dashboardMenus.js` (chỉ sửa export của role mình).
2. Tạo page `pages/tutor/TutorDashboard.jsx`, component trong `components/tutorDashboard/`, CSS trong `styles/tutorDashboard.css`. Gọi API qua `services/tutorDashboardService.js` dùng `api` từ `services/api.js`.
3. Thêm route vào `frontend/src/routes/routes.jsx`:

```jsx
import { TUTOR_MENU } from '../constants/dashboardMenus';
import TutorDashboard from '../pages/tutor/TutorDashboard';

{
  element: <RoleRoute roles={['TUTOR']} />,
  children: [
    {
      path: 'tutor',
      element: <DashboardLayout menu={TUTOR_MENU} />,
      children: [
        // handle.title là tiêu đề hiển thị trên header
        { path: 'dashboard', element: <TutorDashboard />, handle: { title: 'Overview' } },
        { path: 'hire-requests', element: <HireRequests />, handle: { title: 'Hire Requests' } },
      ],
    },
  ],
},
```

4. Trong page, dùng các component chung:

```jsx
import SectionCard from '../../components/common/SectionCard';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';

<StatCard label="Active students" value={total} detail="This month" tone="info" />
<SectionCard title="Pending Requests" action={<span>2 new</span>}>
  {items.length === 0 && <EmptyState icon={Inbox} title="No requests yet" />}
</SectionCard>
```

## Lưu ý

- `RoleRoute` chỉ để điều hướng giao diện; **backend vẫn phải kiểm tra role** (hiện middleware `authorize` chưa có, xem AGENTS.md).
- Không dùng dữ liệu giả trên dashboard: chưa có API thì hiển thị `EmptyState` hoặc để mục menu disabled.
- Màu dùng token trong `:root` của `index.css` (`--color-primary-strong` cho chữ / nút để đạt contrast).

## Hiện có

| Role | URL | Menu | Page |
|---|---|---|---|
| STUDENT | `/student/dashboard` | `STUDENT_MENU` | `pages/student/StudentDashboard.jsx` (UC36) |
| PARENT | `/parent/dashboard`, `/parent/applications` và `/parent/ai-suggestions` (trang chọn request `RequestPicker`, dẫn tới trang của từng request), `/parent/requests`, `/parent/requests/new`, `/parent/requests/:id`, `/parent/requests/:id/edit`, `/parent/requests/:requestId/ai-suggestions`, `/parent/requests/:id/applications`, `/parent/invitations`, `/parent/messages`, `/parent/messages/:conversationId` | `PARENT_MENU` | `pages/parent/*` (Overview `ParentDashboard.jsx`, UC10, UC09, UC14, duyệt đơn ứng tuyển) |
| TUTOR | `/tutor/dashboard`, `/tutor/requests`, `/tutor/requests/suggested`, `/tutor/requests/saved`, `/tutor/requests/:id`, `/tutor/applications`, `/tutor/invitations`, `/tutor/profile`, `/tutor/posts`, `/tutor/posts/new`, `/tutor/posts/:id/edit`, `/tutor/messages`, `/tutor/messages/:conversationId` | `TUTOR_MENU` | `pages/tutor/*` (Overview `TutorDashboard.jsx`, UC11, UC12, phản hồi lời mời, hồ sơ, bài đăng) |

Màn Messages của Parent và Tutor là **cùng một trang** `pages/chat/ChatPage.jsx`, chỉ khác prop `basePath` (`/parent/messages` hoặc `/tutor/messages`).

Parent và Tutor Dashboard dùng chung các thành phần `WelcomeBanner`, `StatCard`, `SectionCard`, `CompactList`, `EmptyState` và các lớp `.stat-grid`, `.dashboard-columns` trong `index.css`; số liệu lấy từ `docs/api/dashboards.md`, danh sách lấy từ các API có phân trang sẵn có. Trang đích sau đăng nhập khai báo trong `utils/getHomePathByRole.js`.

Các mục menu không có `to` hiển thị mờ ("Coming soon"). Thêm trang của UC mới: khai báo `to` cho mục tương ứng trong `dashboardMenus.js` và thêm route vào đúng nhóm trong `routes.jsx`.
