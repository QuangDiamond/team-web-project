import mongoose from 'mongoose';
const { Schema } = mongoose;

const solutionSchema = new Schema(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
  }, { timestamps: true }
);

export const Solution = mongoose.model('Solution', solutionSchema);
