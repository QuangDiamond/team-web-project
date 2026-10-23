// Subdocument nhúng trong CLASS_SESSIONS.attendance (mảng). Bảng gốc: SESSION_ATTENDANCE. Lý do embed:
// số lượng giới hạn theo sĩ số lớp, ghi cùng buổi học
import mongoose from 'mongoose';
import { ENUMS } from '../enums.js';
const { Schema } = mongoose;

export const sessionAttendanceSchema = new Schema(
  {
    // Học sinh được điểm danh
    student_user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status:          { type: String, enum: Object.values(ENUMS.SessionAttendanceStatus), default: null },
    // Ghi chú điểm danh
    comment:         { type: String, default: null },
    // Timestamp thực hiện điểm danh
    marked_at:       { type: Date, default: null },
  },
  { _id: false }
);
