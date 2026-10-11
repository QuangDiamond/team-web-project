import mongoose from 'mongoose';
const { Schema } = mongoose;

const postSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
  }, { timestamps: true }
);

export const Post = mongoose.model('Post', postSchema);
