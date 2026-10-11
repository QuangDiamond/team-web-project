import mongoose from 'mongoose';
const { Schema } = mongoose;

const exerciseTypeSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
  }
);

export const ExerciseType = mongoose.model('ExerciseType', exerciseTypeSchema);
