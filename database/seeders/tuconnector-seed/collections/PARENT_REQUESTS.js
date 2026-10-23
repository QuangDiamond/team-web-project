const ids = require('../ids');
const { d, money } = require('../helpers');

module.exports = [
  {
    _id: ids.req_toan9, parent_user_id: ids.user_parent_ha, title: 'Tìm gia sư Toán lớp 9 ôn thi vào 10',
    subject_name: 'Toán', grade_level: 'Lớp 9', teaching_mode: 'OFFLINE', budget: money(250000),
    schedule: 'Tối thứ 3, thứ 5 (19:00–20:30)', description: 'Con học khá, cần luyện đề và củng cố hình học.',
    location_address: 'Cầu Giấy, Hà Nội', image_urls: [], status: 'CLOSED', // đã chốt thỏa thuận với gia sư Minh
    created_at: d('2026-10-03T20:00:00+07:00'), updated_at: d('2026-10-10T21:00:00+07:00'),
    student_id: ids.user_student_an, tutor_requirements: 'Ưu tiên gia sư có kinh nghiệm luyện thi vào 10',
  },
  {
    _id: ids.req_anh7, parent_user_id: ids.user_parent_tuan, title: 'Tìm gia sư Tiếng Anh lớp 7',
    subject_name: 'Tiếng Anh', grade_level: 'Lớp 7', teaching_mode: 'ONLINE', budget: money(180000),
    schedule: 'Sáng thứ 7, chủ nhật', description: 'Cần cải thiện ngữ pháp và nghe nói.',
    location_address: 'Thanh Xuân, Hà Nội', image_urls: [], status: 'IN_PROGRESS',
    created_at: d('2026-10-05T19:00:00+07:00'), updated_at: d('2026-10-08T19:30:00+07:00'),
    student_id: ids.user_student_binh, tutor_requirements: null,
  },
  {
    _id: ids.req_ly11, parent_user_id: ids.user_parent_ha, title: 'Tìm gia sư Vật lý lớp 11',
    subject_name: 'Vật lý', grade_level: 'Lớp 11', teaching_mode: 'HYBRID', budget: money(300000),
    schedule: 'Linh hoạt các tối trong tuần', description: 'Mất gốc phần điện học.',
    location_address: 'Cầu Giấy, Hà Nội', image_urls: ['https://cdn.tuconnector.vn/requests/ly11-diem.jpg'], status: 'OPEN',
    created_at: d('2026-10-12T21:00:00+07:00'), updated_at: d('2026-10-12T21:00:00+07:00'),
    student_id: null, // liên kết với học sinh Chi đang chờ chấp nhận nên chưa gán
    tutor_requirements: 'Gia sư nam hoặc nữ đều được, có kinh nghiệm dạy lớp 11',
  },
];
