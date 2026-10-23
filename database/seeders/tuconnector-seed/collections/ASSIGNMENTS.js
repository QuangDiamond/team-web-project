const ids = require('../ids');
const { d } = require('../helpers');

module.exports = [
  {
    _id: ids.asg_1, class_id: ids.class_toan9, creator_profile_id: ids.tp_minh, title: 'Bài kiểm tra 15 phút – Căn bậc hai',
    instructions: 'Làm trong 15 phút, câu 3 chụp ảnh bài làm và nộp file.', is_ai_generated: false, status: 'PUBLISHED',
    due_date: d('2026-10-30T23:59:00+07:00'), allow_late_submission: false, allow_resubmission: true, total_points: 10,
    published_at: d('2026-10-20T21:00:00+07:00'), results_published_at: null,
    created_at: d('2026-10-20T20:30:00+07:00'), updated_at: d('2026-10-20T21:00:00+07:00'),
    questions: [
      { _id: ids.q_1, question_number: 1, question_type: 'MULTIPLE_CHOICE', content: 'Căn bậc hai số học của 16 là?', options: ['-4', '4', '±4', '8'], correct_answer: '4', points: 2 },
      { _id: ids.q_2, question_number: 2, question_type: 'SHORT_ANSWER', content: 'Tìm x biết √x = 5.', options: null, correct_answer: null, points: 3 },
      { _id: ids.q_3, question_number: 3, question_type: 'FILE_UPLOAD', content: 'Rút gọn biểu thức A = √12 + √27 − √48 (trình bày chi tiết).', options: null, correct_answer: null, points: 5 },
    ],
    attachments: [{ material_id: ids.mat_1 }],
  },
];
