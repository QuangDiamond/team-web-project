# Models

Mongoose schema cho database TuConnector. Nguồn: `docs/database/tuconnector_erd_3_mongo_embedded.dbml`
và `docs/database/init_tuconnector.js` (validator + index trên Atlas).

- Mỗi collection một file, export named: `import { User, PaymentOrder } from './models/index.js'`.
- Tên field giữ snake_case như DB. Tên collection khai báo bằng option `collection`.
- `schemas/`: sub-schema cho subdocument nhúng (bảng `emb_*` trong DBML).
- `enums.js`: mọi enum: `import { ENUMS } from './models/enums.js'`, dùng `ENUMS.UserRole.TUTOR` thay cho chuỗi cứng.
- `autoIndex: false`: index do `init_tuconnector.js` tạo; khai báo `schema.index()` chỉ để tài liệu hóa.
- Field Decimal128 (tiền) trả về string khi `toJSON()`.
- Đổi schema thì sửa DBML + `init_tuconnector.js` trước, rồi cập nhật model cho khớp.

| Model | Collection |
|---|---|
| User | User |
| EmailVerificationToken | EMAIL_VERIFICATION_TOKENS |
| UserSession | USER_SESSIONS |
| PasswordResetToken | PASSWORD_RESET_TOKENS |
| TutorProfile | TUTOR_PROFILES |
| SavedSearch | SAVED_SEARCHES |
| Review | REVIEWS |
| TutorPost | TUTOR_POSTS |
| ParentRequest | PARENT_REQUESTS |
| AiSuggestion | AI_SUGGESTIONS |
| Conversation | CONVERSATIONS |
| ApplyRequest | APPLY_REQUESTS |
| BookmarkedRequest | BOOKMARKED_REQUESTS |
| AiPostSuggestion | AI_POST_SUGGESTIONS |
| TutorInvitation | TUTOR_INVITATIONS |
| TutoringAgreement | TUTORING_AGREEMENTS |
| PaymentOrder | PAYMENT_ORDERS |
| Plan | PLANS |
| CreditPack | CREDIT_PACKS |
| CreditTransaction | CREDIT_TRANSACTIONS |
| Classroom | CLASSROOMS |
| ClassMember | CLASS_MEMBERS |
| ClassAnnouncement | CLASS_ANNOUNCEMENTS |
| ClassMaterial | CLASS_MATERIALS |
| Assignment | ASSIGNMENTS |
| AssignmentSubmission | ASSIGNMENT_SUBMISSIONS |
| RecurringRule | RECURRING_RULES |
| ClassSession | CLASS_SESSIONS |
| ScheduleChangeRequest | SCHEDULE_CHANGE_REQUESTS |
| SessionReminder | SESSION_REMINDERS |
| UserCalendarToken | USER_CALENDAR_TOKENS |
| SessionCalendarSync | SESSION_CALENDAR_SYNC |
| Message | MESSAGES |
| Notification | NOTIFICATIONS |
| ParentChildLink | PARENT_CHILD_LINKS |
| AdminAuditLog | ADMIN_AUDIT_LOGS |
| ContentReport | CONTENT_REPORTS |

| Sub-schema | Bảng DBML | Dùng ở |
|---|---|---|
| Experience | emb_EXPERIENCES | TUTOR_PROFILES.experiences |
| Achievement | emb_ACHIEVEMENTS | TUTOR_PROFILES.achievements |
| Education | emb_EDUCATIONS | TUTOR_PROFILES.educations |
| Subscription | emb_SUBSCRIPTIONS | User.subscription |
| GoogleAccount | emb_GOOGLE_ACCOUNTS | User.google_account |
| CreditWallet | emb_USER_CREDITS | User.credit_wallet |
| NotificationPreference | emb_NOTIFICATION_PREFERENCES | User.notification_preferences |
| StudentProfile | emb_STUDENTS | User.student_profile |
| AssignmentQuestion | emb_ASSIGNMENT_QUESTIONS | ASSIGNMENTS.questions |
| AssignmentAttachment | emb_ASSIGNMENT_ATTACHMENTS | ASSIGNMENTS.attachments |
| SubmissionAnswer | emb_SUBMISSION_ANSWERS | ASSIGNMENT_SUBMISSIONS.answers |
| MessageAttachment | emb_MESSAGE_ATTACHMENTS | MESSAGES.attachments |
| Receipt | emb_RECEIPTS | PAYMENT_ORDERS.receipt |
| SessionAttendance | emb_SESSION_ATTENDANCE | CLASS_SESSIONS.attendance |
| ConversationReadState | emb_CONVERSATION_READ_STATES | CONVERSATIONS.read_states |
| MaterialTopic | emb_MATERIAL_TOPICS | CLASSROOMS.topics |
| NotificationDeliveryLog | emb_NOTIFICATION_DELIVERY_LOGS | NOTIFICATIONS.delivery_logs |
