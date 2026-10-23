// Subdocument nhúng trong ASSIGNMENTS.attachments (mảng). Bảng gốc: ASSIGNMENT_ATTACHMENTS. Lý do
// embed: chỉ là danh sách material_id đính kèm bài tập
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const assignmentAttachmentSchema = new Schema(
  {
    // Liên kết tài liệu đính kèm
    material_id: { type: Schema.Types.ObjectId, ref: 'ClassMaterial', default: null },
  },
  { _id: false }
);
