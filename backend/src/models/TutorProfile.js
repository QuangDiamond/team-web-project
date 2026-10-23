// Hồ sơ công khai của gia sư (kiểu LinkedIn): giới thiệu, địa chỉ, trạng thái hoàn thiện, sẵn sàng
// nhận lớp và điểm đánh giá trung bình. Quan hệ 1-1 với User (UC05, UC06, UC07)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
import { experienceSchema } from './schemas/Experience.schema.js';
import { achievementSchema } from './schemas/Achievement.schema.js';
import { educationSchema } from './schemas/Education.schema.js';
const { Schema } = mongoose;

const tutorProfileSchema = new Schema(
  {
    // Khóa ngoại liên kết 1-1 với bảng USERS. Mỗi tài khoản tương ứng với đúng 1 hồ sơ chi tiết
    user_id:             { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Câu châm ngôn, chức danh ngắn gọn hiển thị ngay dưới tên (Ví dụ: *"Senior Software Engineer
    headline:            { type: String, default: null },
    // Đoạn giới thiệu bản thân chi tiết hơn về kinh nghiệm, phương pháp giảng dạy hoặc sở thích cá nhân
    bio:                 { type: String, default: null },
    // Lưu đường dẫn (URL) trỏ đến file ảnh đại diện của người dùng trên Cloud storage
    avatar_url:          { type: String, default: null },
    // Lưu đường dẫn (URL) trỏ đến ảnh bìa (banner) trang trí đầu trang cá nhân
    cover_url:           { type: String, default: null },
    // Địa chỉ của người dùng/tutor (hỗ trợ cho học viên tìm kiếm gia sư theo khu vực địa lý)
    address:             { type: String, default: null },
    // Cờ ẩn/hiện địa chỉ cá nhân nhằm bảo mật thông tin riêng tư theo mong muốn của chủ profile
    is_address_hidden:   { type: Boolean, default: false },
    // Trạng thái hoàn thiện hồ sơ: Bắt buộc lưu để ép buộc user/tutor khi đăng nhập lần đầu phải hoàn thành nốt các…
    is_complete:         { type: Boolean, default: false },
    // Trường để xem dạo này gia sư còn sử dụng hệ thống ko ?& snawx sàng nhận lớp ko vd 1 tháng gần nhất, hoặc tự…
    availability_status: { type: String, enum: Object.values(ENUMS.TutorProfilesAvailabilityStatus), default: null },
    // average rating của gia sư, tính lại khi có review mới || ngày mới, check có review mới nào ko ? => update
    average_rating:      { type: Schema.Types.Double, default: null },
    // EMBED từ bảng EXPERIENCES: luôn đọc cùng hồ sơ gia sư, số lượng ít
    experiences:         { type: [experienceSchema], default: [] },
    // EMBED từ bảng ACHIEVEMENTS: luôn đọc cùng hồ sơ gia sư, số lượng ít
    achievements:        { type: [achievementSchema], default: [] },
    // EMBED từ bảng EDUCATIONS: luôn đọc cùng hồ sơ gia sư, số lượng ít
    educations:          { type: [educationSchema], default: [] },
  },
  {
    collection: 'TUTOR_PROFILES',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
tutorProfileSchema.index({ user_id: 1 }, { unique: true, partialFilterExpression: { user_id: { $type: 'objectId' } } });
tutorProfileSchema.index({ availability_status: 1, average_rating: -1 });

export const TutorProfile = mongoose.model('TutorProfile', tutorProfileSchema);
