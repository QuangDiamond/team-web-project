// Subdocument nhúng trong MESSAGES.attachments (mảng). Bảng gốc: MESSAGE_ATTACHMENTS. Lý do embed:
// luôn hiển thị cùng tin nhắn
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const messageAttachmentSchema = new Schema(
  {
    // URL lưu trữ file trên Cloud Storage
    file_url:  { type: String, default: null },
    // Tên file gốc
    file_name: { type: String, default: null },
    // Dung lượng file (bytes)
    file_size: { type: Schema.Types.Int32, default: null },
    // Định dạng MIME của file
    mime_type: { type: String, default: null },
  },
  { _id: false }
);
