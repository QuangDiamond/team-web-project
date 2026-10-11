import mongoose from 'mongoose';
const { Schema } = mongoose;

const joinClassInvitationSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String },
    tutorEmail: { type: String },
  }, { timestamps: true }
);

export const JoinClassInvitation = mongoose.model('JoinClassInvitation', joinClassInvitationSchema);
