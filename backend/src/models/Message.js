import mongoose from 'mongoose';
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['SENT', 'SEEN'], default: 'SENT' },
  }, { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);
