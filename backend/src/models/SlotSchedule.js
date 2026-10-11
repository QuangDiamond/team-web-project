import mongoose from 'mongoose';
const { Schema } = mongoose;

const slotScheduleSchema = new Schema(
  {
    slotId: { type: Schema.Types.ObjectId, ref: 'Slot', required: true, unique: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
  }
);

export const SlotSchedule = mongoose.model('SlotSchedule', slotScheduleSchema);
