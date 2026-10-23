const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  {
    _id: ids.report_1, reporter_user_id: ids.user_parent_tuan, target_type: 'POST', target_id: ids.post_huy_ly,
    reason: 'Bài đăng chứa số điện thoại', severity: 'MEDIUM', status: 'RESOLVED', action_taken: 'WARNING_SENT',
    admin_note: 'Đã cảnh báo gia sư, gia sư đã sửa bài.', resolved_by_admin_id: ids.user_admin,
    resolved_at: d('2026-10-18T10:00:00+07:00'), created_at: d('2026-10-17T22:00:00+07:00'),
  },
];
