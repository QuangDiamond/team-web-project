import mongoose from 'mongoose';
const { Schema } = mongoose;

const applicationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'RecruitmentPost', required: true },
  }
);

applicationSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const Application = mongoose.model('Application', applicationSchema);
