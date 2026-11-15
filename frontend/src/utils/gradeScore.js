// Ô điểm khi chấm bài chỉ nhận 0..maxPoints: số âm hoặc vượt điểm tối đa thì giữ giá trị cũ.
// Cho phép ô trống để gia sư xóa rồi gõ lại
export const limitScoreInput = (rawValue, maxPoints, previousValue) => {
  if (rawValue === '') {
    return '';
  }
  const score = Number(rawValue);
  if (Number.isNaN(score) || score < 0 || score > maxPoints) {
    return previousValue;
  }
  return rawValue;
};

// Điểm tối đa của một câu: theo bài tập, câu chưa đặt điểm tính 1 điểm (khớp backend)
export const getQuestionMaxPoints = (question) => {
  if (question && question.points) {
    return question.points;
  }
  return 1;
};
