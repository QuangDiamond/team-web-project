import mongoose from 'mongoose';
const { Schema } = mongoose;

const worksheetSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String },
    coveredContent: { type: String },
    assignedDate: { type: Date },
    description: { type: String },
    imageLinks: [String],
    link: { type: String },
  }, { timestamps: true }
);

export const Worksheet = mongoose.model('Worksheet', worksheetSchema);
