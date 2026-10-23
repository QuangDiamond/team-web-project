const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  {
    _id: ids.noti_1, recipient_user_id: ids.user_parent_ha, category: 'APPLICATION', title: 'Có gia sư mới ứng tuyển',
    body: 'Lê Quang Huy vừa ứng tuyển vào yêu cầu "Tìm gia sư Vật lý lớp 11".', target_type: null, target_id: null,
    is_read: false, read_at: null, created_at: d('2026-10-12T10:00:05+07:00'),
    delivery_logs: [{ recipient_user_id: ids.user_parent_ha, channel: 'IN_APP', status: 'SENT', error_message: null, dispatched_at: d('2026-10-12T10:00:05+07:00') }],
  },
  {
    _id: ids.noti_2, recipient_user_id: ids.user_tutor_minh, category: 'INVITATION', title: 'Bạn nhận được lời mời dạy',
    body: 'Phạm Thu Hà mời bạn dạy Vật lý lớp 11.', target_type: null, target_id: null,
    is_read: true, read_at: d('2026-10-15T22:00:00+07:00'), created_at: d('2026-10-15T21:00:05+07:00'),
    delivery_logs: [
      { recipient_user_id: ids.user_tutor_minh, channel: 'IN_APP', status: 'SENT', error_message: null, dispatched_at: d('2026-10-15T21:00:05+07:00') },
      { recipient_user_id: ids.user_tutor_minh, channel: 'EMAIL', status: 'SENT', error_message: null, dispatched_at: d('2026-10-15T21:00:10+07:00') },
    ],
  },
  {
    _id: ids.noti_3, recipient_user_id: ids.user_student_an, category: 'ASSIGNMENT', title: 'Bài tập mới',
    body: 'Thầy Minh vừa giao "Bài kiểm tra 15 phút – Căn bậc hai".', target_type: 'ASSIGNMENT', target_id: ids.asg_1,
    is_read: true, read_at: d('2026-10-20T21:30:00+07:00'), created_at: d('2026-10-20T21:00:05+07:00'),
    delivery_logs: [
      { recipient_user_id: ids.user_student_an, channel: 'IN_APP', status: 'SENT', error_message: null, dispatched_at: d('2026-10-20T21:00:05+07:00') },
      { recipient_user_id: ids.user_student_an, channel: 'SMS', status: 'FALLBACK_EMAIL', error_message: 'Học sinh chưa có số điện thoại', dispatched_at: d('2026-10-20T21:00:06+07:00') },
    ],
  },
];
