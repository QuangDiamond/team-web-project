const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  {
    _id: ids.report_1, reporter_user_id: ids.user_parent_tuan, target_type: 'POST', target_id: ids.post_huy_ly,
    reason: 'Bài đăng chứa số điện thoại', severity: 'MEDIUM', status: 'RESOLVED', action_taken: 'WARNING_SENT',
    admin_note: 'Đã cảnh báo gia sư, gia sư đã sửa bài.', resolved_by_admin_id: ids.user_admin,
    resolved_at: d('2026-10-18T10:00:00+07:00'), created_at: d('2026-10-17T22:00:00+07:00'),
  },
  // 2 báo cáo đang chờ Admin xử lý ở trang Kiểm duyệt (UC38)
  {
    _id: ids.report_2, reporter_user_id: ids.user_tutor_huy, target_type: 'REQUEST', target_id: ids.req_hoa10,
    reason: 'Chứa số điện thoại hoặc liên hệ ngoài nền tảng: mô tả ghi số Zalo của phụ huynh', severity: 'MEDIUM', status: 'PENDING',
    action_taken: null, admin_note: null, resolved_by_admin_id: null, resolved_at: null, created_at: d('2026-11-10T21:00:00+07:00'),
  },
  {
    _id: ids.report_3, reporter_user_id: ids.user_parent_ha, target_type: 'POST', target_id: ids.post_lan_ielts,
    reason: 'Thông tin sai sự thật hoặc có dấu hiệu lừa đảo: cam kết đầu ra không thực tế', severity: 'MEDIUM', status: 'PENDING',
    action_taken: null, admin_note: null, resolved_by_admin_id: null, resolved_at: null, created_at: d('2026-11-11T09:30:00+07:00'),
  },
];
