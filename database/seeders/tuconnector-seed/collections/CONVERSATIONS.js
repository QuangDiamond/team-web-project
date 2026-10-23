const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  {
    _id: ids.conv_ha_minh, parent_user_id: ids.user_parent_ha, tutor_profile_id: ids.tp_minh, is_active: true,
    created_at: d('2026-10-06T20:00:00+07:00'), request_id: ids.req_toan9, class_id: null, type: 'DIRECT',
    updated_at: d('2026-10-06T20:40:00+07:00'),
    read_states: [
      { user_id: ids.user_parent_ha, last_read_message_id: ids.msg_3, read_at: d('2026-10-06T20:45:00+07:00') },
      { user_id: ids.user_tutor_minh, last_read_message_id: ids.msg_3, read_at: d('2026-10-06T20:40:00+07:00') },
    ],
  },
  {
    _id: ids.conv_tuan_lan, parent_user_id: ids.user_parent_tuan, tutor_profile_id: ids.tp_lan, is_active: true,
    created_at: d('2026-10-08T21:00:00+07:00'), request_id: ids.req_anh7, class_id: null, type: 'DIRECT',
    updated_at: d('2026-10-08T21:20:00+07:00'),
    read_states: [
      { user_id: ids.user_parent_tuan, last_read_message_id: ids.msg_5, read_at: d('2026-10-08T21:25:00+07:00') },
      { user_id: ids.user_tutor_lan, last_read_message_id: ids.msg_4, read_at: d('2026-10-08T21:10:00+07:00') },
    ],
  },
  {
    // Chat nhóm của lớp: không gắn request, thành viên lấy từ CLASS_MEMBERS
    _id: ids.conv_class_toan9, parent_user_id: null, tutor_profile_id: ids.tp_minh, is_active: true,
    created_at: d('2026-10-11T09:00:00+07:00'), request_id: null, class_id: ids.class_toan9, type: 'CLASS_GROUP_CHAT',
    updated_at: d('2026-10-15T20:00:00+07:00'),
    read_states: [{ user_id: ids.user_student_an, last_read_message_id: ids.msg_6, read_at: d('2026-10-15T21:00:00+07:00') }],
  },
];
