import { createHash } from 'node:crypto';
import mongoose from 'mongoose';

export const DEMO_PASSWORD = 'Abc123456!';
export const demoId = (key) => new mongoose.Types.ObjectId(
  createHash('sha256').update(`tuconnector:marketplace-demo:v1:${key}`).digest('hex').slice(0, 24)
);

const tutorNames = [
  'Nguyễn Minh Khang', 'Trần Thu Trang', 'Lê Hoàng Nam', 'Phạm Ngọc Anh',
  'Vũ Đức Huy', 'Đặng Bảo Châu', 'Bùi Quang Minh', 'Đỗ Thanh Hà',
  'Nguyễn Khánh Linh', 'Trần Anh Tuấn', 'Lê Thảo Vy', 'Phạm Hải Đăng',
  'Võ Mai Phương', 'Hoàng Gia Bảo', 'Đinh Mỹ Duyên', 'Dương Nhật Long',
];
const parentNames = ['Nguyễn Thu Hương', 'Trần Quốc Hùng', 'Lê Ngọc Mai', 'Phạm Anh Dũng'];

const additionalParentNames = [
  'Vũ Thị Thanh', 'Đặng Minh Đức', 'Bùi Ngọc Lan', 'Đỗ Quang Hải',
  'Hoàng Thùy Dung', 'Phan Anh Khoa', 'Võ Thu Thảo', 'Đinh Văn Sơn',
  'Dương Hải Yến', 'Mai Quốc Bảo', 'Trịnh Thị Hạnh', 'Lý Minh Tuấn',
  'Ngô Bích Ngọc', 'Hồ Đức Thành', 'Cao Thanh Trúc', 'Tạ Anh Duy',
  'Lương Thu Hiền', 'Đoàn Việt Hưng', 'Châu Mỹ Linh', 'Tống Hoàng Phúc',
  'Hà Thị Hồng', 'Chu Gia Khánh', 'Lâm Ngọc Diệp', 'Đào Quang Vinh',
];

const reviewComments = [
  { rating: 5, knowledge: 5, punctuality: 5, communication: 5,
    comment: 'Thầy cô dạy rất dễ hiểu, con tiến bộ rõ sau một tháng. Sau mỗi buổi đều có nhận xét gửi gia đình.' },
  { rating: 5, knowledge: 5, punctuality: 4, communication: 5,
    comment: 'Kiến thức vững, biết cách khơi gợi để con tự làm bài. Có hôm đến muộn vài phút nhưng luôn báo trước.' },
  { rating: 4, knowledge: 5, punctuality: 4, communication: 4,
    comment: 'Chuyên môn tốt, bài tập về nhà vừa sức. Mong thầy cô gửi báo cáo tiến độ đều hơn.' },
  { rating: 4, knowledge: 4, punctuality: 5, communication: 4,
    comment: 'Đúng giờ, chuẩn bị bài kỹ. Con thích học hơn vì được giải thích bằng ví dụ thực tế.' },
  { rating: 3, knowledge: 4, punctuality: 3, communication: 3,
    comment: 'Kiến thức ổn nhưng lịch học hay phải đổi, gia đình mong thầy cô sắp xếp ổn định hơn.' },
  { rating: 5, knowledge: 5, punctuality: 5, communication: 4,
    comment: 'Con đạt điểm cao hơn hẳn trong kỳ kiểm tra vừa rồi. Rất cảm ơn thầy cô đã kiên nhẫn với con.' },
];
const tutorReplies = [
  'Cảm ơn anh chị đã tin tưởng, em sẽ tiếp tục đồng hành cùng con.',
  'Em ghi nhận góp ý và sẽ gửi báo cáo tiến độ sau mỗi tuần ạ.',
];

const requestTopics = [
  { subject: 'Toán', grades: ['Lớp 3', 'Lớp 5', 'Lớp 8', 'Lớp 11'], budget: 150000,
    goal: 'Giúp con hiểu bản chất, trình bày lời giải theo từng bước và tự kiểm tra kết quả.' },
  { subject: 'Ngữ văn', grades: ['Lớp 6', 'Lớp 9', 'Lớp 10', 'Lớp 12'], budget: 180000,
    goal: 'Rèn đọc hiểu, lập dàn ý và viết bài có luận điểm rõ ràng; không học thuộc văn mẫu.' },
  { subject: 'Tiếng Anh', grades: ['Lớp 6', 'Lớp 10', 'IELTS', 'TOEIC'], budget: 250000,
    goal: 'Đánh giá trình độ đầu vào và xây dựng lộ trình luyện nghe, nói, đọc, viết phù hợp với mục tiêu học.' },
  { subject: 'Vật lý', grades: ['Lớp 8', 'Lớp 9', 'Lớp 11', 'Lớp 12'], budget: 200000,
    goal: 'Giải thích hiện tượng bằng ví dụ thực tế, hướng dẫn phân tích đề và vận dụng công thức đúng.' },
  { subject: 'Hóa học', grades: ['Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 12'], budget: 200000,
    goal: 'Hệ thống kiến thức, luyện phương trình phản ứng và cách suy luận khi làm bài tập.' },
  { subject: 'Sinh học', grades: ['Lớp 6', 'Lớp 9', 'Lớp 11', 'Lớp 12'], budget: 180000,
    goal: 'Dùng sơ đồ để giải thích kiến thức, liên hệ thực tế và luyện trả lời câu hỏi theo chủ đề.' },
  { subject: 'Tin học', grades: ['Lớp 6', 'Lớp 8', 'Lớp 10', 'Lớp 12'], budget: 200000,
    goal: 'Củng cố kiến thức trong chương trình và hướng dẫn thực hành trên máy tính sau mỗi bài học.' },
  { subject: 'Lập trình', grades: ['Cơ bản', 'Nâng cao', 'Lớp 10', 'Lớp 12'], budget: 300000,
    goal: 'Rèn tư duy thuật toán, đọc lỗi và tự hoàn thành bài tập hoặc dự án nhỏ phù hợp với trình độ.' },
  { subject: 'Tiếng Việt', grades: ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 5'], budget: 120000,
    goal: 'Luyện đọc thành tiếng, chính tả và diễn đạt câu văn; chia bài học thành các hoạt động ngắn.' },
  { subject: 'Lịch sử', grades: ['Lớp 6', 'Lớp 9', 'Lớp 10', 'Lớp 12'], budget: 150000,
    goal: 'Kết nối sự kiện theo dòng thời gian, giải thích nguyên nhân và luyện cách tự tổng hợp kiến thức.' },
  { subject: 'Địa lý', grades: ['Lớp 6', 'Lớp 9', 'Lớp 11', 'Lớp 12'], budget: 150000,
    goal: 'Hướng dẫn đọc bản đồ, phân tích biểu đồ và nhận xét bảng số liệu bằng ví dụ gần gũi.' },
  { subject: 'Tiếng Nhật', grades: ['JLPT N5', 'JLPT N4', 'JLPT N3', 'Giao tiếp'], budget: 300000,
    goal: 'Luyện phát âm, từ vựng và mẫu câu theo trình độ, kết hợp bài tập nghe và phản xạ hội thoại.' },
];

export const MARKETPLACE_SUBJECT_NAMES = requestTopics.map((topic) => topic.subject);
export const MARKETPLACE_GRADE_NAMES = [...new Set(['Lớp 9', 'Lớp 12', 'IELTS', 'TOEIC', ...requestTopics.flatMap((topic) => topic.grades)])];

const requestLocations = ['Cầu Giấy, Hà Nội', 'Bình Thạnh, TP. Hồ Chí Minh', 'Hải Châu, Đà Nẵng',
  'Lê Chân, Hải Phòng', 'Ninh Kiều, Cần Thơ', 'Thuận Hóa, Huế'];
const requestSchedules = ['Thứ 2, 4 — 18:00 đến 19:30', 'Thứ 3, 5 — 19:30 đến 21:00',
  'Thứ 7 — 08:00 đến 10:00', 'Chủ nhật — 14:00 đến 16:00',
  'Thứ 2, 6 — 20:00 đến 21:00', 'Thứ 4, 7 — 17:00 đến 18:30',
  'Thứ 3, 6 — 09:00 đến 10:30', 'Thứ 7, Chủ nhật — 19:00 đến 20:30'];
const learningNeeds = [
  { title: 'Củng cố nền tảng', detail: 'Con còn ngại hỏi khi chưa hiểu, cần thầy cô kiên nhẫn và kiểm tra lại kiến thức sau từng phần.' },
  { title: 'Học theo lộ trình cá nhân', detail: 'Gia đình mong có kế hoạch học theo tuần, bài tập vừa sức và báo cáo tiến độ định kỳ.' },
  { title: 'Luyện tập có hướng dẫn', detail: 'Ưu tiên hướng dẫn con tự làm bài, phân tích lỗi sai và rèn thói quen học đều đặn.' },
  { title: 'Phát triển khả năng tự học', detail: 'Con muốn thử sức với bài tập mở rộng, cần gia sư đặt câu hỏi gợi mở thay vì giải sẵn.' },
];

export function buildMarketplaceSeed({ passwordHash, now = new Date(), categories, plans }) {
  const createdAt = new Date(now.getTime() - 3 * 86400000);
  const appliedAt = new Date(now.getTime() - 2 * 86400000);
  const repliedAt = new Date(now.getTime() - 86400000);
  const data = {
    users: [], profiles: [], posts: [], requests: [], applications: [],
    invitations: [], conversations: [], messages: [], transactions: [],
    agreements: [], reviews: [],
  };

  function addUser(key, name, role, email) {
    const user = {
      _id: demoId(key), full_name: name, email, role, password_hash: passwordHash,
      has_password: true, email_verify_status: true, is_onboarded: true,
      account_status: 'ACTIVE', is_login_locked: false, failed_login_attempts: 0,
      notification_preferences: { enable_email: false, enable_in_app: true },
      credit_wallet: { balance: 20, updated_at: repliedAt },
      subscription: {
        plan_id: plans[role], status: 'ACTIVE', expires_at: null, ai_quota_used: 0,
        start_date: createdAt, created_at: createdAt, ai_quota_reset_at: now,
      },
      created_at: createdAt, updated_at: repliedAt,
    };
    data.users.push(user);
    data.transactions.push({
      _id: demoId(`grant:${key}`), user_id: user._id, amount: 20,
      type: 'MONTHLY_GRANT', expires_at: new Date(now.getTime() + 27 * 86400000),
      created_at: createdAt,
    });
    return user;
  }

  function spend(user, key, credits, relatedField, relatedId, type) {
    user.credit_wallet.balance -= credits;
    data.transactions.push({
      _id: demoId(`spend:${key}`), user_id: user._id, amount: -credits, type,
      [relatedField]: relatedId, created_at: appliedAt,
    });
  }

  function addConversation(request, profile) {
    const conversationId = demoId(`chat:${request._id}:${profile._id}`);
    data.conversations.push({
      _id: conversationId, parent_user_id: request.parent_user_id,
      tutor_profile_id: profile._id, request_id: request._id, class_id: null,
      type: 'DIRECT', is_active: true, read_states: [],
      created_at: repliedAt, updated_at: repliedAt,
    });
    data.messages.push({
      _id: demoId(`message:parent:${conversationId}`), conversation_id: conversationId,
      sender_user_id: request.parent_user_id, message_type: 'TEXT',
      content: `Chào thầy cô, mình muốn trao đổi thêm về yêu cầu ${request.title}.`, created_at: repliedAt,
    }, {
      _id: demoId(`message:tutor:${conversationId}`), conversation_id: conversationId,
      sender_user_id: profile.user_id, message_type: 'TEXT',
      content: 'Chào anh chị, mình cùng trao đổi lịch học và mục tiêu của học viên nhé.', created_at: repliedAt,
    });
  }

  const tutors = tutorNames.map((name, index) => {
    const user = addUser(`tutor:${index}`, name, 'TUTOR', `demo.tutor${String(index + 1).padStart(2, '0')}@example.com`);
    const subject = index < 8 ? 'Toán' : 'Tiếng Anh';
    const grades = index < 8 ? ['Lớp 9', 'Lớp 12'] : ['IELTS', 'TOEIC'];
    const profile = {
      _id: demoId(`profile:${index}`), user_id: user._id,
      headline: `Gia sư ${subject} — ${3 + index % 5} năm kinh nghiệm`,
      bio: 'Giảng dạy dễ hiểu, bám sát mục tiêu học viên. Có lộ trình cá nhân và cập nhật tiến độ mỗi tuần cho phụ huynh.',
      address: index % 2 === 0 ? 'Cầu Giấy, Hà Nội' : 'Bình Thạnh, TP. Hồ Chí Minh',
      is_address_hidden: false, is_complete: true, availability_status: 'AVAILABLE',
      average_rating: null,
      teaching_categories: [
        { type: 'subjects', category_id: categories[subject], name: subject },
        ...grades.map((grade) => ({ type: 'grades', category_id: categories[grade], name: grade })),
      ],
      educations: [{ school: 'Đại học Sư phạm', degree: `Cử nhân sư phạm ${subject}`, graduation_year: 2020 }],
      experiences: [{ title: `Gia sư ${subject}`, company: 'Gia sư tự do', start_date: new Date('2020-09-01'), end_date: null }],
    };
    data.profiles.push(profile);
    grades.forEach((grade, postIndex) => {
      data.posts.push({
        _id: demoId(`post:${index}:${postIndex}`), profile_id: profile._id,
        title: `${subject} ${grade} — học chắc kiến thức, tiến bộ mỗi tuần`,
        subject_name: subject, grade_level: grade, teaching_mode: index % 2 === 0 ? 'ONLINE' : 'HYBRID',
        price: mongoose.Types.Decimal128.fromString(String(150000 + index % 5 * 25000)),
        schedule: postIndex === 0 ? 'Thứ 2, 4 — 19:00 đến 20:30' : 'Thứ 3, 5 — 19:30 đến 21:00',
        description: `Nhận dạy ${subject} trình độ ${grade}. Đánh giá đầu vào, xây dựng lộ trình phù hợp và giao bài luyện tập sau mỗi buổi. Có thể trao đổi lịch học với phụ huynh.`,
        status: 'PUBLISHED', image_urls: [], created_at: createdAt, updated_at: repliedAt,
      });
    });
    return { user, profile };
  });
  const parents = parentNames.map((name, index) => addUser(
    `parent:${index}`, name, 'PARENT', `demo.parent${String(index + 1).padStart(2, '0')}@example.com`
  ));

  for (let index = 0; index < 12; index += 1) {
    const parent = parents[index % parents.length];
    const groupStart = index % 2 === 0 ? 0 : 8;
    const subject = groupStart === 0 ? 'Toán' : 'Tiếng Anh';
    const grades = groupStart === 0 ? ['Lớp 9', 'Lớp 12'] : ['IELTS', 'TOEIC'];
    const grade = grades[Math.floor(index / 2) % 2];
    const request = {
      _id: demoId(`request:${index}`), parent_user_id: parent._id,
      title: `Tìm gia sư ${subject} ${grade} — ${index + 1}`,
      subject_name: subject, grade_level: grade, teaching_mode: index % 3 === 0 ? 'HYBRID' : 'ONLINE',
      budget: mongoose.Types.Decimal128.fromString(String(200000 + index % 3 * 50000)),
      schedule: 'Thứ 3, 5 — 19:30 đến 21:00',
      description: `Cần gia sư ${subject} ${grade}, hai buổi mỗi tuần. Mong có lộ trình rõ ràng, giúp học viên củng cố nền tảng và tự tin làm bài.`,
      location_address: 'Cầu Giấy, Hà Nội', tutor_requirements: 'Kiên nhẫn, đúng giờ, cập nhật tiến độ hàng tuần.',
      status: 'OPEN', image_urls: [], created_at: createdAt, updated_at: repliedAt,
    };
    data.requests.push(request);
    for (let slot = 0; slot < 8; slot += 1) {
      const tutor = tutors[groupStart + (Math.floor(index / 2) + slot) % 8];
      const credits = 1 + slot % 3;
      if (slot < 6) {
        const status = ['CONTINUED', 'SKIPPED', 'PENDING'][slot % 3];
        const applicationId = demoId(`application:${index}:${slot}`);
        data.applications.push({
          _id: applicationId, request_id: request._id, tutor_profile_id: tutor.profile._id,
          note: `Em có kinh nghiệm dạy ${subject} ${grade}, có thể theo lịch của gia đình và gửi báo cáo tiến độ mỗi tuần.`,
          status, credits_spent: credits, created_at: appliedAt, updated_at: repliedAt,
        });
        spend(tutor.user, `application:${index}:${slot}`, credits, 'related_apply_id', applicationId, 'USED_APPLY');
        if (status === 'CONTINUED') addConversation(request, tutor.profile);
      } else {
        const status = ['PENDING', 'ACCEPTED', 'DECLINED'][(index + slot) % 3];
        const invitationId = demoId(`invitation:${index}:${slot}`);
        data.invitations.push({
          _id: invitationId, parent_user_id: parent._id, request_id: request._id,
          tutor_profile_id: tutor.profile._id, credits_spent: credits, status,
          message: `Mình đã xem bài giới thiệu ${subject} ${grade} của thầy cô, mời thầy cô trao đổi về lịch học và mục tiêu của con.`,
          created_at: appliedAt, updated_at: repliedAt,
        });
        spend(parent, `invitation:${index}:${slot}`, credits, 'related_invitation_id', invitationId, 'USED_INVITATION');
        if (status === 'ACCEPTED') addConversation(request, tutor.profile);
      }
    }
  }

  // New requests belong only to new parents so reruns preserve old wallets and relationships.
  additionalParentNames.forEach((name, parentIndex) => {
    const accountIndex = parentNames.length + parentIndex;
    const parent = addUser(`parent:${accountIndex}`, name, 'PARENT', `demo.parent${String(accountIndex + 1).padStart(2, '0')}@example.com`);
    for (let slot = 0; slot < 4; slot += 1) {
      const index = parentIndex * 4 + slot;
      const topic = requestTopics[index % requestTopics.length];
      const gradeIndex = Math.floor(index / requestTopics.length) % topic.grades.length;
      const grade = topic.grades[gradeIndex];
      const need = learningNeeds[(parentIndex + slot) % learningNeeds.length];
      const requestCreatedAt = new Date(createdAt.getTime() + index % 48 * 3600000);
      data.requests.push({
        _id: demoId(`request:extra:${index}`), parent_user_id: parent._id,
        title: `${topic.subject} ${grade} — ${need.title}`,
        subject_name: topic.subject, grade_level: grade,
        teaching_mode: ['ONLINE', 'OFFLINE', 'HYBRID'][(parentIndex + slot) % 3],
        budget: mongoose.Types.Decimal128.fromString(String(topic.budget + (parentIndex + slot) % 4 * 30000)),
        schedule: requestSchedules[(parentIndex + slot) % requestSchedules.length],
        description: `${topic.goal} ${need.detail} Gia đình mong trao đổi mục tiêu và học thử một buổi trước khi thống nhất lịch lâu dài. Có thể điều chỉnh lịch nếu hai bên báo trước.`,
        location_address: requestLocations[(parentIndex + slot) % requestLocations.length],
        tutor_requirements: 'Có kinh nghiệm phù hợp, chuẩn bị bài trước buổi học, đúng giờ và trao đổi tiến độ với gia đình.',
        status: 'OPEN', image_urls: [], created_at: requestCreatedAt, updated_at: repliedAt,
      });
    }
  });
  // Past CONFIRMED connections (no request) so every demo tutor has 3–5 approved reviews.
  const allParents = data.users.filter((user) => user.role === 'PARENT');
  tutors.forEach((tutor, tutorIndex) => {
    const reviewCount = 3 + tutorIndex % 3;
    for (let slot = 0; slot < reviewCount; slot += 1) {
      const key = `review:${tutorIndex}:${slot}`;
      const parent = allParents[(tutorIndex * 5 + slot) % allParents.length];
      const template = reviewComments[(tutorIndex + slot) % reviewComments.length];
      const confirmedAt = new Date(createdAt.getTime() + (slot + 1) * 6 * 3600000);
      const reviewedAt = new Date(confirmedAt.getTime() + 2 * 3600000);
      const conversationId = demoId(`chat:${key}`);
      const agreementId = demoId(`agreement:${key}`);
      const subject = tutor.profile.teaching_categories[0].name;
      data.conversations.push({
        _id: conversationId, parent_user_id: parent._id, tutor_profile_id: tutor.profile._id,
        request_id: null, class_id: null, type: 'DIRECT', is_active: true, read_states: [],
        created_at: confirmedAt, updated_at: confirmedAt,
      });
      data.agreements.push({
        _id: agreementId, conversation_id: conversationId,
        proposer_user_id: tutor.user._id, accepted_by_user_id: parent._id,
        agreed_subject: subject, agreed_schedule: requestSchedules[(tutorIndex + slot) % requestSchedules.length],
        agreed_price: mongoose.Types.Decimal128.fromString(String(150000 + tutorIndex % 5 * 25000)),
        status: 'CONFIRMED', created_at: confirmedAt, updated_at: confirmedAt,
      });
      const hasReply = slot % 2 === 0;
      data.reviews.push({
        _id: demoId(key), tutor_profile_id: tutor.profile._id, agreement_id: agreementId,
        parent_user_id: parent._id, rating: template.rating, comment: template.comment,
        knowledge_rating: template.knowledge, punctuality_rating: template.punctuality,
        communication_rating: template.communication,
        tutor_reply: hasReply ? tutorReplies[(tutorIndex + slot) % tutorReplies.length] : null,
        replied_at: hasReply ? repliedAt : null,
        status: 'APPROVED', created_at: reviewedAt, updated_at: reviewedAt,
      });
    }
  });
  return data;
}
