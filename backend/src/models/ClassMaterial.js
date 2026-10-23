// Tài liệu học tập của lớp (file, video, link), kèm chủ đề và phạm vi hiển thị (UC25, BR-16)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const classMaterialSchema = new Schema(
  {
    // Liên kết lớp học
    class_id:            { type: Schema.Types.ObjectId, ref: 'Classroom', default: null },
    // Chủ đề phân loại; trỏ tới _id của subdocument MaterialTopic, không phải collection nên không có ref
    topic_id:            { type: Schema.Types.ObjectId, default: null },
    // Profile gia sư tải lên
    uploader_profile_id: { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Tiêu đề tài liệu
    title:               { type: String, default: null },
    material_type:       { type: String, enum: Object.values(ENUMS.ClassMaterialsMaterialType), default: null },
    // URL lưu trữ file hoặc liên kết ngoài
    file_url:            { type: String, default: null },
    // Dung lượng file (bytes)
    file_size:           { type: Schema.Types.Int32, default: null },
    visibility:          { type: String, enum: Object.values(ENUMS.ClassMaterialsVisibility), default: null },
  },
  {
    collection: 'CLASS_MATERIALS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
classMaterialSchema.index({ class_id: 1, topic_id: 1 });

export const ClassMaterial = mongoose.model('ClassMaterial', classMaterialSchema);
