import mongoose from 'mongoose';
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    solutionId: { type: Schema.Types.ObjectId, ref: 'Solution', required: true },
    comment: { type: String },
    review: { type: String },
    score: { type: Number },
  }
);

export const Review = mongoose.model('Review', reviewSchema);
