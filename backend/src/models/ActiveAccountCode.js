import mongoose from 'mongoose';
const { Schema } = mongoose;

const activeAccountCodeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    validateCode: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiredAt: { type: Date, required: true },
  }
);

export const ActiveAccountCode = mongoose.model('ActiveAccountCode', activeAccountCodeSchema);
