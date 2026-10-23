// Quy tắc lặp lịch học (các thứ trong tuần, giờ bắt đầu, thời lượng, ngày kết thúc), dùng để sinh các
// buổi học định kỳ (UC28)
import mongoose from 'mongoose';
const { Schema } = mongoose;

const recurringRuleSchema = new Schema(
  {
    // Liên kết lớp học
    class_id:         { type: Schema.Types.ObjectId, ref: 'Classroom', default: null },
    // Các ngày học trong tuần (vd: ['MON', 'WED'])
    days_of_week:     { type: [String], default: null },
    // Giờ bắt đầu cố định
    start_time:       { type: String, default: null },
    // Thời lượng buổi học (phút)
    duration_minutes: { type: Schema.Types.Int32, default: null },
    // Ngày kết thúc lặp lịch
    end_date:         { type: Date, default: null },
  },
  {
    collection: 'RECURRING_RULES',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    toJSON: { getters: true },
  }
);

export const RecurringRule = mongoose.model('RecurringRule', recurringRuleSchema);
