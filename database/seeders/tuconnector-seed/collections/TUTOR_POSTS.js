const ids = require('../ids');
const { d, money } = require('../helpers');

module.exports = [
  {
    _id: ids.post_minh_toan, profile_id: ids.tp_minh, title: 'Nhận dạy Toán 8–9, luyện thi vào 10',
    subject_name: 'Toán', grade_level: 'Lớp 8–9', teaching_mode: 'OFFLINE', price: money(250000),
    schedule: 'Các tối trong tuần', description: 'Lộ trình 3 tháng, có đề thi thử hằng tuần.',
    image_urls: [], status: 'PUBLISHED', created_at: d('2026-10-02T10:00:00+07:00'), updated_at: d('2026-10-02T10:00:00+07:00'),
  },
  {
    _id: ids.post_lan_anh, profile_id: ids.tp_lan, title: 'Tiếng Anh THCS – online qua Google Meet',
    subject_name: 'Tiếng Anh', grade_level: 'Lớp 6–9', teaching_mode: 'ONLINE', price: money(180000),
    schedule: 'Cuối tuần', description: 'Tập trung ngữ pháp và phát âm.',
    image_urls: ['https://cdn.tuconnector.vn/posts/lan-ielts.jpg'], status: 'PUBLISHED',
    created_at: d('2026-10-02T15:00:00+07:00'), updated_at: d('2026-10-02T15:00:00+07:00'),
  },
  {
    _id: ids.post_huy_ly, profile_id: ids.tp_huy, title: 'Vật lý 10–12, luyện thi THPT',
    subject_name: 'Vật lý', grade_level: 'Lớp 10–12', teaching_mode: 'HYBRID', price: money(300000),
    schedule: 'Tối thứ 2, 4, 6', description: 'Dạy chắc lý thuyết, nhiều bài tập vận dụng.',
    image_urls: [], status: 'PUBLISHED', created_at: d('2026-10-04T09:00:00+07:00'), updated_at: d('2026-10-18T09:00:00+07:00'),
  },
];
