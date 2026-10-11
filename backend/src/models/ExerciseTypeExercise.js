import mongoose from 'mongoose';
const { Schema } = mongoose;

const exerciseTypeExerciseSchema = new Schema(
  {
    typeId: { type: Schema.Types.ObjectId, ref: 'ExerciseType', required: true },
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
  }
);

export const ExerciseTypeExercise = mongoose.model('ExerciseTypeExercise', exerciseTypeExerciseSchema);
