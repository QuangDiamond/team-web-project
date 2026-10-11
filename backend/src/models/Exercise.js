import mongoose from 'mongoose';
const { Schema } = mongoose;

const exerciseSchema = new Schema(
  {
    worksheetId: { type: Schema.Types.ObjectId, ref: 'Worksheet', required: true },
  }
);

export const Exercise = mongoose.model('Exercise', exerciseSchema);
