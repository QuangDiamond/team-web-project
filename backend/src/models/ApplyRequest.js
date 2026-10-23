// Đơn ứng tuyển của gia sư vào yêu cầu của phụ huynh, kèm lời nhắn và điểm phù hợp; phụ huynh chọn
// Continue hoặc Skip (UC14, UC15)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const applyRequestSchema = new Schema(
  {
    // Tham chiếu bài yêu cầu của phụ huynh
    request_id:       { type: Schema.Types.ObjectId, ref: 'ParentRequest', default: null },
    // Tutor who ứng tuyển (Profile gia sư ứng tuyển/bày tỏ quan tâm)
    tutor_profile_id: { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Lời nhắn / Lời giới thiệu ngắn từ gia sư (Introductory note from tutor)
    note:             { type: String, default: null },
    // Điểm số tương thích tính toán cho màn hình SC17
    match_score:      { type: Schema.Types.Double, default: null },
    // Trạng thái ứng tuyển: PENDING - chờ phụ huynh rep CONTINUED - phụ huynh accept -> mở conversation SKIPPED…
    status:           { type: String, enum: Object.values(ENUMS.ApplyRequestsStatus), default: null },
  },
  {
    collection: 'APPLY_REQUESTS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
applyRequestSchema.index({ request_id: 1, tutor_profile_id: 1 }, { unique: true });
applyRequestSchema.index({ tutor_profile_id: 1, created_at: -1 });

export const ApplyRequest = mongoose.model('ApplyRequest', applyRequestSchema);
