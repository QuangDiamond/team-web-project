const ids = require('../ids');
const { d } = require('../helpers');

// Token thật phải được mã hóa trước khi lưu; đây là giá trị giả.
module.exports = [
  { _id: ids.cal_minh, user_id: ids.user_tutor_minh, provider: 'GOOGLE_CALENDAR', access_token: 'enc:seed_access_token', refresh_token: 'enc:seed_refresh_token', google_calendar_id: 'tuconnector-minh@group.calendar.google.com', is_connected: true, last_synced_at: d('2026-10-22T07:00:00+07:00'), expires_at: d('2026-10-22T08:00:00+07:00') },
];
