# Task: Tạo Mongoose schema cho database TuConnector

> File này dùng để đưa cho Claude Code (VS Code). Cách dùng: đặt file này cùng
> `tuconnector_erd_3_mongo_embedded.dbml` và `init_tuconnector.js` vào thư mục `docs/db/`
> (ở gốc repo `team-web-project/`), rồi nhắn Claude: **"Đọc docs/db/CLAUDE_TASK_mongoose_models.md và làm theo."**

## 1. Mục tiêu
Tạo các file model Mongoose (`mongoose.Schema` + `mongoose.model`) trong thư mục **`backend/src/models/`**,
**mỗi collection một file**, khớp 100% với database đã tạo trên MongoDB Atlas.

Repo hiện tại (đã biết trước):
- Backend dùng **ES Modules** (`import` / `export`), không dùng `require`.
- Model export theo kiểu **named export**: `export const User = mongoose.model('User', userSchema);`
- `backend/src/models/` đã có `index.js`, `README.md`, `.gitkeep` và một file `User.js` **mẫu** (field `username`, `isValidated`, `managerId`... không thuộc schema TuConnector). File `User.js` mẫu này được phép **ghi đè** bằng schema thật.

## 2. Nguồn sự thật (đọc trước khi code)
| File | Dùng để |
|---|---|
| `docs/db/tuconnector_erd_3_mongo_embedded.dbml` | Danh sách collection, field, kiểu, `not null`, `null`, `default`, `unique`, enum, ref, ghi chú |
| `docs/db/init_tuconnector.js` | `$jsonSchema` validator đang chạy trên Atlas + toàn bộ index (unique, compound, TTL, partial) |

Quy ước trong DBML:
- `Table X` = 1 collection tên đúng là `X` (giữ nguyên chữ hoa, vd `PAYMENT_ORDERS`, `User`).
- `Table emb_X` = **subdocument nhúng**, KHÔNG phải collection. Field cha có kiểu `"Array<emb_X>"` (mảng) hoặc `"Object<emb_X>"` (object).
- `Ref: A.f > B._id` = field `f` của A tham chiếu `_id` của B.
- Nếu DBML và `init_tuconnector.js` lệch nhau → **dừng lại và hỏi**, không tự đoán.

## 3. Trước khi viết code
1. Đọc `backend/package.json`: xác nhận ESM (`"type": "module"`), phiên bản **mongoose**. Nếu chưa cài mongoose thì hỏi trước khi cài.
2. Đọc `backend/src/models/README.md` và `backend/src/models/index.js`: nếu có quy ước riêng của team (đặt tên, cách export) thì **ưu tiên quy ước đó**, phần nào mâu thuẫn với tài liệu này thì hỏi.
3. Không đụng tới thư mục khác (`controllers`, `repositories`, `services`, `routes`...).
4. Kiểm tra phiên bản mongoose đang cài có hỗ trợ `Schema.Types.Int32` và `Schema.Types.Double` không (xem docs/changelog của đúng version đó). Ghi kết quả vào phần báo cáo cuối.

## 4. Cấu trúc thư mục
```
backend/src/models/
  enums.js                 # mọi enum, export dạng object hằng
  schemas/                 # sub-schema cho subdocument nhúng (emb_*)
    GoogleAccount.schema.js
    ...
  User.js                  # ghi đè file mẫu
  TutorProfile.js
  PaymentOrder.js
  ...
  index.js                 # re-export tất cả model: export { User } from './User.js'; ...
  README.md                # cập nhật: danh sách model ↔ collection
```
Import trong ESM phải ghi **đuôi `.js`** (vd `import { ENUMS } from './enums.js'`).

## 5. Tên model và tên collection
- Tên file / tên model: **PascalCase, số ít** (bảng dưới). Tên collection: **giữ nguyên như DBML**, khai báo bằng option `collection`, vì Mongoose mặc định sẽ tự đổi sang chữ thường số nhiều.

```js
const paymentOrderSchema = new Schema({ ... }, { collection: 'PAYMENT_ORDERS', ... });
export const PaymentOrder = mongoose.model('PaymentOrder', paymentOrderSchema);
```

**Tên field giữ nguyên snake_case như DB** (`user_id`, `created_at`, `is_login_locked`...). KHÔNG đổi sang camelCase như file mẫu (`isValidated`, `managerId`), vì sẽ lệch với dữ liệu và validator trên Atlas.

| Collection | Model | Collection | Model |
|---|---|---|---|
| User | User | CLASSROOMS | Classroom |
| EMAIL_VERIFICATION_TOKENS | EmailVerificationToken | CLASS_MEMBERS | ClassMember |
| USER_SESSIONS | UserSession | CLASS_ANNOUNCEMENTS | ClassAnnouncement |
| PASSWORD_RESET_TOKENS | PasswordResetToken | CLASS_MATERIALS | ClassMaterial |
| TUTOR_PROFILES | TutorProfile | ASSIGNMENTS | Assignment |
| SAVED_SEARCHES | SavedSearch | ASSIGNMENT_SUBMISSIONS | AssignmentSubmission |
| REVIEWS | Review | RECURRING_RULES | RecurringRule |
| TUTOR_POSTS | TutorPost | CLASS_SESSIONS | ClassSession |
| PARENT_REQUESTS | ParentRequest | SCHEDULE_CHANGE_REQUESTS | ScheduleChangeRequest |
| AI_SUGGESTIONS | AiSuggestion | SESSION_REMINDERS | SessionReminder |
| CONVERSATIONS | Conversation | USER_CALENDAR_TOKENS | UserCalendarToken |
| APPLY_REQUESTS | ApplyRequest | SESSION_CALENDAR_SYNC | SessionCalendarSync |
| BOOKMARKED_REQUESTS | BookmarkedRequest | MESSAGES | Message |
| AI_POST_SUGGESTIONS | AiPostSuggestion | NOTIFICATIONS | Notification |
| TUTOR_INVITATIONS | TutorInvitation | PARENT_CHILD_LINKS | ParentChildLink |
| TUTORING_AGREEMENTS | TutoringAgreement | ADMIN_AUDIT_LOGS | AdminAuditLog |
| PAYMENT_ORDERS | PaymentOrder | CONTENT_REPORTS | ContentReport |
| PLANS | Plan | CREDIT_PACKS | CreditPack |
| CREDIT_TRANSACTIONS | CreditTransaction | | |

Sub-schema (`models/schemas/`): bỏ tiền tố `emb_`, PascalCase số ít.
Vd `emb_GOOGLE_ACCOUNTS` → `GoogleAccount`, `emb_USER_CREDITS` → `CreditWallet`, `emb_ASSIGNMENT_QUESTIONS` → `AssignmentQuestion`,
`emb_MATERIAL_TOPICS` → `MaterialTopic`, `emb_SUBSCRIPTIONS` → `Subscription`, `emb_STUDENTS` → `StudentProfile`.

## 6. Quy tắc chuyển kiểu
| DBML | Mongoose |
|---|---|
| `ObjectId` (_id) | mặc định của Mongoose, không khai báo lại |
| `ObjectId` có Ref | `{ type: Schema.Types.ObjectId, ref: '<Model đích>' }` |
| `ObjectId` không có Ref (vd `target_id` của NOTIFICATIONS, CONTENT_REPORTS) | `Schema.Types.ObjectId`, KHÔNG có `ref` (đa hình, trỏ nhiều bảng); ghi comment |
| `String` | `String` |
| `Int32` | `Schema.Types.Int32` nếu mongoose hỗ trợ; nếu không: `Number` + validator `Number.isInteger` (và comment: driver lưu số nguyên JS thành int32) |
| `Double` | `Schema.Types.Double` nếu mongoose hỗ trợ; nếu không: **báo lại cho người dùng**, vì `Number` có giá trị nguyên (vd 5) sẽ bị lưu thành int32 và **validator trên Atlas sẽ chặn** |
| `Decimal128` (tiền) | `Schema.Types.Decimal128`; thêm getter trả về string, và `toJSON: { getters: true }` |
| `Boolean` | `Boolean` |
| `Date` | `Date` |
| `Object` (vd `weights_json`, `details_json`) | `Schema.Types.Mixed` |
| `"Array<String>"` | `[String]` |
| `"Array<emb_X>"` | `[XSchema]` |
| `"Object<emb_X>"` | `XSchema` (hoặc `{ type: XSchema, default: null }` nếu field cho phép null) |
| enum `*_enum` | `{ type: String, enum: Object.values(ENUMS.X) }` |

Constraint:
- `not null` → `required: true`.
- `null` hoặc không ghi gì → không required, `default: null` (trừ khi DBML có default khác).
- `default: false/true/0/'ACTIVE'` → `default` tương ứng; `` default: `now()` `` → `default: Date.now`.
- `unique` → **không** dùng `unique: true` trong field (Mongoose sẽ tự tạo index khác với Atlas). Khai báo index ở mục 7.

## 7. Index
- Khai báo **đúng y** các index trong `init_tuconnector.js` bằng `Schema.index(keys, options)`, gồm cả `partialFilterExpression` và `expireAfterSeconds` (TTL).
- Đặt `autoIndex: false` trong option schema: index trên Atlas đã do `init_tuconnector.js` tạo, tránh Mongoose tạo trùng hoặc khác cấu hình.

## 8. Subdocument
- Sub-schema dùng `{ _id: false }`, **trừ** `AssignmentQuestion` và `MaterialTopic` (2 cái này giữ `_id` vì nơi khác tham chiếu: `answers[].question_id`, `CLASS_MATERIALS.topic_id`).
- Field mảng subdocument: `default: []`.

## 9. Timestamps
- Không bật `timestamps` mặc định của Mongoose (sẽ sinh `createdAt` / `updatedAt` camelCase, sai tên field).
- Collection có **cả** `created_at` và `updated_at` → `timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }`.
- Collection chỉ có 1 trong 2 → `timestamps: { createdAt: 'created_at', updatedAt: false }` (hoặc ngược lại).
- Collection không có field nào → không bật.

## 10. Option chung cho mọi schema
```js
{
  collection: '<TÊN COLLECTION>',
  versionKey: false,            // validator trên Atlas không có field __v
  strict: 'throw',              // field lạ → báo lỗi ngay, khớp validator
  autoIndex: false,
  timestamps: ...,              // theo mục 9
  toJSON: { getters: true },
}
```
`versionKey: false` là **bắt buộc**: validator `$jsonSchema` không khai báo `__v`; nếu để mặc định, mọi lệnh insert sẽ thêm `__v` (hiện validator không chặn field thừa, nhưng giữ sạch để khớp schema).

## 11. Ví dụ mẫu (ESM, đúng kiểu repo)
```js
// backend/src/models/schemas/Receipt.schema.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const receiptSchema = new Schema({
  receipt_url: { type: String, default: null },
  created_at:  { type: Date, default: null },
}, { _id: false });

// backend/src/models/PaymentOrder.js
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
import { receiptSchema } from './schemas/Receipt.schema.js';
const { Schema } = mongoose;

const paymentOrderSchema = new Schema({
  order_code:      { type: String, default: null },
  user_id:         { type: Schema.Types.ObjectId, ref: 'User', default: null },
  item_type:       { type: String, enum: Object.values(ENUMS.PaymentOrderItemType), default: null },
  plan_id:         { type: Schema.Types.ObjectId, ref: 'Plan', default: null },
  pack_id:         { type: Schema.Types.ObjectId, ref: 'CreditPack', default: null },
  quantity:        { type: Schema.Types.Int32, default: 1 },
  duration_months: { type: Schema.Types.Int32, default: null },
  amount:          { type: Schema.Types.Decimal128, default: null, get: (v) => (v == null ? v : v.toString()) },
  payment_method:  { type: String, enum: Object.values(ENUMS.PaymentMethod), default: null },
  status:          { type: String, enum: Object.values(ENUMS.PaymentOrderStatus), default: null },
  ipn_signature:   { type: String, default: null },
  paid_at:         { type: Date, default: null },
  receipt:         { type: receiptSchema, default: null },
}, {
  collection: 'PAYMENT_ORDERS', versionKey: false, strict: 'throw', autoIndex: false,
  timestamps: { createdAt: 'created_at', updatedAt: false }, toJSON: { getters: true },
});

paymentOrderSchema.index({ order_code: 1 }, { unique: true, partialFilterExpression: { order_code: { $type: 'string' } } });
paymentOrderSchema.index({ user_id: 1, created_at: -1 });

export const PaymentOrder = mongoose.model('PaymentOrder', paymentOrderSchema);
```
(Ví dụ chỉ minh họa cách viết; giá trị thật lấy từ DBML và `init_tuconnector.js`.)

## 12. enums.js
- Mỗi enum DBML → 1 object hằng, tên PascalCase bỏ hậu tố `_enum`, gom trong `ENUMS`:
```js
export const ENUMS = Object.freeze({
  PaymentOrderStatus: Object.freeze({ PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED', CANCELLED: 'CANCELLED', EXPIRED: 'EXPIRED' }),
  // ...
});
```
- Enum `user_role_enum` → `UserRole`.

## 13. Comment trong code
- Mỗi field có `note` trong DBML → thêm 1 dòng comment ngắn bằng tiếng Việt (tóm ý, không chép nguyên văn dài).
- Đầu mỗi file model: 1–2 dòng mô tả collection (lấy từ `Note` của Table).

## 14. Kiểm tra trước khi báo xong
1. Trong `backend/`: `node -e "import('./src/models/index.js').then(m => console.log(Object.keys(m).length, 'models'))"` chạy không lỗi, in ra 37.
2. Viết script tạm `backend/scripts/check-models.js`: với mỗi model, so danh sách field (kể cả field con của sub-schema) với DBML → in ra field thiếu/thừa. Phải ra 0 lệch. Chạy xong có thể xóa.
3. Nếu có thư mục seed (`tuconnector-seed/collections/*.js`, viết bằng CommonJS): load bằng `createRequire` rồi thử `new Model(doc).validateSync()` cho mọi document seed → phải không có lỗi.
4. Không kết nối DB thật khi kiểm tra.

## 15. Báo cáo cuối (gửi lại người dùng)
- Danh sách file đã tạo.
- Phiên bản mongoose + đã dùng `Int32`/`Double` thật hay phương án thay thế.
- Mọi chỗ DBML mơ hồ hoặc mâu thuẫn mà bạn đã phải chọn cách xử lý.
- KHÔNG tự sửa DBML hay `init_tuconnector.js`.
