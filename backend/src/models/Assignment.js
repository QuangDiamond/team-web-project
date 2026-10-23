// Bài tập của lớp (tạo bằng AI hoặc thủ công), hạn nộp, quy định nộp muộn / nộp lại, thời điểm công bố
// bài và kết quả (UC26, BR-15, BR-17)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
import { assignmentQuestionSchema } from './schemas/AssignmentQuestion.schema.js';
import { assignmentAttachmentSchema } from './schemas/AssignmentAttachment.schema.js';
const { Schema } = mongoose;

const assignmentSchema = new Schema(
  {
    // Liên kết lớp học
    class_id:              { type: Schema.Types.ObjectId, ref: 'Classroom', default: null },
    // Gia sư tạo bài tập
    creator_profile_id:    { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Tiêu đề bài tập
    title:                 { type: String, default: null },
    // Hướng dẫn làm bài (Rich text)
    instructions:          { type: String, default: null },
    // Cờ nhận biết bài tập tạo từ AI
    is_ai_generated:       { type: Boolean, default: null },
    status:                { type: String, enum: Object.values(ENUMS.AssignmentsStatus), default: null },
    // Hạn nộp bài (Deadline)
    due_date:              { type: Date, default: null },
    // Chính sách nộp trễ
    allow_late_submission: { type: Boolean, default: null },
    // Chính sách nộp lại bài
    allow_resubmission:    { type: Boolean, default: null },
    // Tổng điểm bài tập
    total_points:          { type: Schema.Types.Int32, default: null },
    // Timestamp xuất bản bài tập
    published_at:          { type: Date, default: null },
    // Timestamp công bố điểm
    results_published_at:  { type: Date, default: null },
    // EMBED từ bảng ASSIGNMENT_QUESTIONS: luôn đọc cùng bài tập; giữ _id để SUBMISSION_ANSWERS tham chiếu
    questions:             { type: [assignmentQuestionSchema], default: [] },
    // EMBED từ bảng ASSIGNMENT_ATTACHMENTS: chỉ là danh sách material_id đính kèm bài tập
    attachments:           { type: [assignmentAttachmentSchema], default: [] },
  },
  {
    collection: 'ASSIGNMENTS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
assignmentSchema.index({ class_id: 1, status: 1 });

export const Assignment = mongoose.model('Assignment', assignmentSchema);
