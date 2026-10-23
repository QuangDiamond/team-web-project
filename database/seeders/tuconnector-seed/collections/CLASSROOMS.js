const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  {
    _id: ids.class_toan9, tutor_profile_id: ids.tp_minh, agreement_id: ids.agr_ha_minh,
    name: 'Toán 9 – Ôn thi vào 10', subject: 'Toán', grade: 'Lớp 9', description: 'Lớp kèm 1-1 cho An, ôn thi vào 10.',
    capacity: 10, join_code: 'TOAN9A', invite_link: 'https://tuconnector.vn/join/TOAN9A', status: 'ACTIVE',
    created_at: d('2026-10-11T09:00:00+07:00'), updated_at: d('2026-10-11T09:00:00+07:00'),
    topics: [
      { _id: ids.topic_dai_so, name: 'Chương 1: Căn bậc hai', created_at: d('2026-10-11T09:10:00+07:00') },
      { _id: ids.topic_hinh_hoc, name: 'Chương 2: Hệ thức lượng trong tam giác vuông', created_at: d('2026-10-11T09:12:00+07:00') },
    ],
  },
];
