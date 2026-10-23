// Các yêu cầu của phụ huynh được gia sư lưu lại để xem sau (UC13 A1)
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bookmarkedRequestSchema = new Schema(
  {
    // Profile gia sư thực hiện bookmark - A1
    tutor_profile_id: { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Bài yêu cầu được gia sư lưu lại - A1
    request_id:       { type: Schema.Types.ObjectId, ref: 'ParentRequest', default: null },
  },
  {
    collection: 'BOOKMARKED_REQUESTS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
bookmarkedRequestSchema.index({ tutor_profile_id: 1, request_id: 1 }, { unique: true });

export const BookmarkedRequest = mongoose.model('BookmarkedRequest', bookmarkedRequestSchema);
