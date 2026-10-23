const ids = require('../ids');
const { d } = require('../helpers');

// 1 thỏa thuận chỉ được đánh giá 1 lần (unique agreement_id).
module.exports = [
  {
    _id: ids.rev_1, tutor_profile_id: ids.tp_minh, rating: 5, comment: 'Thầy dạy dễ hiểu, con tiến bộ rõ sau 2 tuần.',
    created_at: d('2026-10-21T21:00:00+07:00'), agreement_id: ids.agr_ha_minh, parent_user_id: ids.user_parent_ha,
    knowledge_rating: 5, punctuality_rating: 5, communication_rating: 5,
    tutor_reply: 'Cảm ơn chị, em sẽ cố gắng hơn nữa!', replied_at: d('2026-10-22T08:00:00+07:00'),
    status: 'APPROVED', updated_at: null,
  },
];
