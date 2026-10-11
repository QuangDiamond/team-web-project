import mongoose from 'mongoose';
const { Schema } = mongoose;

const slotSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    slotNo: { type: Number, required: true, unique: true },
  }
);

export const Slot = mongoose.model('Slot', slotSchema);
