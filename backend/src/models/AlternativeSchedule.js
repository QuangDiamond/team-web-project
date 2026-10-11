import mongoose from 'mongoose';
const { Schema } = mongoose;

const alternativeScheduleSchema = new Schema(
  {
    scheduleChangeRequestId: { type: Schema.Types.ObjectId, ref: 'ScheduleChangeRequest', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isChosen: { type: Boolean, default: false },
  }
);

export const AlternativeSchedule = mongoose.model('AlternativeSchedule', alternativeScheduleSchema);
