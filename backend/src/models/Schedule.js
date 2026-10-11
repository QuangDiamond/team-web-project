import mongoose from 'mongoose';
const { Schema } = mongoose;

const scheduleSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    content: { type: String },
  }
);

export const Schedule = mongoose.model('Schedule', scheduleSchema);
