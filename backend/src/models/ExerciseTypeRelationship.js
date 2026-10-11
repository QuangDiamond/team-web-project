import mongoose from 'mongoose';
const { Schema } = mongoose;

const exerciseTypeRelationshipSchema = new Schema(
  {
    typeId: { type: Schema.Types.ObjectId, ref: 'ExerciseType', required: true },
    relatedTypeId: { type: Schema.Types.ObjectId, ref: 'ExerciseType', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    relationshipNature: { type: String },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
  }
);

export const ExerciseTypeRelationship = mongoose.model('ExerciseTypeRelationship', exerciseTypeRelationshipSchema);
