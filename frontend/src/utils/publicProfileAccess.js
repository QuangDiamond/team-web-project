// Hồ sơ công khai chỉ dành cho gia sư và phụ huynh (học sinh, admin không dùng).
// Khách chưa đăng nhập vẫn thấy link, bấm vào sẽ được đưa tới trang đăng nhập
export const canViewPublicProfile = (user) => {
  if (!user) {
    return true;
  }
  return user.role === 'TUTOR' || user.role === 'PARENT';
};
