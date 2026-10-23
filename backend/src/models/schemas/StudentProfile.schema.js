// Subdocument nhúng trong User.student_profile (object). Bảng gốc: STUDENTS. Lý do embed: 1-1 với User
// (role STUDENT); quan hệ phụ huynh lấy từ PARENT_CHILD_LINKS
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const studentProfileSchema = new Schema(
  {
    // tên của học sinh
    full_name:   { type: String, default: null },
    // lớp học sinh đang học
    grade_level: { type: String, default: null },
  },
  { _id: false }
);
