const ids = require('../ids');
const { d, dbl } = require('../helpers');

module.exports = [
  {
    _id: ids.sub_an_1, assignment_id: ids.asg_1, student_user_id: ids.user_student_an, attempt_number: 1,
    status: 'SUBMITTED', timeliness: 'ON_TIME', provisional_score: dbl(2), final_score: null, overall_feedback: null,
    submitted_at: d('2026-10-21T20:15:00+07:00'), graded_at: null,
    answers: [
      { question_id: ids.q_1, text_response: '4', file_url: null, file_size: null, score: dbl(2), is_auto_graded: true, is_overridden: false, comment: null },
      { question_id: ids.q_2, text_response: 'x = 25', file_url: null, file_size: null, score: null, is_auto_graded: false, is_overridden: false, comment: null },
      { question_id: ids.q_3, text_response: null, file_url: 'https://cdn.tuconnector.vn/submissions/an-cau3.jpg', file_size: 524288, score: null, is_auto_graded: false, is_overridden: false, comment: null },
    ],
  },
];
