const ids = require('../ids');
const { d, dbl, FAR_FUTURE } = require('../helpers');

// TTL index trên cached_until: thực tế cache ~24h; seed để xa để không bị xóa ngay.
module.exports = [
  {
    _id: ids.ais_ly11_huy, request_id: ids.req_ly11, tutor_post_id: ids.post_huy_ly, tutor_profile_id: ids.tp_huy,
    match_score: dbl(87.5), ai_reason: 'Hợp môn Vật lý 11, lịch tối trùng khớp, học phí trong ngân sách.',
    weights_json: { subject: 0.4, schedule: 0.2, price: 0.2, rating: 0.1, distance: 0.1 },
    cached_until: FAR_FUTURE, created_at: d('2026-10-12T21:05:00+07:00'),
  },
];
