// Từng buổi học cụ thể của lớp: thời gian, link học online, trạng thái; sinh từ quy tắc lặp hoặc tạo
// lẻ (UC28, UC32, BR-14)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
import { sessionAttendanceSchema } from './schemas/SessionAttendance.schema.js';
const { Schema } = mongoose;

const classSessionSchema = new Schema(
  {
    // Liên kết lớp học
    class_id:         { type: Schema.Types.ObjectId, ref: 'Classroom', default: null },
    // Gia sư giảng dạy
    tutor_profile_id: { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Liên kết quy tắc lặp
    rule_id:          { type: Schema.Types.ObjectId, ref: 'RecurringRule', default: null },
    // Tiêu đề / Chủ đề buổi học
    title:            { type: String, default: null },
    // Thời gian bắt đầu buổi học
    start_time:       { type: Date, default: null },
    // Thời gian kết thúc buổi học
    end_time:         { type: Date, default: null },
    // Link học online hoặc địa điểm
    meeting_link:     { type: String, default: null },
    // SCHEDULED, đã lên lịch CANCELLED, - đã hủy COMPLETED
    status:           { type: String, enum: Object.values(ENUMS.ClassSessionsStatus), default: null },
    // EMBED từ bảng SESSION_ATTENDANCE: số lượng giới hạn theo sĩ số lớp, ghi cùng buổi học
    attendance:       { type: [sessionAttendanceSchema], default: [] },
  },
  {
    collection: 'CLASS_SESSIONS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
classSessionSchema.index({ class_id: 1, start_time: 1 });
classSessionSchema.index({ tutor_profile_id: 1, start_time: 1 });

export const ClassSession = mongoose.model('ClassSession', classSessionSchema);
