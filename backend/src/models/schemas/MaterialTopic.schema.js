// Subdocument nhúng trong CLASSROOMS.topics (mảng). Bảng gốc: MATERIAL_TOPICS. Lý do embed: ít thư mục
// mỗi lớp; giữ _id để CLASS_MATERIALS.topic_id tham chiếu
// Giữ _id vì nơi khác tham chiếu tới từng phần tử.
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const materialTopicSchema = new Schema(
  {
    // Tên thư mục tài liệu (vd: Chapter 1)
    name:       { type: String, default: null },
    // Timestamp tạo thư mục
    created_at: { type: Date, default: null },
  },
  { _id: true }
);
