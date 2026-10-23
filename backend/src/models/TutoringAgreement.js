// Kết nối giữa phụ huynh và gia sư sau khi mở chat, lưu thỏa thuận (môn, lịch, học phí) và trạng thái
// xác nhận "Agreed" của hai bên. Là điều kiện để đánh giá và tạo lớp (UC18, UC21, UC38)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const decimalToString = (v) => (v == null ? v : v.toString());

const tutoringAgreementSchema = new Schema(
  {
    // Associated conversation => tham chiếu đến request_id
    conversation_id:     { type: Schema.Types.ObjectId, ref: 'Conversation', default: null },
    // Tham chiếu user_id trong USERS
    proposer_user_id:    { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Tutor profile participant
    accepted_by_user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Subject agreed in chat (Optional step 1)
    agreed_subject:      { type: String, default: null },
    // Schedule agreed in chat (Optional step 1)
    agreed_schedule:     { type: String, default: null },
    // Price agreed in chat (Optional step 1)
    agreed_price:        { type: Schema.Types.Decimal128, default: null, get: decimalToString },
    // DRAFT - nháp PENDING, - chờ bên kia chấp thuận. CONFIRMED, - được bên kia chấp thuận REJECTED = bên được đề…
    status:              { type: String, enum: Object.values(ENUMS.TutoringAgreementsStatus), default: null },
  },
  {
    collection: 'TUTORING_AGREEMENTS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

export const TutoringAgreement = mongoose.model('TutoringAgreement', tutoringAgreementSchema);
