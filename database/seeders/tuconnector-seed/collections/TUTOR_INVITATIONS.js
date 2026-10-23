const ids = require('../ids');
const { d } = require('../helpers');

// Mỗi lời mời trừ 1 credit của phụ huynh (type USED_INVITATION), không hoàn lại.
module.exports = [
  { _id: ids.inv_lan_anh7, parent_user_id: ids.user_parent_tuan, tutor_profile_id: ids.tp_lan, request_id: ids.req_anh7, message: 'Cô xem giúp lịch cuối tuần có dạy được cháu không ạ.', status: 'ACCEPTED', created_at: d('2026-10-08T19:00:00+07:00'), updated_at: d('2026-10-08T21:00:00+07:00') },
  { _id: ids.inv_minh_ly11, parent_user_id: ids.user_parent_ha, tutor_profile_id: ids.tp_minh, request_id: ids.req_ly11, message: 'Thầy có nhận dạy thêm Vật lý không ạ?', status: 'PENDING', created_at: d('2026-10-15T21:00:00+07:00'), updated_at: d('2026-10-15T21:00:00+07:00') },
];
