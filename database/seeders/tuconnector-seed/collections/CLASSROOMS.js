const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  {
    _id: ids.class_toan9, tutor_profile_id: ids.tp_minh, agreement_id: ids.agr_ha_minh,
    name: 'Toán 9 – Ôn thi vào 10', subject: 'Toán', grade: 'Lớp 9', description: 'Lớp kèm 1-1 cho An, ôn thi vào 10.',
    capacity: 10, join_code: 'TOAN9A', invite_link: 'https://tuconnector.vn/join/TOAN9A', status: 'ACTIVE',
    created_at: d('2026-10-11T09:00:00+07:00'), updated_at: d('2026-11-13T00:10:50.308+07:00'),
    topics: [
      { _id: ids.topic_hinh_hoc, name: 'Chương 2: Hệ thức lượng trong tam giác vuông', created_at: d('2026-10-11T09:12:00+07:00') },
      { _id: ids.topic_chapter3, name: 'Chapter 3', created_at: d('2026-11-12T21:37:21.102+07:00') },
    ],
  },
  {
    _id: ids.class_toan8_minh, tutor_profile_id: ids.tp_minh, agreement_id: null,
    name: 'Toán 8 – Đại số nền tảng', subject: 'Toán', grade: 'Lớp 8',
    description: 'Lớp học củng cố đại số cho học sinh lớp 8.',
    capacity: 10, join_code: 'MINHTOAN8', invite_link: 'https://tuconnector.vn/join/MINHTOAN8', status: 'ACTIVE',
    created_at: d('2026-10-25T09:00:00+07:00'), updated_at: d('2026-10-25T09:00:00+07:00'), topics: [],
  },
  {
    _id: ids.class_anh7_lan, tutor_profile_id: ids.tp_lan, agreement_id: null,
    name: 'Tiếng Anh 7 – Giao tiếp và ngữ pháp', subject: 'Tiếng Anh', grade: 'Lớp 7',
    description: 'Lớp học tiếng Anh lớp 7, tập trung giao tiếp và ngữ pháp.',
    capacity: 10, join_code: 'LANANH7', invite_link: 'https://tuconnector.vn/join/LANANH7', status: 'ACTIVE',
    created_at: d('2026-10-25T09:00:00+07:00'), updated_at: d('2026-10-25T09:00:00+07:00'), topics: [],
  },
  {
    _id: ids.class_anh8_lan, tutor_profile_id: ids.tp_lan, agreement_id: null,
    name: 'Tiếng Anh 8 – Ôn tập học kỳ', subject: 'Tiếng Anh', grade: 'Lớp 8',
    description: 'Lớp học tiếng Anh lớp 8, ôn tập và luyện kỹ năng.',
    capacity: 10, join_code: 'LANANH8', invite_link: 'https://tuconnector.vn/join/LANANH8', status: 'ACTIVE',
    created_at: d('2026-10-25T09:00:00+07:00'), updated_at: d('2026-10-25T09:00:00+07:00'), topics: [],
  },
  {
    _id: ids.class_ly11_huy, tutor_profile_id: ids.tp_huy, agreement_id: null,
    name: 'Vật lý 11 – Điện học', subject: 'Vật lý', grade: 'Lớp 11',
    description: 'Lớp học điện học và bài tập vận dụng cho học sinh lớp 11.',
    capacity: 10, join_code: 'HUYLY11', invite_link: 'https://tuconnector.vn/join/HUYLY11', status: 'ACTIVE',
    created_at: d('2026-10-25T09:00:00+07:00'), updated_at: d('2026-10-25T09:00:00+07:00'), topics: [],
  },
  {
    _id: ids.class_ly10_huy, tutor_profile_id: ids.tp_huy, agreement_id: null,
    name: 'Vật lý 10 – Cơ học cơ bản', subject: 'Vật lý', grade: 'Lớp 10',
    description: 'Lớp học cơ học cơ bản và phương pháp giải bài tập.',
    capacity: 10, join_code: 'HUYLY10', invite_link: 'https://tuconnector.vn/join/HUYLY10', status: 'ACTIVE',
    created_at: d('2026-10-25T09:00:00+07:00'), updated_at: d('2026-10-25T09:00:00+07:00'), topics: [],
  },
];
