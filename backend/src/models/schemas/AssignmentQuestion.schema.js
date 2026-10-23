// Subdocument nhúng trong ASSIGNMENTS.questions (mảng). Bảng gốc: ASSIGNMENT_QUESTIONS. Lý do embed:
// luôn đọc cùng bài tập; giữ _id để SUBMISSION_ANSWERS tham chiếu
// Giữ _id vì nơi khác tham chiếu tới từng phần tử.
import mongoose from 'mongoose';
import { ENUMS } from '../enums.js';
const { Schema } = mongoose;

export const assignmentQuestionSchema = new Schema(
  {
    // Thứ tự câu hỏi
    question_number: { type: Schema.Types.Int32, default: null },
    question_type:   { type: String, enum: Object.values(ENUMS.AssignmentQuestionsQuestionType), default: null },
    // Nội dung đề bài / câu hỏi
    content:         { type: String, default: null },
    // Các lựa chọn cho câu trắc nghiệm
    options:         { type: [String], default: null },
    // Đáp án đúng cho câu trắc nghiệm
    correct_answer:  { type: String, default: null },
    // Điểm của câu hỏi
    points:          { type: Schema.Types.Int32, default: null },
  },
  { _id: true }
);
