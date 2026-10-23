const ids = require('../ids');
const { d } = require('../helpers');

// Mật khẩu mẫu của mọi tài khoản có password: Tuconnector@123 (hash bcrypt giả lập, backend cần hash lại thật)
const PW = '$2b$10$seedSeedSeedSeedSeedSeuQx1u9G1a3tF6Yp0mGz2t5bq8wQ9eDkC';

const prefs = (sms = false) => ({
  enable_in_app: true, enable_email: true, enable_sms: sms,
  notify_on_sessions: true, notify_on_assignments: true, notify_on_messages: true,
  updated_at: d('2026-10-01T08:00:00+07:00'),
});
const freeSub = (plan) => ({
  plan_id: plan, status: 'ACTIVE', expires_at: null, ai_quota_used: 0,
  ai_quota_reset_at: d('2026-11-01T00:00:00+07:00'), start_date: d('2026-10-01T00:00:00+07:00'),
  created_at: d('2026-10-01T00:00:00+07:00'),
});
const base = (o) => ({
  phone: null, password_hash: PW, email_verify_status: true, is_onboarded: true,
  created_at: d('2026-10-01T08:00:00+07:00'), account_status: 'ACTIVE', failed_login_attempts: 0,
  last_login_at: d('2026-10-22T20:00:00+07:00'), updated_at: d('2026-10-22T20:00:00+07:00'),
  has_password: true, avatar_url: null, is_login_locked: false,
  google_account: null, credit_wallet: null, notification_preferences: prefs(),
  subscription: null, student_profile: null,
  ...o,
});

module.exports = [
  base({ _id: ids.user_admin, full_name: 'Quản trị viên', email: 'admin@tuconnector.vn', role: 'ADMIN' }),

  // Gia sư
  base({
    _id: ids.user_tutor_minh, full_name: 'Nguyễn Văn Minh', email: 'minh.tutor@gmail.com', phone: '0901000001', role: 'TUTOR',
    credit_wallet: { balance: 29, updated_at: d('2026-10-05T09:00:00+07:00') },
    notification_preferences: prefs(true),
    subscription: {
      plan_id: ids.plan_tutor_pro, status: 'ACTIVE', expires_at: d('2027-01-01T00:00:00+07:00'), ai_quota_used: 12,
      ai_quota_reset_at: d('2026-11-01T00:00:00+07:00'), start_date: d('2026-10-01T00:00:00+07:00'),
      created_at: d('2026-10-01T00:00:00+07:00'),
    },
  }),
  base({
    _id: ids.user_tutor_lan, full_name: 'Trần Thị Lan', email: 'lan.tutor@gmail.com', phone: '0901000002', role: 'TUTOR',
    credit_wallet: { balance: 5, updated_at: d('2026-10-01T00:00:00+07:00') },
    subscription: freeSub(ids.plan_tutor_free),
  }),
  base({
    _id: ids.user_tutor_huy, full_name: 'Lê Quang Huy', email: 'huy.tutor@gmail.com', phone: '0901000003', role: 'TUTOR',
    credit_wallet: { balance: 3, updated_at: d('2026-10-12T10:00:00+07:00') },
    subscription: freeSub(ids.plan_tutor_free),
  }),

  // Phụ huynh
  base({
    _id: ids.user_parent_ha, full_name: 'Phạm Thu Hà', email: 'ha.parent@gmail.com', phone: '0902000001', role: 'PARENT',
    credit_wallet: { balance: 22, updated_at: d('2026-10-15T21:00:00+07:00') },
    subscription: freeSub(ids.plan_parent_free),
  }),
  base({
    _id: ids.user_parent_tuan, full_name: 'Đỗ Anh Tuấn', email: 'tuan.parent@gmail.com', phone: '0902000002', role: 'PARENT',
    credit_wallet: { balance: 2, updated_at: d('2026-10-08T19:00:00+07:00') },
    subscription: freeSub(ids.plan_parent_free),
  }),

  // Học sinh
  base({
    _id: ids.user_student_an, full_name: 'Phạm Minh An', email: 'an.student@gmail.com', role: 'STUDENT',
    student_profile: { full_name: 'Phạm Minh An', grade_level: 'Lớp 9' },
  }),
  base({
    _id: ids.user_student_binh, full_name: 'Đỗ Gia Bình', email: 'binh.student@gmail.com', role: 'STUDENT',
    student_profile: { full_name: 'Đỗ Gia Bình', grade_level: 'Lớp 7' },
  }),
  // Học sinh đăng ký bằng Google, chưa đặt mật khẩu, chưa xác thực email
  base({
    _id: ids.user_student_chi, full_name: 'Phạm Bảo Chi', email: 'chi.student@gmail.com', role: 'STUDENT',
    password_hash: null, has_password: false, email_verify_status: false, last_login_at: null,
    google_account: { google_id: '109876543210987654321', google_email: 'chi.student@gmail.com' },
    student_profile: { full_name: 'Phạm Bảo Chi', grade_level: 'Lớp 11' },
  }),
];
