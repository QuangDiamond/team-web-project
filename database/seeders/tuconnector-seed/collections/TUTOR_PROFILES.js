const ids = require('../ids');
const { d, dbl } = require('../helpers');

module.exports = [
  {
    _id: ids.tp_minh, user_id: ids.user_tutor_minh,
    headline: 'Gia sư Toán THCS – 5 năm luyện thi vào 10',
    bio: 'Tốt nghiệp ĐH Sư phạm Hà Nội ngành Toán. Dạy theo hướng hệ thống kiến thức, luyện đề sát cấu trúc thi.',
    avatar_url: 'https://cdn.tuconnector.vn/avatars/minh.jpg', cover_url: null,
    address: 'Cầu Giấy, Hà Nội', is_address_hidden: false, is_complete: true,
    availability_status: 'AVAILABLE', average_rating: dbl(5.0),
    experiences: [
      { title: 'Giáo viên Toán', company: 'Trung tâm Học Mãi', start_date: d('2021-09-01T00:00:00+07:00'), end_date: d('2024-06-30T00:00:00+07:00') },
      { title: 'Gia sư Toán tự do', company: 'Freelance', start_date: d('2024-07-01T00:00:00+07:00'), end_date: null },
    ],
    achievements: [{ title: 'Giải Nhất HSG Toán cấp Tỉnh 2017', description: 'Tỉnh Nam Định' }],
    educations: [{ school: 'ĐH Sư phạm Hà Nội', degree: 'Cử nhân Sư phạm Toán', graduation_year: 2021, description: null }],
  },
  {
    _id: ids.tp_lan, user_id: ids.user_tutor_lan,
    headline: 'Gia sư Tiếng Anh – IELTS 8.0',
    bio: 'Sinh viên năm 4 ĐH Ngoại ngữ, chuyên dạy Tiếng Anh THCS và giao tiếp.',
    avatar_url: null, cover_url: null,
    address: 'Thanh Xuân, Hà Nội', is_address_hidden: true, is_complete: true,
    availability_status: 'AVAILABLE', average_rating: dbl(0),
    experiences: [{ title: 'Trợ giảng IELTS', company: 'IELTS Fighter', start_date: d('2025-01-01T00:00:00+07:00'), end_date: null }],
    achievements: [{ title: 'IELTS 8.0', description: 'Thi tháng 3/2025' }],
    educations: [{ school: 'ĐH Ngoại ngữ – ĐHQG Hà Nội', degree: 'Ngôn ngữ Anh', graduation_year: 2027, description: 'Đang học năm 4' }],
  },
  {
    _id: ids.tp_huy, user_id: ids.user_tutor_huy,
    headline: 'Gia sư Vật lý THPT',
    bio: 'Kỹ sư Bách khoa, dạy Vật lý 10–12 và luyện thi THPT Quốc gia.',
    avatar_url: null, cover_url: null,
    address: 'Hai Bà Trưng, Hà Nội', is_address_hidden: false, is_complete: true,
    availability_status: 'NOT_AVAILABLE', average_rating: dbl(0),
    experiences: [], achievements: [],
    educations: [{ school: 'ĐH Bách khoa Hà Nội', degree: 'Kỹ sư Điện', graduation_year: 2023, description: null }],
  },
];
