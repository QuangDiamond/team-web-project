// Đánh giá và nhận xét của phụ huynh về gia sư sau khi kết nối được xác nhận, kèm điểm thành phần,
// phản hồi của gia sư và trạng thái kiểm duyệt. Mỗi kết nối chỉ đánh giá 1 lần (UC38)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    // Hồ sơ gia sư đang nhận đánh giá
    tutor_profile_id:     { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Điểm số đánh giá sao
    rating:               { type: Schema.Types.Int32, default: null },
    // Nội dung bình luận
    comment:              { type: String, default: null },
    // Liên kết kết nối CONFIRMED
    agreement_id:         { type: Schema.Types.ObjectId, ref: 'TutoringAgreement', default: null },
    // Tham chiếu USERS phụ huynh
    parent_user_id:       { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Đánh giá kiến thức (1 - 5 sao)
    knowledge_rating:     { type: Schema.Types.Int32, default: null },
    // Đánh giá đúng giờ (1 - 5 sao)
    punctuality_rating:   { type: Schema.Types.Int32, default: null },
    // Đánh giá giao tiếp (1 - 5 sao)
    communication_rating: { type: Schema.Types.Int32, default: null },
    // Phản hồi công khai của gia sư
    tutor_reply:          { type: String, default: null },
    // Timestamp gia sư phản hồi
    replied_at:           { type: Date, default: null },
    status:               { type: String, enum: Object.values(ENUMS.ReviewsStatus), default: null },
  },
  {
    collection: 'REVIEWS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
reviewSchema.index({ agreement_id: 1 }, { unique: true, partialFilterExpression: { agreement_id: { $type: 'objectId' } } });
reviewSchema.index({ tutor_profile_id: 1, created_at: -1 });

export const Review = mongoose.model('Review', reviewSchema);
