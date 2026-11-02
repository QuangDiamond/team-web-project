// Trang đích sau khi đăng nhập theo role.
// Chỉ thêm role vào đây khi dashboard của role đó đã có route thật (xem docs/architecture/dashboard-frame.md).
const DASHBOARD_PATH_BY_ROLE = {
  STUDENT: '/student/dashboard',
};

// Role chưa có dashboard thì giữ điều hướng cũ: về trang chủ
const DEFAULT_HOME_PATH = '/';

export const getHomePathByRole = (role) => {
  const dashboardPath = DASHBOARD_PATH_BY_ROLE[role];
  if (dashboardPath) {
    return dashboardPath;
  }
  return DEFAULT_HOME_PATH;
};
