// Lớp học trực tuyến do gia sư tạo, có mã tham gia và link mời; có thể tạo từ một kết nối đã xác nhận
// (UC21, UC22, BR-12)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
import { materialTopicSchema } from './schemas/MaterialTopic.schema.js';
const { Schema } = mongoose;

const classroomSchema = new Schema(
  {
    // Gia sư sở hữu lớp (Owner Tutor)
    tutor_profile_id: { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Liên kết kết nối đã xác nhận (UC18)
    agreement_id:     { type: Schema.Types.ObjectId, ref: 'TutoringAgreement', default: null },
    // Tên lớp học
    name:             { type: String, default: null },
    // Môn học giảng dạy
    subject:          { type: String, default: null },
    // Khối / Lớp học
    grade:            { type: String, default: null },
    // Mô tả lớp học
    description:      { type: String, default: null },
    // Sức chứa tối đa của lớp
    capacity:         { type: Schema.Types.Int32, default: null },
    // Mã tham gia lớp độc nhất
    join_code:        { type: String, default: null },
    // Đường dẫn mời tham gia lớp độc nhất
    invite_link:      { type: String, default: null },
    status:           { type: String, enum: Object.values(ENUMS.ClassroomsStatus), default: null },
    // EMBED từ bảng MATERIAL_TOPICS: ít thư mục mỗi lớp; giữ _id để CLASS_MATERIALS.topic_id tham chiếu
    topics:           { type: [materialTopicSchema], default: [] },
  },
  {
    collection: 'CLASSROOMS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
classroomSchema.index({ join_code: 1 }, { unique: true, partialFilterExpression: { join_code: { $type: 'string' } } });
classroomSchema.index({ invite_link: 1 }, { unique: true, partialFilterExpression: { invite_link: { $type: 'string' } } });
classroomSchema.index({ tutor_profile_id: 1 });

export const Classroom = mongoose.model('Classroom', classroomSchema);
