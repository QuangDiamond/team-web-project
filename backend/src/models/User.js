import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    role: { type: String },
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    isValidated: { type: Boolean, default: false },
    managerId: { type: Schema.Types.ObjectId, ref: 'User' },
  }
);

export const User = mongoose.model('User', userSchema);
