// Kết quả AI gợi ý các yêu cầu phù hợp với hồ sơ gia sư (mục "Suggested for you"), gồm điểm phù hợp và
// lý do; có cache (UC13)
import mongoose from 'mongoose';
const { Schema } = mongoose;

const aiPostSuggestionSchema = new Schema(
  {
    // Profile gia sư nhận gợi ý
    tutor_profile_id: { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Bài đăng yêu cầu được AI đề xuất
    request_id:       { type: Schema.Types.ObjectId, ref: 'ParentRequest', default: null },
    // Điểm % tương thích để sắp xếp danh sách
    match_score:      { type: Schema.Types.Double, default: null },
    // Lý do AI gợi ý bài này
    ai_reason:        { type: String, default: null },
    // Thời hạn lưu cache tránh gọi API AI quá nhiều
    cached_until:     { type: Date, default: null },
  },
  {
    collection: 'AI_POST_SUGGESTIONS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
aiPostSuggestionSchema.index({ cached_until: 1 }, { expireAfterSeconds: 0 });
aiPostSuggestionSchema.index({ tutor_profile_id: 1 });

export const AiPostSuggestion = mongoose.model('AiPostSuggestion', aiPostSuggestionSchema);
