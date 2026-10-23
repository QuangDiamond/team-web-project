const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  {
    _id: ids.audit_1, admin_user_id: ids.user_admin, target_user_id: ids.user_tutor_huy, action: 'WARN_USER',
    reason: 'Đăng số điện thoại cá nhân trong bài đăng (vi phạm quy định).',
    details_json: { report_id: ids.report_1.toHexString(), post_id: ids.post_huy_ly.toHexString(), snapshot: 'Liên hệ trực tiếp 09xx…' },
    ip_address: '113.190.0.10', created_at: d('2026-10-18T10:00:00+07:00'),
  },
];
