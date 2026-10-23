const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  {
    _id: ids.ses_1, class_id: ids.class_toan9, tutor_profile_id: ids.tp_minh, rule_id: ids.rule_toan9, title: 'Buổi 3: Luyện tập căn bậc hai',
    start_time: d('2026-10-20T19:00:00+07:00'), end_time: d('2026-10-20T20:30:00+07:00'), meeting_link: 'Nhà học sinh – Cầu Giấy',
    status: 'COMPLETED', created_at: d('2026-10-11T09:20:00+07:00'), updated_at: d('2026-10-20T20:35:00+07:00'),
    attendance: [{ student_user_id: ids.user_student_an, status: 'PRESENT', comment: null, marked_at: d('2026-10-20T20:35:00+07:00') }],
  },
  {
    _id: ids.ses_2, class_id: ids.class_toan9, tutor_profile_id: ids.tp_minh, rule_id: ids.rule_toan9, title: 'Buổi 5: Hệ thức lượng',
    start_time: d('2026-10-27T19:00:00+07:00'), end_time: d('2026-10-27T20:30:00+07:00'), meeting_link: 'Nhà học sinh – Cầu Giấy',
    status: 'SCHEDULED', created_at: d('2026-10-11T09:20:00+07:00'), updated_at: d('2026-10-11T09:20:00+07:00'),
    attendance: [],
  },
];
