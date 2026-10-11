import mongoose from 'mongoose';
const { Schema } = mongoose;

const classSchema = new Schema(
  {
    managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
  }
);

export const Class = mongoose.model('Class', classSchema);
