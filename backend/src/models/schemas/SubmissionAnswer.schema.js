// Subdocument nhúng trong ASSIGNMENT_SUBMISSIONS.answers (mảng). Bảng gốc: SUBMISSION_ANSWERS. Lý do
// embed: luôn đọc/chấm cùng bài nộp
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const submissionAnswerSchema = new Schema(
  {
    // Liên kết câu hỏi; trỏ tới _id của subdocument AssignmentQuestion, không phải collection nên không có ref
    question_id:    { type: Schema.Types.ObjectId, default: null },
    // Nội dung câu trả lời (MCQ / Tự luận)
    text_response:  { type: String, default: null },
    // URL file tải lên cho câu FILE_UPLOAD
    file_url:       { type: String, default: null },
    // Dung lượng file bài làm (bytes)
    file_size:      { type: Schema.Types.Int32, default: null },
    // Điểm số đạt được cho câu hỏi
    score:          { type: Schema.Types.Double, default: null },
    // Cờ chấm tự động
    is_auto_graded: { type: Boolean, default: null },
    // Cờ gia sư ghi đè điểm tự động
    is_overridden:  { type: Boolean, default: null },
    // Nhận xét từng câu của gia sư
    comment:        { type: String, default: null },
  },
  { _id: false }
);
