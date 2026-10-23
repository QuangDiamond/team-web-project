const ids = require('../ids');
const { d, money } = require('../helpers');

module.exports = [
  {
    _id: ids.agr_ha_minh, conversation_id: ids.conv_ha_minh, proposer_user_id: ids.user_tutor_minh, accepted_by_user_id: ids.user_parent_ha,
    agreed_subject: 'Toán 9', agreed_schedule: 'Thứ 3, thứ 5 – 19:00 đến 20:30', agreed_price: money(250000),
    status: 'CONFIRMED', created_at: d('2026-10-10T20:00:00+07:00'), updated_at: d('2026-10-10T21:00:00+07:00'),
  },
  {
    // Đang chờ bên kia xác nhận → chưa có người chấp nhận
    _id: ids.agr_tuan_lan, conversation_id: ids.conv_tuan_lan, proposer_user_id: ids.user_parent_tuan, accepted_by_user_id: null,
    agreed_subject: 'Tiếng Anh 7', agreed_schedule: 'Thứ 7 – 9:00 đến 10:30', agreed_price: money(180000),
    status: 'PENDING', created_at: d('2026-10-08T21:30:00+07:00'), updated_at: d('2026-10-08T21:30:00+07:00'),
  },
];
