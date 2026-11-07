// D2 (UC02): đăng nhập xong về dashboard; nếu bị PrivateRoute đẩy sang /login thì quay lại trang đang mở
export const getPathAfterLogin = (location) => {
  if (location.state && location.state.from) {
    return location.state.from;
  }
  return '/dashboard';
};
