// Yêu cầu đổi / hủy buổi học do học sinh hoặc phụ huynh gửi và phản hồi duyệt / từ chối của gia sư
// (UC29, UC30)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const scheduleChangeRequestSchema = new Schema(
  {
    // Buổi học cần dời/hủy
    session_id:          { type: Schema.Types.ObjectId, ref: 'ClassSession', default: null },
    // Người gửi yêu cầu
    requester_user_id:   { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Người phản hồi yêu cầu
    responder_user_id:   { type: Schema.Types.ObjectId, ref: 'User', default: null },
    request_type:        { type: String, enum: Object.values(ENUMS.ScheduleChangeRequestsRequestType), default: null },
    // Giờ bắt đầu đề xuất
    proposed_start_time: { type: Date, default: null },
    // Giờ kết thúc đề xuất
    proposed_end_time:   { type: Date, default: null },
    // Lý do xin đổi/hủy lịch
    reason:              { type: String, default: null },
    // PENDING, - chờ rep APPROVED, - đã đc accept REJECTED, - đã bị từ chối WITHDRAWN
    status:              { type: String, enum: Object.values(ENUMS.ScheduleChangeRequestsStatus), default: null },
    // Ghi chú/Lý do từ chối
    response_comment:    { type: String, default: null },
    // Timestamp phản hồi
    responded_at:        { type: Date, default: null },
  },
  {
    collection: 'SCHEDULE_CHANGE_REQUESTS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
scheduleChangeRequestSchema.index({ session_id: 1, status: 1 });

export const ScheduleChangeRequest = mongoose.model('ScheduleChangeRequest', scheduleChangeRequestSchema);
