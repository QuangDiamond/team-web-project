// Danh mục môn học cho ô chọn môn (phụ huynh tạo yêu cầu, gia sư tạo bài đăng).
// Nạp riêng, không đụng dữ liệu khác: node seed.js --only=SUBJECTS (chạy lại nhiều lần vẫn an toàn)
const crypto = require('crypto');
const { ObjectId } = require('mongodb');

const SUBJECT_NAMES = [
  'Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học',
  'Lịch sử', 'Địa lý', 'Giáo dục công dân', 'Tin học', 'Lập trình', 'Tiếng Việt',
  'Khoa học tự nhiên', 'Khoa học xã hội', 'Tiếng Nhật', 'Tiếng Hàn', 'Tiếng Trung',
  'Tiếng Pháp', 'Tiếng Đức', 'Luyện thi IELTS', 'Luyện thi TOEIC', 'Luyện thi vào lớp 10',
  'Luyện thi đại học', 'Âm nhạc', 'Mỹ thuật', 'Kỹ năng mềm', 'Môn khác',
];

// _id sinh ổn định từ tên môn, giống cách ids.js làm, nên chạy lại vẫn ra cùng giá trị
const toId = (name) => new ObjectId(crypto.createHash('md5').update('tuconnector:subject:' + name).digest('hex').slice(0, 24));

module.exports = SUBJECT_NAMES.map((name, index) => ({
  _id: toId(name),
  name: name,
  sort_order: index + 1,
  is_active: true,
}));
