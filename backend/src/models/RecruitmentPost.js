import mongoose from 'mongoose';
const { Schema } = mongoose;

const recruitmentPostSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
  }, { timestamps: true }
);

export const RecruitmentPost = mongoose.model('RecruitmentPost', recruitmentPostSchema);
