// Kết quả AI gợi ý gia sư phù hợp cho một yêu cầu của phụ huynh, gồm điểm phù hợp và lý do; được cache
// để không gọi AI lại liên tục (UC09)
import mongoose from 'mongoose';
const { Schema } = mongoose;

const aiSuggestionSchema = new Schema(
  {
    // Tham chiếu đến yêu cầu tìm gia sư của phụ huynh để gắn kết kết quả gợi ý
    request_id:       { type: Schema.Types.ObjectId, ref: 'ParentRequest', default: null },
    // Lưu bài đăng gia sư được AI ghép nối phù hợp
    tutor_post_id:    { type: Schema.Types.ObjectId, ref: 'TutorPost', default: null },
    // Lưu profile gia sư tương ứng được đề xuất
    tutor_profile_id: { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Lý do lưu trữ: Lưu trữ điểm phần trăm tương thích (match_score) đã được tính toán sẵn để hiển thị ngay lập tức…
    match_score:      { type: Schema.Types.Double, default: null },
    // Lý do lưu trữ: Lưu văn bản giải thích ngắn gọn do AI sinh ra (ví dụ: lý do hợp môn, hợp giờ) giúp phụ huynh…
    ai_reason:        { type: String, default: null },
    // Lý do lưu trữ: Lưu trữ trọn gói các trọng số ưu tiên thời điểm đó (Học phí, Đánh giá, Khoảng cách...) phục vụ…
    weights_json:     { type: Schema.Types.Mixed, default: null },
    // Lý do lưu trữ: Đặt thời gian hết hạn cache (ví dụ: 24 giờ) để tránh việc cứ mỗi lần phụ huynh mở app là lại…
    cached_until:     { type: Date, default: null },
  },
  {
    collection: 'AI_SUGGESTIONS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
aiSuggestionSchema.index({ cached_until: 1 }, { expireAfterSeconds: 0 });
aiSuggestionSchema.index({ request_id: 1 });

export const AiSuggestion = mongoose.model('AiSuggestion', aiSuggestionSchema);
