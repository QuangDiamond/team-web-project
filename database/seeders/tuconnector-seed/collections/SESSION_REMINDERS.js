const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  { _id: ids.rem_1, session_id: ids.ses_2, user_id: ids.user_student_an, channel: 'EMAIL', trigger_time: 'BEFORE_24H', scheduled_for: d('2026-10-26T19:00:00+07:00'), status: 'PENDING', sent_at: null },
  // SMS chỉ cho lớp của gia sư gói Pro (Minh đang Pro)
  { _id: ids.rem_2, session_id: ids.ses_2, user_id: ids.user_tutor_minh, channel: 'SMS', trigger_time: 'BEFORE_30M', scheduled_for: d('2026-10-27T18:30:00+07:00'), status: 'PENDING', sent_at: null },
];
