// Bài làm của học sinh cho một bài tập: lần nộp, trạng thái, điểm tạm tính (tự chấm trắc nghiệm), điểm
// cuối và nhận xét của gia sư (UC26, UC27)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
import { submissionAnswerSchema } from './schemas/SubmissionAnswer.schema.js';
const { Schema } = mongoose;

const assignmentSubmissionSchema = new Schema(
  {
    // Liên kết bài tập
    assignment_id:     { type: Schema.Types.ObjectId, ref: 'Assignment', default: null },
    // Học sinh thực hiện nộp bài
    student_user_id:   { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Số lần nộp / Phiên bản
    attempt_number:    { type: Schema.Types.Int32, default: null },
    status:            { type: String, enum: Object.values(ENUMS.AssignmentSubmissionsStatus), default: null },
    timeliness:        { type: String, enum: Object.values(ENUMS.AssignmentSubmissionsTimeliness), default: null },
    // Điểm tạm tính (Tự động chấm MCQ)
    provisional_score: { type: Schema.Types.Double, default: null },
    // Điểm số chính thức
    final_score:       { type: Schema.Types.Double, default: null },
    // Nhận xét tổng quan của gia sư
    overall_feedback:  { type: String, default: null },
    // Timestamp nộp bài
    submitted_at:      { type: Date, default: null },
    // Timestamp chấm điểm
    graded_at:         { type: Date, default: null },
    // EMBED từ bảng SUBMISSION_ANSWERS: luôn đọc/chấm cùng bài nộp
    answers:           { type: [submissionAnswerSchema], default: [] },
  },
  {
    collection: 'ASSIGNMENT_SUBMISSIONS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
assignmentSubmissionSchema.index({ assignment_id: 1, student_user_id: 1, attempt_number: -1 });

export const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
