const ids = require('../ids');
const { d } = require('../helpers');

// Thông báo trong app chưa đọc, có 1 log gửi IN_APP lúc tạo
const inApp = (notification) => ({
  ...notification,
  is_read: false,
  read_at: null,
  delivery_logs: [{ recipient_user_id: notification.recipient_user_id, channel: 'IN_APP', status: 'SENT', error_message: null, dispatched_at: notification.created_at }],
});

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
  // Tin nhắn 1-1 mới (msg_7): tiêu đề bắt đầu bằng "Tin nhắn mới từ " để deepLink mở thẳng hội thoại
  inApp({
    _id: ids.noti_msg_minh, recipient_user_id: ids.user_tutor_minh, category: 'CONVERSATION', title: 'Tin nhắn mới từ Phạm Thu Hà',
    body: 'Thầy ơi, tối thứ 5 tuần này con có lịch kiểm tra, thầy cho con học bù tối thứ 6 được không ạ?',
    target_type: 'CONVERSATION', target_id: ids.conv_ha_minh, created_at: d('2026-11-10T20:15:01+07:00'),
  }),
  // Phụ huynh nhận thông báo khi gia sư xếp lịch học cho con (ses_2)
  inApp({
    _id: ids.noti_ses_ha, recipient_user_id: ids.user_parent_ha, category: 'SESSION', title: 'Lịch học mới: Buổi 5: Hệ thức lượng',
    body: 'Lớp "Toán 9 – Ôn thi vào 10" của Phạm Minh An – buổi học lúc 19:00 27/10/2026.',
    target_type: 'CLASSROOM', target_id: ids.class_toan9, created_at: d('2026-10-11T09:20:05+07:00'),
  }),
  // Báo cáo vi phạm (report_2, report_3): tác giả và Admin cùng được báo
  inApp({
    _id: ids.noti_report_2_author, recipient_user_id: ids.user_parent_tuan, category: 'SYSTEM', title: 'Yêu cầu tìm gia sư của bạn đang được kiểm duyệt',
    body: '"Tìm gia sư Hóa lớp 10 – liên hệ Zalo" đã bị người dùng báo cáo và tạm ẩn khỏi trang công khai cho đến khi Admin xem xét xong.',
    target_type: null, target_id: null, created_at: d('2026-11-10T21:00:01+07:00'),
  }),
  inApp({
    _id: ids.noti_report_2_admin, recipient_user_id: ids.user_admin, category: 'SYSTEM', title: 'Báo cáo vi phạm mới: yêu cầu tìm gia sư',
    body: '"Tìm gia sư Hóa lớp 10 – liên hệ Zalo" – lý do: Chứa số điện thoại hoặc liên hệ ngoài nền tảng: mô tả ghi số Zalo của phụ huynh',
    target_type: null, target_id: null, created_at: d('2026-11-10T21:00:01+07:00'),
  }),
  inApp({
    _id: ids.noti_report_3_author, recipient_user_id: ids.user_tutor_lan, category: 'SYSTEM', title: 'Bài đăng của bạn đang được kiểm duyệt',
    body: '"Cam kết IELTS 8.0 sau 1 tháng – học phí siêu rẻ" đã bị người dùng báo cáo và tạm ẩn khỏi trang công khai cho đến khi Admin xem xét xong.',
    target_type: null, target_id: null, created_at: d('2026-11-11T09:30:01+07:00'),
  }),
  inApp({
    _id: ids.noti_report_3_admin, recipient_user_id: ids.user_admin, category: 'SYSTEM', title: 'Báo cáo vi phạm mới: bài đăng',
    body: '"Cam kết IELTS 8.0 sau 1 tháng – học phí siêu rẻ" – lý do: Thông tin sai sự thật hoặc có dấu hiệu lừa đảo: cam kết đầu ra không thực tế',
    target_type: null, target_id: null, created_at: d('2026-11-11T09:30:01+07:00'),
  }),
];
