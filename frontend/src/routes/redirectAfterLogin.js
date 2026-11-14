import { getPublicProfileReturn } from '../utils/publicProfileReturn.js';

// D2 (UC02): đăng nhập xong về dashboard; nếu bị PrivateRoute đẩy sang /login thì quay lại trang đang mở
// Hỗ trợ tham số redirect khi mở invite link (UC24 Case 4.8)
export const getPathAfterLogin = (location, searchParams) => {
  const redirect =
    searchParams?.get?.('redirect') ||
    (location?.search ? new URLSearchParams(location.search).get('redirect') : null);

  // Chỉ chấp nhận relative URL nội bộ để tránh open redirect
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect;
  }

  if (location?.state && location.state.from) {
    return location.state.from;
  }
  return getPublicProfileReturn() || '/dashboard';
};
