const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  { _id: ids.mem_an, class_id: ids.class_toan9, user_id: ids.user_student_an, joined_at: d('2026-10-11T19:00:00+07:00'), status: 'ACTIVE', removal_reason: null },
  { _id: ids.mem_ha, class_id: ids.class_toan9, user_id: ids.user_parent_ha, joined_at: d('2026-10-11T19:05:00+07:00'), status: 'ACTIVE', removal_reason: null },
  { _id: ids.mem_binh_minh_toan8, class_id: ids.class_toan8_minh, user_id: ids.user_student_binh, joined_at: d('2026-10-25T19:00:00+07:00'), status: 'ACTIVE', removal_reason: null },
  { _id: ids.mem_binh_lan_anh7, class_id: ids.class_anh7_lan, user_id: ids.user_student_binh, joined_at: d('2026-10-25T19:05:00+07:00'), status: 'ACTIVE', removal_reason: null },
  { _id: ids.mem_chi_lan_anh8, class_id: ids.class_anh8_lan, user_id: ids.user_student_chi, joined_at: d('2026-10-25T19:10:00+07:00'), status: 'ACTIVE', removal_reason: null },
  { _id: ids.mem_chi_huy_ly11, class_id: ids.class_ly11_huy, user_id: ids.user_student_chi, joined_at: d('2026-10-25T19:15:00+07:00'), status: 'ACTIVE', removal_reason: null },
  { _id: ids.mem_an_huy_ly10, class_id: ids.class_ly10_huy, user_id: ids.user_student_an, joined_at: d('2026-10-25T19:20:00+07:00'), status: 'ACTIVE', removal_reason: null },
];
