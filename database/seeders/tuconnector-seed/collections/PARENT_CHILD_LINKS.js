const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  { _id: ids.pcl_ha_an, parent_user_id: ids.user_parent_ha, student_user_id: ids.user_student_an, status: 'ACCEPTED', created_at: d('2026-10-02T09:00:00+07:00'), updated_at: d('2026-10-02T10:00:00+07:00') },
  { _id: ids.pcl_tuan_binh, parent_user_id: ids.user_parent_tuan, student_user_id: ids.user_student_binh, status: 'ACCEPTED', created_at: d('2026-10-03T09:00:00+07:00'), updated_at: d('2026-10-03T11:00:00+07:00') },
  // Phụ huynh gửi yêu cầu, học sinh chưa chấp nhận
  { _id: ids.pcl_ha_chi, parent_user_id: ids.user_parent_ha, student_user_id: ids.user_student_chi, status: 'PENDING', created_at: d('2026-10-20T20:00:00+07:00'), updated_at: d('2026-10-20T20:00:00+07:00') },
];
