const ids = require('../ids');
const { d, dbl } = require('../helpers');

// Mỗi lượt ứng tuyển trừ 1 credit của gia sư (xem CREDIT_TRANSACTIONS, type USED_APPLY), không hoàn lại.
module.exports = [
  { _id: ids.apply_minh_toan9, request_id: ids.req_toan9, tutor_profile_id: ids.tp_minh, note: 'Em đã dạy nhiều học sinh đỗ cấp 3 công lập, mong được hỗ trợ con chị.', match_score: dbl(92.5), status: 'CONTINUED', created_at: d('2026-10-05T09:00:00+07:00'), updated_at: d('2026-10-06T20:00:00+07:00') },
  { _id: ids.apply_huy_toan9, request_id: ids.req_toan9, tutor_profile_id: ids.tp_huy, note: 'Tôi có thể dạy Toán 9.', match_score: dbl(61), status: 'SKIPPED', created_at: d('2026-10-05T11:00:00+07:00'), updated_at: d('2026-10-06T20:05:00+07:00') },
  { _id: ids.apply_huy_ly11, request_id: ids.req_ly11, tutor_profile_id: ids.tp_huy, note: 'Phần điện học là thế mạnh của tôi.', match_score: dbl(87.5), status: 'PENDING', created_at: d('2026-10-12T10:00:00+07:00'), updated_at: d('2026-10-12T10:00:00+07:00') },
];
