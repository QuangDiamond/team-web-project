const ids = require('../ids');
const { d } = require('../helpers');

const m = (o) => ({ message_type: 'TEXT', attachments: [], ...o });
module.exports = [
  m({ _id: ids.msg_1, conversation_id: ids.conv_ha_minh, sender_user_id: ids.user_parent_ha, content: 'Chào thầy, thầy dạy được tối thứ 3 và thứ 5 không ạ?', created_at: d('2026-10-06T20:01:00+07:00') }),
  m({ _id: ids.msg_2, conversation_id: ids.conv_ha_minh, sender_user_id: ids.user_tutor_minh, content: 'Dạ được chị, em đề xuất 250k/buổi 90 phút.', created_at: d('2026-10-06T20:10:00+07:00') }),
  m({ _id: ids.msg_3, conversation_id: ids.conv_ha_minh, sender_user_id: ids.user_tutor_minh, message_type: 'CONTACT_CARD', content: 'Zalo: 0901000001', created_at: d('2026-10-06T20:40:00+07:00') }),
  m({ _id: ids.msg_4, conversation_id: ids.conv_tuan_lan, sender_user_id: ids.user_tutor_lan, content: 'Em nhận lời mời ạ, sáng thứ 7 9h được không anh?', created_at: d('2026-10-08T21:05:00+07:00') }),
  m({ _id: ids.msg_5, conversation_id: ids.conv_tuan_lan, sender_user_id: ids.user_parent_tuan, content: 'Được em, để anh xác nhận thỏa thuận nhé.', created_at: d('2026-10-08T21:20:00+07:00') }),
  m({
    _id: ids.msg_6, conversation_id: ids.conv_class_toan9, sender_user_id: ids.user_tutor_minh, message_type: 'FILE',
    content: 'Các em xem trước đề cương buổi sau nhé.', created_at: d('2026-10-15T20:00:00+07:00'),
    attachments: [{ file_url: 'https://cdn.tuconnector.vn/chat/de-cuong-buoi-3.pdf', file_name: 'de-cuong-buoi-3.pdf', file_size: 245760, mime_type: 'application/pdf' }],
  }),
];
