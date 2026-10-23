// Bộ lọc tìm kiếm gia sư được phụ huynh lưu lại để dùng lại và nhận thông báo khi có gia sư mới phù
// hợp (UC06 A2)
import mongoose from 'mongoose';
const { Schema } = mongoose;

const savedSearchSchema = new Schema(
  {
    // Liên kết đến tài khoản phụ huynh thực hiện lưu
    user_id:              { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Tên gợi nhớ cho bộ lọc
    search_name:          { type: String, default: null },
    // Chứa toàn bộ tùy chọn lọc
    filter_criteria_json: { type: String, default: null },
  },
  {
    collection: 'SAVED_SEARCHES',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { getters: true },
  }
);

export const SavedSearch = mongoose.model('SavedSearch', savedSearchSchema);
