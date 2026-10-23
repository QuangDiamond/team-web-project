const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  {
    _id: ids.scr_1, session_id: ids.ses_2, requester_user_id: ids.user_parent_ha, responder_user_id: null, request_type: 'MOVE',
    proposed_start_time: d('2026-10-28T19:00:00+07:00'), proposed_end_time: d('2026-10-28T20:30:00+07:00'),
    reason: 'Con có lịch kiểm tra ở trường tối thứ 3.', status: 'PENDING', response_comment: null, responded_at: null,
    created_at: d('2026-10-23T08:00:00+07:00'),
  },
];
