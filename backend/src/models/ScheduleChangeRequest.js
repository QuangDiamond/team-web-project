import mongoose from 'mongoose';
const { Schema } = mongoose;

const scheduleChangeRequestSchema = new Schema(
  {
    slotId: { type: Schema.Types.ObjectId, ref: 'Slot', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
  }
);

export const ScheduleChangeRequest = mongoose.model('ScheduleChangeRequest', scheduleChangeRequestSchema);
