import mongoose from 'mongoose';

const gradeLevelSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 50 },
  sort_order: { type: mongoose.Schema.Types.Int32, default: 0 },
  is_active: { type: Boolean, default: true },
}, { collection: 'GRADE_LEVELS', versionKey: false, strict: 'throw', autoIndex: false });

gradeLevelSchema.index({ name: 1 }, { unique: true });
export const GradeLevel = mongoose.model('GradeLevel', gradeLevelSchema);
