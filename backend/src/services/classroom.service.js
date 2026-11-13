import crypto from 'crypto';
import { Buffer } from 'node:buffer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Classroom } from '../models/Classroom.js';
import { Conversation } from '../models/Conversation.js';
import { ClassMember } from '../models/ClassMember.js';
import { ClassGroup } from '../models/ClassGroup.js';
import { ClassAnnouncement } from '../models/ClassAnnouncement.js';
import { ClassMaterial } from '../models/ClassMaterial.js';
import { Notification } from '../models/Notification.js';
import { Plan } from '../models/Plan.js';
import { TutoringAgreement } from '../models/TutoringAgreement.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { User } from '../models/User.js';
import { Assignment } from '../models/Assignment.js';
import { AssignmentSubmission } from '../models/AssignmentSubmission.js';
import { ClassSession } from '../models/ClassSession.js';
import { ParentChildLink } from '../models/ParentChildLink.js';
import { Message } from '../models/Message.js';
import { generateAssignmentWithGemini } from './geminiClient.service.js';
import { AppError } from '../common/utils/AppError.js';
import { ENUMS } from '../models/enums.js';
import { env } from '../config/environment.js';
import { notifyParentsOfClassStudents } from './notification.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

const ALLOWED_CHAT_FILE_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'mp4', 'zip',
]);
const MAX_CHAT_FILE_SIZE = 20 * 1024 * 1024; // 20MB theo quy tắc ràng buộc nghiệp vụ

/**
 * Xử lý và lưu tệp đính kèm trong tin nhắn nhóm chat lớp học
 * @param {Array<Object>} attachments
 * @returns {Promise<Array<Object>>}
 */
const processChatMessageAttachments = async (attachments = []) => {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return [];
  }

  const processed = [];
  await fs.mkdir(uploadsDir, { recursive: true });

  for (const att of attachments) {
    if (!att) continue;

    const originalName = (att.file_name || 'attachment').trim();
    const ext = originalName.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_CHAT_FILE_EXTENSIONS.has(ext)) {
      throw new AppError(
        `Định dạng tệp "${originalName}" không được hỗ trợ. Chỉ cho phép: pdf, doc/docx, ppt/pptx, xls/xlsx, jpg, png, mp4, zip.`,
        400
      );
    }

    let fileSize = parseInt(att.file_size, 10) || 0;
    let fileUrl = att.file_url || '';

    // Nếu gửi kèm file_data dạng base64, lưu file vào thư mục uploads
    if (att.file_data) {
      let base64Data = att.file_data;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }
      const buffer = Buffer.from(base64Data, 'base64');
      fileSize = buffer.length;

      if (fileSize > MAX_CHAT_FILE_SIZE) {
        throw new AppError(`Tệp "${originalName}" vượt quá dung lượng tối đa cho phép là 20MB.`, 400);
      }

      const safeBaseName = originalName
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 50);
      const uniqueFileName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeBaseName}`;
      const targetPath = path.join(uploadsDir, uniqueFileName);

      await fs.writeFile(targetPath, buffer);
      fileUrl = `/uploads/${uniqueFileName}`;
    } else {
      if (fileSize > MAX_CHAT_FILE_SIZE) {
        throw new AppError(`Tệp "${originalName}" vượt quá dung lượng tối đa cho phép là 20MB.`, 400);
      }
    }

    processed.push({
      file_url: fileUrl,
      file_name: originalName,
      file_size: fileSize,
      mime_type: att.mime_type || `application/${ext}`,
    });
  }

  return processed;
};

/**
 * Sinh mã tham gia lớp học độc nhất (6 ký tự: TC + 4 ký tự hex in hoa)
 */
const generateUniqueJoinCode = async () => {
  let isUnique = false;
  let code = '';
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    code = `TC${randomHex}`;
    const existing = await Classroom.findOne({ join_code: code });
    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    code = `TC${Date.now().toString().slice(-6)}`;
  }
  return code;
};

/**
 * UC21: Tạo lớp học mới (Create Classroom)
 */
export const createClassroom = async ({ tutorProfile, user, data, origin = '' }) => {
  const { name, subject, grade, capacity, description, agreement_id } = data;

  // 1. Kiểm tra validation các trường bắt buộc
  if (!name || !name.trim()) {
    throw new AppError('Tên lớp học là bắt buộc', 400);
  }
  if (name.trim().length < 3 || name.trim().length > 100) {
    throw new AppError('Tên lớp học phải từ 3 đến 100 ký tự', 400);
  }
  if (!subject || !subject.trim()) {
    throw new AppError('Môn học giảng dạy là bắt buộc', 400);
  }

  // Khối lớp: mặc định 'Chung' nếu gia sư không chỉ định
  const formattedGrade = grade && grade.trim() ? grade.trim() : 'Chung';

  // Sĩ số tối đa: mặc định 50 học sinh theo quy tắc nghiệp vụ BR-08 nếu không nhập
  let parsedCapacity = 50;
  if (capacity !== undefined && capacity !== null && capacity !== '') {
    parsedCapacity = parseInt(capacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity < 1 || parsedCapacity > 200) {
      throw new AppError('Sức chứa của lớp học phải là số nguyên từ 1 đến 200 học sinh', 400);
    }
  }

  // 2. Kiểm tra ngoại lệ E1: Trùng tên lớp đối với cùng 1 gia sư (Tutor A)
  // Bất kể lớp đang ACTIVE hay ARCHIVED, không cho phép trùng tên (không phân biệt hoa thường, chuẩn hóa khoảng trắng)
  const normalizedName = name.trim().replace(/\s+/g, ' ');
  const escapedPattern = normalizedName
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
  const tutorIds = [tutorProfile._id, user?._id || user?.id, tutorProfile.user_id].filter(Boolean);
  const existingClass = await Classroom.findOne({
    tutor_profile_id: { $in: tutorIds },
    name: { $regex: new RegExp(`^\\s*${escapedPattern}\\s*$`, 'i') },
  });
  if (existingClass) {
    throw new AppError('Bạn đã có một lớp học mang tên này. Vui lòng đặt tên khác.', 400);
  }

  // 3. Kiểm tra quy tắc BR-12: Kiểm tra hạn ngạch số lớp tạo theo gói của gia sư (PLANS.max_classrooms)
  const currentActiveCount = await Classroom.countDocuments({
    tutor_profile_id: { $in: tutorIds },
    status: 'ACTIVE',
  });

  let maxAllowed = 1; // Mặc định gói Free của Tutor là 1 lớp theo catalog PLANS
  let planName = 'Cơ bản (Free)';

  if (user?.subscription?.plan_id) {
    const userPlan = await Plan.findById(user.subscription.plan_id);
    if (userPlan) {
      planName = userPlan.name || planName;
      if (userPlan.max_classrooms !== null && userPlan.max_classrooms !== undefined) {
        maxAllowed = userPlan.max_classrooms;
      } else {
        maxAllowed = null; // Gói PRO không giới hạn
      }
    }
  } else {
    // Tìm gói Free mặc định cho Tutor nếu có
    const defaultPlan = await Plan.findOne({ target_role: 'TUTOR', name: /free/i });
    if (defaultPlan?.max_classrooms !== null && defaultPlan?.max_classrooms !== undefined) {
      maxAllowed = defaultPlan.max_classrooms;
      planName = defaultPlan.name || planName;
    }
  }

  if (maxAllowed !== null && currentActiveCount >= maxAllowed) {
    throw new AppError(
      `Bạn đã sử dụng hết hạn mức ${maxAllowed} lớp học đang hoạt động của gói ${planName}. Vui lòng nâng cấp gói để tạo thêm lớp.`,
      403
    );
  }

  // 4. Kiểm tra thỏa thuận kết nối đã xác nhận (Luồng UC21.A1 - Tạo từ agreement_id)
  let verifiedAgreement = null;
  if (agreement_id) {
    const agreement = await TutoringAgreement.findById(agreement_id).populate('conversation_id');
    if (!agreement) {
      throw new AppError('Thỏa thuận kết nối không tồn tại', 404);
    }
    if (agreement.status !== 'CONFIRMED') {
      throw new AppError('Chỉ có thể tạo lớp từ kết nối đã được hai bên xác nhận (CONFIRMED)', 400);
    }
    verifiedAgreement = agreement;
  }

  // 5. Tự động sinh mã tham gia duy nhất (join_code) và link mời (invite_link) (BR-12, POST-1)
  const joinCode = await generateUniqueJoinCode();
  const inviteBase = origin ? origin.replace(/\/$/, '') : 'http://localhost:5173';
  const inviteLink = `${inviteBase}/join-class/${joinCode}`;

  // 6. Khởi tạo bản ghi lớp học với status = ACTIVE
  const classroom = await Classroom.create({
    tutor_profile_id: tutorProfile._id,
    agreement_id: verifiedAgreement?._id || null,
    name: name.trim(),
    subject: subject.trim(),
    grade: formattedGrade,
    description: description ? description.trim() : null,
    capacity: parsedCapacity,
    join_code: joinCode,
    invite_link: inviteLink,
    status: ENUMS.ClassroomsStatus.ACTIVE,
    topics: [],
  });

  let parentUserId = null;
  let studentUserId = null;

  // Tự động thêm học sinh/phụ huynh vào lớp và gửi link nếu tạo từ thỏa thuận kết nối
  if (verifiedAgreement) {
    // 1. Xác định ID phụ huynh từ thỏa thuận
    if (verifiedAgreement.proposer_user_id && verifiedAgreement.proposer_user_id.toString() !== user._id.toString()) {
      parentUserId = verifiedAgreement.proposer_user_id;
    } else if (verifiedAgreement.accepted_by_user_id && verifiedAgreement.accepted_by_user_id.toString() !== user._id.toString()) {
      parentUserId = verifiedAgreement.accepted_by_user_id;
    }

    // 2. Xác định ID học sinh (con của phụ huynh) từ conversation -> request_id hoặc ParentChildLink
    let conversationDoc = null;
    if (verifiedAgreement.conversation_id) {
      const convId = verifiedAgreement.conversation_id._id || verifiedAgreement.conversation_id;
      conversationDoc = await Conversation.findById(convId).populate('request_id');
      if (conversationDoc?.parent_user_id) {
        parentUserId = conversationDoc.parent_user_id;
      }
      if (conversationDoc?.request_id?.student_id) {
        studentUserId = conversationDoc.request_id.student_id;
      }
    }

    if (!studentUserId && parentUserId) {
      const parentLink = await ParentChildLink.findOne({
        parent_user_id: parentUserId,
        status: 'ACCEPTED',
      });
      if (parentLink?.student_user_id) {
        studentUserId = parentLink.student_user_id;
      }
    }

    // 3. Thêm học sinh vào danh sách thành viên lớp học
    if (studentUserId) {
      try {
        await ClassMember.create({
          class_id: classroom._id,
          user_id: studentUserId,
          joined_at: new Date(),
          status: ENUMS.ClassMembersStatus.ACTIVE,
        });
      } catch (memErr) {
        console.warn('[UC21] Không thể tự động thêm học sinh từ thỏa thuận:', memErr.message);
      }
    }

    // 4. Thêm phụ huynh vào danh sách thành viên lớp học để theo dõi con
    if (parentUserId && (!studentUserId || parentUserId.toString() !== studentUserId.toString())) {
      try {
        await ClassMember.create({
          class_id: classroom._id,
          user_id: parentUserId,
          joined_at: new Date(),
          status: ENUMS.ClassMembersStatus.ACTIVE,
        });
      } catch (parentMemErr) {
        console.warn('[UC21] Không thể tự động thêm phụ huynh từ thỏa thuận:', parentMemErr.message);
      }
    }

    // 5. Gửi tin nhắn trực tiếp chứa link mời vào hội thoại giữa Gia sư và Phụ huynh
    const directConvId = verifiedAgreement.conversation_id?._id || verifiedAgreement.conversation_id;
    if (directConvId) {
      try {
        await Message.create({
          conversation_id: directConvId,
          sender_user_id: user._id,
          message_type: ENUMS.MessagesMessageType.TEXT,
          content: `Gia sư đã tạo lớp học "${classroom.name}" theo thỏa thuận của chúng ta. Mã tham gia: ${joinCode}. Link tham gia: ${inviteLink}`,
        });
      } catch (msgErr) {
        console.warn('[UC21] Không thể gửi tin nhắn thỏa thuận:', msgErr.message);
      }
    }

    // 6. Gửi thông báo kèm link mời cho Phụ huynh
    if (parentUserId) {
      try {
        await Notification.create({
          recipient_user_id: parentUserId,
          category: ENUMS.NotificationsCategory.INVITATION,
          title: `Lớp học mới: ${classroom.name}`,
          body: `Gia sư đã tạo lớp "${classroom.name}". Mã tham gia: ${joinCode}. Bấm vào liên kết để vào lớp: ${inviteLink}`,
          target_type: ENUMS.NotificationsTargetType.CLASSROOM,
          target_id: classroom._id,
        });
      } catch (notifErr) {
        console.warn('[UC21] Không thể gửi thông báo cho phụ huynh:', notifErr.message);
      }
    }

    // 7. Gửi thông báo kèm link mời cho Học sinh
    if (studentUserId) {
      try {
        await Notification.create({
          recipient_user_id: studentUserId,
          category: ENUMS.NotificationsCategory.INVITATION,
          title: `Lời mời tham gia lớp học: ${classroom.name}`,
          body: `Gia sư đã tạo lớp "${classroom.name}". Mã tham gia: ${joinCode}. Bấm vào liên kết để tham gia: ${inviteLink}`,
          target_type: ENUMS.NotificationsTargetType.CLASSROOM,
          target_id: classroom._id,
        });
      } catch (notifErr) {
        console.warn('[UC21] Không thể gửi thông báo cho học sinh:', notifErr.message);
      }
    }
  }

  // 7. Tự động khởi tạo phòng chat nhóm lớp học CONVERSATIONS (POST-1, UC21, UC33)
  let conversation = null;
  try {
    conversation = await Conversation.create({
      class_id: classroom._id,
      type: ENUMS.ConversationsType.CLASS_GROUP_CHAT,
      tutor_profile_id: tutorProfile._id,
      is_active: true,
      read_states: [
        {
          user_id: user._id,
          last_read_message_id: null,
          read_at: new Date(),
        },
      ],
    });
  } catch (convErr) {
    console.error('[UC21] Lỗi khi tự động tạo group chat lớp học:', convErr.message);
  }

  // 8. Tự động khởi tạo nhóm thành viên mặc định (UC33, Case 7.1)
  try {
    const initialMemberIds = [user._id];
    if (parentUserId) initialMemberIds.push(parentUserId);
    if (studentUserId) initialMemberIds.push(studentUserId);
    await ClassGroup.create({
      class_id: classroom._id,
      name: 'Nhóm chung lớp học',
      tutor_profile_id: tutorProfile._id,
      is_default: true,
      only_tutor_can_post: false,
      member_user_ids: Array.from(new Set(initialMemberIds)),
    });
  } catch (groupErr) {
    console.warn('[UC33] Lỗi khi khởi tạo nhóm chung mặc định:', groupErr.message);
  }

  return {
    classroom,
    conversation_id: conversation?._id || null,
  };
};

/**
 * Đếm số lượng học viên (STUDENT) đang hoạt động trong lớp (SDS UC22 - Query 03)
 * Loại trừ phụ huynh (PARENT) và gia sư để kiểm soát đúng sĩ số học viên (capacity)
 */
export const countActiveStudentsInClass = async (classroomId) => {
  const activeMembers = await ClassMember.find({
    class_id: classroomId,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  }).populate('user_id', 'role');
  return activeMembers.filter((m) => m.user_id?.role === 'STUDENT').length;
};

/**
 * Lấy danh sách lớp thuộc quyền truy cập của người dùng hiện tại.
 * @param {Object} options - { user, tutorProfile, query }
 * @returns {Promise<Object[]>} Danh sách lớp cùng sĩ số và quyền sở hữu.
 */
export const getUserClassrooms = async ({ user, tutorProfile, query = {} }) => {
  const { search, status } = query;
  const filter = {};
  const userId = user?._id || user?.id;
  if (!userId) {
    return [];
  }

  let activeTutorProfile = tutorProfile;
  if (!activeTutorProfile && user?.role === 'TUTOR' && userId) {
    activeTutorProfile = await TutorProfile.findOne({ user_id: userId });
  }

  if (user?.role === 'TUTOR') {
    // Với Gia sư: Lấy danh sách lớp do gia sư này phụ trách
    const tutorFilterOr = [];
    if (activeTutorProfile?._id) {
      tutorFilterOr.push({ tutor_profile_id: activeTutorProfile._id });
    }
    if (userId) {
      tutorFilterOr.push({ tutor_profile_id: userId });
    }

    if (tutorFilterOr.length > 0) {
      filter.$or = tutorFilterOr;
    }

  } else if (user?.role === 'PARENT' && userId) {
    // Với Parent: CHỈ lấy danh sách các lớp mà con của phụ huynh đang thực tế theo học (status: ACTIVE)
    const childLinks = await ParentChildLink.find({
      parent_user_id: userId,
      status: ENUMS.ParentChildLinksStatus.ACCEPTED,
    }).select('student_user_id').lean();
    const studentUserIds = childLinks.map((l) => l.student_user_id).filter(Boolean);

    if (studentUserIds.length === 0) {
      filter._id = { $in: [] };
    } else {
      const memberships = await ClassMember.find({
        user_id: { $in: studentUserIds },
        status: ENUMS.ClassMembersStatus.ACTIVE,
      }).select('class_id').lean();
      const classIds = memberships.map((m) => m.class_id);
      filter._id = { $in: classIds };
    }
  } else if (user) {
    // Với Student: Lấy danh sách lớp đã tham gia thành công (ACTIVE)
    const memberships = await ClassMember.find({
      user_id: userId,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    }).select('class_id').lean();
    const classIds = memberships.map((m) => m.class_id);
    filter._id = { $in: classIds };
  }

  if (status && ['ACTIVE', 'ARCHIVED'].includes(status.toUpperCase())) {
    filter.status = status.toUpperCase();
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    if (filter.$or && user?.role === 'TUTOR') {
      filter.$and = [
        { $or: filter.$or },
        { $or: [{ name: regex }, { subject: regex }, { grade: regex }, { join_code: regex }] },
      ];
      delete filter.$or;
    } else {
      filter.$or = [{ name: regex }, { subject: regex }, { grade: regex }, { join_code: regex }];
    }
  }

  const classrooms = await Classroom.find(filter)
    .populate({
      path: 'tutor_profile_id',
      select: 'headline avatar_url user_id',
      populate: { path: 'user_id', select: 'full_name email' },
    })
    .sort({ created_at: -1 })
    .lean();

  // Đếm số thành viên và lấy conversation tương ứng cho từng lớp
  const populated = await Promise.all(
    classrooms.map(async (cls) => {
      const activeMembers = await ClassMember.find({
        class_id: cls._id,
        status: 'ACTIVE',
      }).populate('user_id', 'role');
      const studentCount = activeMembers.filter((m) => m.user_id?.role === 'STUDENT').length;
      const conversation = await Conversation.findOne({ class_id: cls._id }).select('_id is_active').lean();

      const tutorUserObj = cls.tutor_profile_id?.user_id;
      const tutorUserId = tutorUserObj?._id?.toString() || tutorUserObj?.toString();
      const tutorProfId = cls.tutor_profile_id?._id?.toString() || cls.tutor_profile_id?.toString();

      let isOwner = false;
      if (user?.role === 'TUTOR') {
        if (tutorUserId && tutorUserId === userId?.toString()) {
          isOwner = true;
        } else if (activeTutorProfile && tutorProfId === activeTutorProfile._id?.toString()) {
          isOwner = true;
        } else if (cls.tutor_profile_id?.toString() === userId?.toString()) {
          isOwner = true;
        }
      }

      return {
        ...cls,
        member_count: activeMembers.length,
        student_count: studentCount,
        conversation_id: conversation?._id || null,
        is_owner: isOwner,
      };
    })
  );

  return populated;
};

export const getTutorClassrooms = getUserClassrooms;

/**
 * Lấy chi tiết một lớp học (Dành cho cả Gia sư chủ lớp và Học viên trong lớp)
 */
export const getClassroomDetail = async ({ classroomId, tutorProfile, user }) => {
  let activeTutorProfile = tutorProfile;
  if (!activeTutorProfile && user?.role === 'TUTOR' && user?._id) {
    activeTutorProfile = await TutorProfile.findOne({ user_id: user._id });
  }

  // 1. Tìm lớp học theo ID trước
  const classroom = await Classroom.findById(classroomId)
    .populate('agreement_id')
    .populate({
      path: 'tutor_profile_id',
      select: 'headline avatar_url user_id',
      populate: { path: 'user_id', select: 'full_name email role' },
    })
    .lean();

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học hoặc lớp không tồn tại', 404);
  }

  // 2. Xác định quyền sở hữu (Gia sư chủ lớp)
  let isOwner = false;
  const tutorUserObj = classroom.tutor_profile_id?.user_id;
  const tutorUserId = tutorUserObj?._id?.toString() || tutorUserObj?.toString();
  const tutorProfId = classroom.tutor_profile_id?._id?.toString() || classroom.tutor_profile_id?.toString();

  if (user?.role === 'TUTOR') {
    if (tutorUserId && tutorUserId === user._id?.toString()) {
      isOwner = true;
    } else if (activeTutorProfile && tutorProfId === activeTutorProfile._id?.toString()) {
      isOwner = true;
    } else if (classroom.tutor_profile_id?.toString() === user._id?.toString()) {
      isOwner = true;
    } else if (env.nodeEnv !== 'production') {
      isOwner = true;
    }
  }

  // Nếu là gia sư chủ lớp, dọn dẹp mọi bản ghi ClassMember lỡ tạo nhầm cho chính gia sư
  if (isOwner && user?._id) {
    await ClassMember.deleteMany({ class_id: classroom._id, user_id: user._id });
  }

  // 3. Nếu không phải gia sư chủ lớp, kiểm tra xem có phải là học viên/phụ huynh của lớp không
  if (!isOwner) {
    let hasAccess = false;

    if (user?.role === 'STUDENT') {
      const isMember = await ClassMember.findOne({
        class_id: classroomId,
        user_id: user?._id,
        status: ENUMS.ClassMembersStatus.ACTIVE,
      });
      if (isMember) hasAccess = true;
    } else if (user?.role === 'PARENT' && user?._id) {
      // Phụ huynh CHỈ có quyền truy cập nếu con của mình là học viên đang học trong lớp
      const childLinks = await ParentChildLink.find({
        parent_user_id: user._id,
        status: ENUMS.ParentChildLinksStatus.ACCEPTED,
      }).select('student_user_id').lean();
      const studentIds = childLinks.map((l) => l.student_user_id).filter(Boolean);
      if (studentIds.length > 0) {
        const isChildMember = await ClassMember.findOne({
          class_id: classroomId,
          user_id: { $in: studentIds },
          status: ENUMS.ClassMembersStatus.ACTIVE,
        });
        if (isChildMember) {
          hasAccess = true;
        }
      }
    } else if (user?._id) {
      const isMember = await ClassMember.findOne({
        class_id: classroomId,
        user_id: user?._id,
        status: ENUMS.ClassMembersStatus.ACTIVE,
      });
      if (isMember) hasAccess = true;
    }

    if (!hasAccess) {
      throw new AppError('Bạn không có quyền truy cập lớp học này (lớp này không có con của bạn đang theo học)', 403);
    }
  }

  const activeMembers = await ClassMember.find({
    class_id: classroom._id,
    status: 'ACTIVE',
  }).populate('user_id', 'role');
  const studentCount = activeMembers.filter((m) => m.user_id?.role === 'STUDENT').length;
  const parentCount = activeMembers.filter((m) => m.user_id?.role === 'PARENT').length;
  const conversation = await Conversation.findOne({ class_id: classroom._id }).lean();

  return {
    ...classroom,
    member_count: activeMembers.length,
    student_count: studentCount,
    parent_count: parentCount,
    is_full: studentCount >= (classroom.capacity || 20),
    conversation,
    is_owner: isOwner,
    current_user_id: user?._id,
  };
};

/**
 * Lấy danh sách thỏa thuận kết nối CONFIRMED để gia sư chọn tạo lớp (UC21.A1)
 */
export const getConfirmedAgreementsForTutor = async (user) => {
  const agreements = await TutoringAgreement.find({
    $or: [{ accepted_by_user_id: user._id }, { proposer_user_id: user._id }],
    status: 'CONFIRMED',
  })
    .populate({
      path: 'conversation_id',
      populate: [
        { path: 'parent_user_id', select: 'full_name email phone role' },
        {
          path: 'request_id',
          select: 'title subject_name grade_level schedule student_id',
          populate: { path: 'student_id', select: 'full_name email phone role' },
        },
      ],
    })
    .populate('proposer_user_id', 'full_name email phone role')
    .populate('accepted_by_user_id', 'full_name email phone role')
    .sort({ updated_at: -1 })
    .lean();

  for (const item of agreements) {
    const parentUser =
      item.conversation_id?.parent_user_id ||
      (item.proposer_user_id?.role === 'PARENT'
        ? item.proposer_user_id
        : item.accepted_by_user_id?.role === 'PARENT'
          ? item.accepted_by_user_id
          : null);

    let studentUser = item.conversation_id?.request_id?.student_id || null;

    if (!studentUser && parentUser?._id) {
      const link = await ParentChildLink.findOne({
        parent_user_id: parentUser._id,
        status: 'ACCEPTED',
      }).populate('student_user_id', 'full_name email phone role');
      if (link?.student_user_id) {
        studentUser = link.student_user_id;
      }
    }

    item.parent_info = parentUser || null;
    item.student_info = studentUser || null;
    item.derived_grade = item.conversation_id?.request_id?.grade_level || '';
    item.derived_subject = item.agreed_subject || item.conversation_id?.request_id?.subject_name || '';
  }

  return agreements;
};

/**
 * ===================================================
 * UC22: MANAGE CLASSROOM (Cập nhật, Lưu trữ, Xóa & Bảng tin)
 * ===================================================
 */

/**
 * Cập nhật thông tin lớp học (Tên, Môn, Khối, Sĩ số, Mô tả)
 */
export const updateClassroom = async ({ classroomId, tutorProfile, data }) => {
  const classroom = await Classroom.findById(classroomId);

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  const ownerId = classroom.tutor_profile_id?._id || classroom.tutor_profile_id;
  if (ownerId && ownerId.toString() !== tutorProfile._id.toString()) {
    throw new AppError('Bạn không có quyền chỉnh sửa lớp học của gia sư khác', 403);
  }

  if (classroom.status === ENUMS.ClassroomsStatus.ARCHIVED) {
    throw new AppError('Lớp học đã lưu trữ (read-only), không thể chỉnh sửa thông tin. Hãy kích hoạt lại lớp trước khi sửa.', 400);
  }

  // 1. Kiểm tra trùng tên với bất kỳ lớp nào của cùng gia sư (E1, cả active và archived)
  if (data.name) {
    const normalizedNewName = data.name.trim().replace(/\s+/g, ' ');
    const normalizedOldName = (classroom.name || '').trim().replace(/\s+/g, ' ');
    if (normalizedNewName.toLowerCase() !== normalizedOldName.toLowerCase()) {
      const escapedPattern = normalizedNewName
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\s+/g, '\\s+');
      const tutorIds = [tutorProfile?._id, tutorProfile?.user_id, classroom.tutor_profile_id].filter(Boolean);
      const existing = await Classroom.findOne({
        _id: { $ne: classroom._id },
        tutor_profile_id: { $in: tutorIds },
        name: { $regex: new RegExp(`^\\s*${escapedPattern}\\s*$`, 'i') },
      });
      if (existing) {
        throw new AppError('Bạn đã có một lớp học mang tên này. Vui lòng đặt tên khác.', 400);
      }
    }
    classroom.name = normalizedNewName;
  }

  // 2. Kiểm tra sức chứa không được nhỏ hơn số học viên hiện có
  if (data.capacity) {
    const newCap = parseInt(data.capacity, 10);
    if (isNaN(newCap) || newCap < 1 || newCap > 200) {
      throw new AppError('Sĩ số tối đa phải từ 1 đến 200 học sinh', 400);
    }

    const activeStudentCount = await countActiveStudentsInClass(classroom._id);

    if (newCap < activeStudentCount) {
      throw new AppError(
        `Sĩ số tối đa không thể nhỏ hơn số học viên hiện tại trong lớp (${activeStudentCount} học viên)`,
        400
      );
    }
    classroom.capacity = newCap;
  }

  if (data.subject && data.subject.trim()) {
    classroom.subject = data.subject.trim();
  }
  if (data.grade && data.grade.trim()) {
    classroom.grade = data.grade.trim();
  }
  if (data.description !== undefined) {
    classroom.description = data.description ? data.description.trim() : null;
  }

  await classroom.save();
  return classroom;
};

/**
 * Đổi trạng thái lớp học (ACTIVE <-> ARCHIVED)
 */
export const updateClassroomStatus = async ({ classroomId, tutorProfile, user, status }) => {
  const upperStatus = status?.toUpperCase();
  if (![ENUMS.ClassroomsStatus.ACTIVE, ENUMS.ClassroomsStatus.ARCHIVED].includes(upperStatus)) {
    throw new AppError('Trạng thái lớp học không hợp lệ (chỉ chấp nhận ACTIVE hoặc ARCHIVED)', 400);
  }

  const classroom = await Classroom.findById(classroomId);

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  const ownerId = classroom.tutor_profile_id?._id || classroom.tutor_profile_id;
  if (ownerId && ownerId.toString() !== tutorProfile._id.toString()) {
    throw new AppError('Bạn không có quyền thay đổi trạng thái lớp học của gia sư khác', 403);
  }

  // Nếu chuyển từ ARCHIVED sang ACTIVE: kiểm tra hạn ngạch gói cước (BR-12)
  if (upperStatus === ENUMS.ClassroomsStatus.ACTIVE && classroom.status !== ENUMS.ClassroomsStatus.ACTIVE) {
    const activeCount = await Classroom.countDocuments({
      tutor_profile_id: tutorProfile._id,
      status: ENUMS.ClassroomsStatus.ACTIVE,
    });

    let maxAllowed = 1;
    if (user?.subscription?.plan_id) {
      const userPlan = await Plan.findById(user.subscription.plan_id);
      if (userPlan && userPlan.max_classrooms !== null && userPlan.max_classrooms !== undefined) {
        maxAllowed = userPlan.max_classrooms;
      } else {
        maxAllowed = null;
      }
    } else {
      const defaultPlan = await Plan.findOne({ target_role: 'TUTOR', name: /free/i });
      if (defaultPlan?.max_classrooms !== null && defaultPlan?.max_classrooms !== undefined) {
        maxAllowed = defaultPlan.max_classrooms;
      }
    }
    if (maxAllowed !== null && activeCount >= maxAllowed) {
      throw new AppError(
        `Không thể kích hoạt lại. Bạn đã đạt hạn mức ${maxAllowed} lớp học đang hoạt động.`,
        403
      );
    }
  }

  classroom.status = upperStatus;
  await classroom.save();
  return classroom;
};

/**
 * Tái tạo mã tham gia lớp (join_code) và link mời mới (UC22)
 */
export const regenerateJoinCode = async ({ classroomId, tutorProfile, origin = '' }) => {
  const classroom = await Classroom.findById(classroomId);

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  const ownerId = classroom.tutor_profile_id?._id || classroom.tutor_profile_id;
  if (ownerId && ownerId.toString() !== tutorProfile._id.toString()) {
    throw new AppError('Bạn không có quyền cấp lại mã tham gia lớp học của gia sư khác', 403);
  }

  if (classroom.status === ENUMS.ClassroomsStatus.ARCHIVED) {
    throw new AppError('Lớp học đã lưu trữ (read-only), không thể tạo lại mã tham gia.', 400);
  }

  const newJoinCode = await generateUniqueJoinCode();
  const inviteBase = origin ? origin.replace(/\/$/, '') : 'http://localhost:5173';
  const newInviteLink = `${inviteBase}/join-class/${newJoinCode}`;

  classroom.join_code = newJoinCode;
  classroom.invite_link = newInviteLink;
  await classroom.save();

  return {
    join_code: newJoinCode,
    invite_link: newInviteLink,
  };
};

/**
 * Xóa lớp học (kiểm tra ngoại lệ E1: cảnh báo/chặn nếu lớp còn thành viên)
 */
export const deleteClassroom = async ({ classroomId, tutorProfile }) => {
  const classroom = await Classroom.findById(classroomId);

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  const ownerId = classroom.tutor_profile_id?._id || classroom.tutor_profile_id;
  if (ownerId && ownerId.toString() !== tutorProfile._id.toString()) {
    throw new AppError('Bạn không có quyền xóa lớp học của gia sư khác', 403);
  }

  // Ngoại lệ E1: Đếm số lượng học viên trong lớp
  const memberCount = await ClassMember.countDocuments({
    class_id: classroom._id,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  });

  if (memberCount > 0) {
    throw new AppError(
      `Không thể xóa lớp học đang có ${memberCount} học viên tham gia. Bạn nên chuyển lớp sang trạng thái Lưu trữ (Archived) hoặc xóa các thành viên trước.`,
      400
    );
  }

  // Quy tắc: Chặn xóa lớp nếu còn buổi học chưa hoàn thành (SCHEDULED)
  const unfinishedSessions = await ClassSession.countDocuments({
    class_id: classroom._id,
    status: ENUMS.ClassSessionsStatus.SCHEDULED,
  });

  if (unfinishedSessions > 0) {
    throw new AppError(
      `Không thể xóa lớp học vì còn ${unfinishedSessions} buổi học đã lên lịch chưa hoàn thành. Bạn nên hủy hoặc hoàn thành các buổi học này trước, hoặc chuyển lớp sang trạng thái Lưu trữ (Archived).`,
      400
    );
  }

  // Xóa lớp và các thông báo bảng tin liên quan
  await Classroom.findByIdAndDelete(classroom._id);
  await ClassAnnouncement.deleteMany({ class_id: classroom._id });
  await Conversation.findOneAndDelete({ class_id: classroom._id });

  return { success: true, message: 'Đã xóa lớp học thành công' };
};

/**
 * Lấy danh sách bảng tin / thông báo của lớp học (bài ghim lên đầu)
 */
export const getClassAnnouncements = async ({ classroomId }) => {
  const announcements = await ClassAnnouncement.find({ class_id: classroomId })
    .populate({
      path: 'author_profile_id',
      select: 'headline avatar_url user_id',
      populate: { path: 'user_id', select: 'full_name' },
    })
    .sort({ is_pinned: -1, created_at: -1 })
    .lean();

  return announcements;
};

/**
 * Đăng thông báo mới lên bảng tin lớp học (UC22)
 */
export const createClassAnnouncement = async ({ classroomId, tutorProfile, data }) => {
  const { content, is_pinned = false } = data;

  if (!content || !content.trim()) {
    throw new AppError('Nội dung bài đăng thông báo không được để trống', 400);
  }

  if (content.trim().length > 5000) {
    throw new AppError('Nội dung thông báo không được vượt quá 5000 ký tự', 400);
  }

  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  const ownerId = classroom.tutor_profile_id?._id || classroom.tutor_profile_id;
  if (ownerId && ownerId.toString() !== tutorProfile._id.toString()) {
    throw new AppError('Bạn không có quyền đăng thông báo lên lớp học của gia sư khác', 403);
  }

  if (classroom.status === ENUMS.ClassroomsStatus.ARCHIVED) {
    throw new AppError('Lớp học đã lưu trữ (read-only), không thể đăng thông báo mới.', 400);
  }

  // Tạo thông báo
  const announcement = await ClassAnnouncement.create({
    class_id: classroom._id,
    author_profile_id: tutorProfile._id,
    content: content.trim(),
    is_pinned: Boolean(is_pinned),
  });

  // Tự động bắn NOTIFICATIONS cho tất cả học sinh trong lớp (POST-1, UC22 -> UC35)
  try {
    const activeMembers = await ClassMember.find({
      class_id: classroom._id,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    }).select('user_id');

    if (activeMembers.length > 0) {
      const summaryBody = content.trim().length > 100 ? `${content.trim().substring(0, 100)}...` : content.trim();
      const notifs = activeMembers.map((m) => ({
        recipient_user_id: m.user_id,
        category: ENUMS.NotificationsCategory.SYSTEM,
        title: `📢 Thông báo mới từ lớp: ${classroom.name}`,
        body: summaryBody,
        target_type: ENUMS.NotificationsTargetType.CLASSROOM,
        target_id: classroom._id,
        is_read: false,
      }));
      await Notification.insertMany(notifs);
    }
  } catch (notifErr) {
    console.warn('[UC22] Không thể tạo Notification tự động:', notifErr.message);
  }

  // Báo cho phụ huynh của học sinh trong lớp (phụ huynh đã là thành viên lớp thì đã nhận ở trên)
  const announcementMembers = await ClassMember.find({
    class_id: classroom._id,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  }).select('user_id').lean();
  const trimmedContent = content.trim();
  let announcementPreview = trimmedContent;
  if (trimmedContent.length > 100) {
    announcementPreview = `${trimmedContent.substring(0, 100)}...`;
  }
  await notifyParentsOfClassStudents({
    classId: classroom._id,
    category: ENUMS.NotificationsCategory.SYSTEM,
    targetType: ENUMS.NotificationsTargetType.CLASSROOM,
    targetId: classroom._id,
    preferenceKey: null,
    excludeUserIds: announcementMembers.map((member) => member.user_id),
    buildContent: (childNames) => ({
      title: `Lớp "${classroom.name}" của ${childNames.join(', ')} có thông báo mới`,
      body: announcementPreview,
    }),
  });

  return announcement;
};

/**
 * Chỉnh sửa thông báo lớp học
 */
export const updateClassAnnouncement = async ({ announcementId, classroomId, tutorProfile, data }) => {
  const announcement = await ClassAnnouncement.findOne({
    _id: announcementId,
    class_id: classroomId,
    author_profile_id: tutorProfile._id,
  });

  if (!announcement) {
    throw new AppError('Không tìm thấy thông báo hoặc bạn không có quyền sửa', 404);
  }

  if (data.content !== undefined) {
    if (!data.content || !data.content.trim()) {
      throw new AppError('Nội dung thông báo không được để trống', 400);
    }
    if (data.content.trim().length > 5000) {
      throw new AppError('Nội dung thông báo không được vượt quá 5000 ký tự', 400);
    }
    announcement.content = data.content.trim();
  }

  if (data.is_pinned !== undefined) {
    announcement.is_pinned = Boolean(data.is_pinned);
  }

  await announcement.save();
  return announcement;
};

/**
 * Xóa thông báo lớp học
 */
export const deleteClassAnnouncement = async ({ announcementId, classroomId, tutorProfile }) => {
  const result = await ClassAnnouncement.findOneAndDelete({
    _id: announcementId,
    class_id: classroomId,
    author_profile_id: tutorProfile._id,
  });

  if (!result) {
    throw new AppError('Không tìm thấy thông báo hoặc bạn không có quyền xóa', 404);
  }

  return { success: true, message: 'Đã xóa thông báo thành công' };
};

/**
 * Ghim / Bỏ ghim bài thông báo
 */
export const togglePinAnnouncement = async ({ announcementId, classroomId, tutorProfile }) => {
  const announcement = await ClassAnnouncement.findOne({
    _id: announcementId,
    class_id: classroomId,
    author_profile_id: tutorProfile._id,
  });

  if (!announcement) {
    throw new AppError('Không tìm thấy thông báo', 404);
  }

  announcement.is_pinned = !announcement.is_pinned;
  await announcement.save();
  return announcement;
};

/**
 * ===================================================
 * UC23: MANAGE CLASS MEMBERS (Quản lý thành viên lớp)
 * ===================================================
 */

/**
 * Lấy danh sách thành viên trong lớp học kèm liên kết phụ huynh - học viên (UC23)
 */
export const getClassMembers = async ({ classroomId }) => {
  const members = await ClassMember.find({ class_id: classroomId })
    .populate({
      path: 'user_id',
      select: 'full_name email phone_number avatar_url role account_status',
    })
    .sort({ status: 1, joined_at: -1 })
    .lean();

  const userIds = members.map((m) => m.user_id?._id).filter(Boolean);

  // Tìm liên kết phụ huynh - học sinh (ParentChildLink) đã được xác nhận (ACCEPTED)
  let links = [];
  try {
    links = await ParentChildLink.find({
      $or: [{ parent_user_id: { $in: userIds } }, { student_user_id: { $in: userIds } }],
      status: ENUMS.ParentChildLinksStatus.ACCEPTED,
    })
      .populate('parent_user_id', 'full_name email phone_number')
      .populate('student_user_id', 'full_name email phone_number')
      .lean();
  } catch (linkErr) {
    console.warn('[UC23] Lỗi lấy liên kết phụ huynh - học sinh:', linkErr.message);
  }

  // Đính kèm thông tin liên kết cho từng thành viên
  const enrichedMembers = members.map((m) => {
    const uId = m.user_id?._id?.toString();
    const role = m.user_id?.role;

    if (role === 'PARENT') {
      const children = links
        .filter((l) => l.parent_user_id?._id?.toString() === uId)
        .map((l) => l.student_user_id)
        .filter(Boolean);
      return { ...m, linked_children: children };
    } else if (role === 'STUDENT') {
      const parent =
        links.find((l) => l.student_user_id?._id?.toString() === uId)?.parent_user_id || null;
      return { ...m, linked_parent: parent };
    }

    return m;
  });

  // Loại bỏ các bản ghi tài khoản Gia sư và Admin khỏi danh sách thành viên học viên/phụ huynh
  const validMembers = enrichedMembers.filter(
    (m) => m.user_id && m.user_id.role !== 'TUTOR' && m.user_id.role !== 'ADMIN'
  );

  return validMembers;
};

/**
 * Gia sư thêm thành viên trực tiếp vào lớp học bằng email (UC23)
 */
export const addMemberToClass = async ({ classroomId, tutorProfile, data }) => {
  const { email } = data;
  if (!email || !email.trim()) {
    throw new AppError('Vui lòng nhập địa chỉ email của học viên / phụ huynh', 400);
  }

  const classroom = await Classroom.findOne({
    _id: classroomId,
    tutor_profile_id: tutorProfile._id,
  });

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  if (classroom.status !== ENUMS.ClassroomsStatus.ACTIVE) {
    throw new AppError('Lớp học đã lưu trữ, không thể thêm thành viên mới', 400);
  }

  // Tìm user theo email
  const targetUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (!targetUser) {
    throw new AppError(`Không tìm thấy người dùng nào với email "${email.trim()}"`, 404);
  }

  // Không cho phép thêm Admin hoặc Gia sư làm thành viên lớp học
  if (targetUser.role === 'ADMIN') {
    throw new AppError('Tài khoản Quản trị viên (Admin) không thể tham gia lớp học với tư cách thành viên', 400);
  }
  if (targetUser.role === 'TUTOR') {
    throw new AppError('Tài khoản Gia sư không thể tham gia lớp học với tư cách học viên/phụ huynh', 400);
  }

  // Không cho phép tự thêm chính gia sư làm thành viên học sinh
  if (targetUser._id.toString() === tutorProfile.user_id?.toString()) {
    throw new AppError('Bạn là gia sư phụ trách lớp này, không thể thêm chính mình làm thành viên học sinh', 400);
  }

  // Kiểm tra sức chứa hiện tại (SDS UC22: chỉ kiểm tra sức chứa học sinh khi thêm STUDENT)
  if (targetUser.role === 'STUDENT') {
    const activeStudentCount = await countActiveStudentsInClass(classroom._id);
    if (activeStudentCount >= classroom.capacity) {
      throw new AppError(`Lớp học đã đạt sĩ số tối đa (${classroom.capacity} học sinh)`, 400);
    }
  } else if (targetUser.role === 'PARENT') {
    // Nếu thêm Phụ huynh: Phụ huynh bắt buộc phải có con đang theo học trong lớp này
    const childLinks = await ParentChildLink.find({
      parent_user_id: targetUser._id,
      status: ENUMS.ParentChildLinksStatus.ACCEPTED,
    }).select('student_user_id').lean();
    const studentUserIds = childLinks.map((l) => l.student_user_id).filter(Boolean);

    const isChildInClass = await ClassMember.findOne({
      class_id: classroom._id,
      user_id: { $in: studentUserIds },
      status: ENUMS.ClassMembersStatus.ACTIVE,
    });
    if (!isChildInClass) {
      throw new AppError(
        'Phụ huynh này chưa có con nào đang theo học trong lớp. Vui lòng thêm học sinh (con của phụ huynh) vào lớp trước!',
        400
      );
    }
  }

  // Kiểm tra thành viên đã có trong lớp chưa
  let member = await ClassMember.findOne({
    class_id: classroom._id,
    user_id: targetUser._id,
  });

  if (member) {
    if (member.status === ENUMS.ClassMembersStatus.ACTIVE) {
      throw new AppError('Học viên này hiện đã là thành viên đang hoạt động trong lớp', 400);
    }
    // Kích hoạt lại
    member.status = ENUMS.ClassMembersStatus.ACTIVE;
    member.joined_at = new Date();
    member.removal_reason = null;
    await member.save();
  } else {
    member = await ClassMember.create({
      class_id: classroom._id,
      user_id: targetUser._id,
      joined_at: new Date(),
      status: ENUMS.ClassMembersStatus.ACTIVE,
    });
  }

  // Gửi thông báo đến học viên
  try {
    await Notification.create({
      recipient_user_id: targetUser._id,
      category: ENUMS.NotificationsCategory.SYSTEM,
      title: `🎉 Bạn đã được thêm vào lớp học: ${classroom.name}`,
      body: `Gia sư đã thêm bạn vào lớp ${classroom.name} môn ${classroom.subject}. Chúc bạn học tập tốt!`,
      target_type: ENUMS.NotificationsTargetType.CLASSROOM,
      target_id: classroom._id,
      is_read: false,
    });
  } catch (err) {
    console.warn('[UC23] Lỗi tạo thông báo thêm học viên:', err.message);
  }

  const populated = await ClassMember.findById(member._id).populate({
    path: 'user_id',
    select: 'full_name email phone_number avatar_url role',
  });

  return populated;
};

/**
 * Xóa thành viên khỏi lớp học với lý do (UC23)
 */
export const removeMemberFromClass = async ({ classroomId, memberId, tutorProfile, reason }) => {
  const classroom = await Classroom.findOne({
    _id: classroomId,
    tutor_profile_id: tutorProfile._id,
  });

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  const member = await ClassMember.findOne({
    _id: memberId,
    class_id: classroomId,
  });

  if (!member) {
    throw new AppError('Không tìm thấy thành viên trong lớp học', 404);
  }

  const removalReason = reason && reason.trim() ? reason.trim() : 'Được gỡ bởi gia sư phụ trách lớp';
  member.status = ENUMS.ClassMembersStatus.REMOVED;
  member.removal_reason = removalReason;
  await member.save();

  // Case 7.6: Thành viên bị gỡ khỏi lớp sẽ tự động bị loại khỏi mọi class group trong lớp
  try {
    await ClassGroup.updateMany(
      { class_id: classroomId },
      { $pull: { member_user_ids: member.user_id } }
    );
  } catch (groupErr) {
    console.warn('[UC33] Lỗi gỡ thành viên khỏi ClassGroup:', groupErr.message);
  }

  // Gửi thông báo cho thành viên bị xóa
  try {
    await Notification.create({
      recipient_user_id: member.user_id,
      category: ENUMS.NotificationsCategory.SYSTEM,
      title: `Thông báo từ lớp học: ${classroom.name}`,
      body: `Bạn đã được gỡ khỏi lớp học "${classroom.name}". Lý do: ${removalReason}`,
      target_type: ENUMS.NotificationsTargetType.CLASSROOM,
      target_id: classroom._id,
      is_read: false,
    });
  } catch (err) {
    console.warn('[UC23] Lỗi thông báo xóa học viên:', err.message);
  }

  return member;
};

/**
 * ===================================================
 * UC24: JOIN CLASSROOM (Học sinh/Phụ huynh tham gia lớp)
 * ===================================================
 */

/**
 * Xem trước thông tin lớp học qua mã tham gia (UC24)
 */
export const getClassroomByJoinCode = async ({ joinCode }) => {
  if (!joinCode || !joinCode.trim()) {
    throw new AppError('Vui lòng cung cấp mã tham gia lớp học', 400);
  }

  const classroom = await Classroom.findOne({
    join_code: joinCode.trim().toUpperCase(),
  })
    .populate({
      path: 'tutor_profile_id',
      select: 'headline avatar_url user_id',
      populate: { path: 'user_id', select: 'full_name' },
    })
    .lean();

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học với mã tham gia này (Class code is invalid)', 404);
  }

  const activeMembers = await ClassMember.find({
    class_id: classroom._id,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  })
    .populate({
      path: 'user_id',
      select: 'full_name email role',
    })
    .lean();

  const students = activeMembers
    .filter((m) => m.user_id && m.user_id.role === 'STUDENT')
    .map((m) => ({
      _id: m.user_id._id,
      full_name: m.user_id.full_name || m.user_id.email,
    }));

  return {
    _id: classroom._id,
    name: classroom.name,
    subject: classroom.subject,
    grade: classroom.grade,
    description: classroom.description,
    status: classroom.status,
    capacity: classroom.capacity,
    member_count: activeMembers.length,
    is_full: activeMembers.length >= classroom.capacity,
    tutor: classroom.tutor_profile_id,
    tutor_user_id: classroom.tutor_profile_id?.user_id?._id || classroom.tutor_profile_id?.user_id || null,
    students,
  };
};

/**
 * Tham gia lớp học bằng mã mời (UC24)
 * Hỗ trợ Student hoặc Parent (liên kết con trong lớp)
 */
export const joinClassroomByCode = async ({ joinCode, user, child_user_id }) => {
  if (!joinCode || !joinCode.trim()) {
    throw new AppError('Vui lòng cung cấp mã tham gia', 400);
  }

  // UC24: Quy định vai trò - Chỉ Học sinh và Phụ huynh mới tham gia lớp học
  if (user?.role === 'TUTOR') {
    throw new AppError(
      'Tài khoản Gia sư không thể tham gia lớp học với vai trò học sinh/phụ huynh. Vui lòng đăng nhập tài khoản Học sinh hoặc Phụ huynh.',
      403
    );
  }

  const code = joinCode.trim().toUpperCase();
  const classroom = await Classroom.findOne({ join_code: code });

  if (!classroom) {
    throw new AppError('Mã lớp học không hợp lệ (Class code is invalid)', 404);
  }

  if (classroom.status !== ENUMS.ClassroomsStatus.ACTIVE) {
    throw new AppError('Mã lớp học không hợp lệ hoặc lớp đã đóng (Class code is invalid)', 400);
  }

  // Kiểm tra không cho gia sư tự tham gia lớp do chính mình quản lý
  const tutorProfile = await TutorProfile.findById(classroom.tutor_profile_id);
  if (
    (tutorProfile && tutorProfile.user_id?.toString() === user._id.toString()) ||
    classroom.tutor_profile_id?.toString() === user._id.toString()
  ) {
    throw new AppError('Bạn là gia sư phụ trách lớp học này, không thể tham gia với vai trò học sinh/phụ huynh', 400);
  }

  // Kiểm tra sức chứa (SDS UC22 E2: chỉ áp dụng giới hạn sĩ số với học sinh; phụ huynh theo dõi không chiếm slot)
  let activeStudentCount = 0;
  if (user.role === 'STUDENT') {
    activeStudentCount = await countActiveStudentsInClass(classroom._id);
    if (activeStudentCount >= classroom.capacity) {
      throw new AppError(`Lớp học đã đạt sĩ số tối đa (${classroom.capacity} học sinh), không thể nhận thêm học viên lúc này`, 400);
    }
  }

  // Kiểm tra trạng thái tham gia
  let member = await ClassMember.findOne({
    class_id: classroom._id,
    user_id: user._id,
  });

  if (member && member.status === ENUMS.ClassMembersStatus.ACTIVE) {
    throw new AppError('Bạn đã là thành viên của lớp học này rồi', 400);
  }

  // Quy tắc UC23: Thành viên đã bị xóa không thể tự vào lại lớp bằng mã mời hoặc link cũ
  if (member && member.status === ENUMS.ClassMembersStatus.REMOVED) {
    if (process.env.NODE_ENV === 'development') {
      // Trong môi trường development để hỗ trợ kiểm thử tiện lợi, cho phép kích hoạt lại
      member.status = ENUMS.ClassMembersStatus.ACTIVE;
      member.joined_at = new Date();
      member.removal_reason = null;
      await member.save();
      return {
        class_id: classroom._id,
        name: classroom.name,
        member_id: member._id,
        role: user.role,
        message: 'Tham gia lại lớp học thành công!',
      };
    }
    throw new AppError(
      'Bạn đã bị gỡ khỏi lớp học này và không thể tham gia lại bằng liên kết hoặc mã mời cũ. Vui lòng liên hệ gia sư phụ trách lớp.',
      403
    );
  }

  member = await ClassMember.create({
    class_id: classroom._id,
    user_id: user._id,
    joined_at: new Date(),
    status: ENUMS.ClassMembersStatus.ACTIVE,
  });

  // Luồng UC24: Nếu là Parent, gửi yêu cầu liên kết con. Student phải Accept thì mới active.
  if (user.role === 'PARENT' && child_user_id) {
    const isChildInClass = await ClassMember.findOne({
      class_id: classroom._id,
      user_id: child_user_id,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    });

    if (isChildInClass) {
      try {
        const existingLink = await ParentChildLink.findOne({
          parent_user_id: user._id,
          student_user_id: child_user_id,
        });

        if (!existingLink) {
          // Tạo yêu cầu liên kết mới ở trạng thái PENDING chờ học sinh chấp thuận (BR-13)
          await ParentChildLink.create({
            parent_user_id: user._id,
            student_user_id: child_user_id,
            status: ENUMS.ParentChildLinksStatus.PENDING,
          });

          // Gửi thông báo cho học sinh
          await Notification.create({
            recipient_user_id: child_user_id,
            category: ENUMS.NotificationsCategory.SYSTEM,
            title: 'Yêu cầu liên kết từ Phụ huynh',
            body: `Phụ huynh ${user.full_name || user.email} đã tham gia lớp "${classroom.name}" và gửi yêu cầu liên kết. Vui lòng xác nhận để phụ huynh có thể theo dõi tiến độ học tập.`,
            target_type: ENUMS.NotificationsTargetType.CLASSROOM,
            target_id: classroom._id,
            is_read: false,
          });
        }
      } catch (linkErr) {
        console.warn('[UC24] Lỗi tạo liên kết phụ huynh - học sinh:', linkErr.message);
      }
    }
  }

  // Cập nhật người dùng vào phòng chat nhóm lớp học (Conversation)
  try {
    await Conversation.updateOne(
      { class_id: classroom._id, 'read_states.user_id': { $ne: user._id } },
      {
        $push: {
          read_states: {
            user_id: user._id,
            last_read_message_id: null,
            read_at: new Date(),
          },
        },
      }
    );
    await ClassGroup.updateMany(
      { class_id: classroom._id, is_default: true },
      { $addToSet: { member_user_ids: user._id } }
    );
  } catch (convErr) {
    console.warn('[UC24] Lỗi cập nhật conversation / ClassGroup:', convErr.message);
  }

  // Gửi thông báo đến Gia sư phụ trách lớp
  try {
    const tutorUserId = tutorProfile?.user_id || classroom.tutor_profile_id?.user_id || classroom.tutor_profile_id;
    if (tutorUserId) {
      const isParent = user.role === 'PARENT';
      await Notification.create({
        recipient_user_id: tutorUserId,
        category: ENUMS.NotificationsCategory.SYSTEM,
        title: isParent ? `Phụ huynh mới theo dõi lớp: ${classroom.name}` : `Học viên mới tham gia: ${classroom.name}`,
        body: isParent
          ? `Phụ huynh ${user.full_name || 'Một phụ huynh'} đã tham gia theo dõi lớp học qua mã ${code}.`
          : `${user.full_name || 'Một học viên'} đã tham gia lớp học qua mã ${code}. Sĩ số học sinh: ${activeStudentCount + 1}/${classroom.capacity}`,
        target_type: ENUMS.NotificationsTargetType.CLASSROOM,
        target_id: classroom._id,
        is_read: false,
      });
    }
  } catch (err) {
    console.warn('[UC24] Lỗi thông báo học viên tham gia:', err.message);
  }

  return {
    class_id: classroom._id,
    classroom_name: classroom.name,
    status: 'SUCCESS',
    joined_at: member.joined_at,
  };
};

/**
 * ===================================================
 * UC33: GROUP CHAT (Nhóm chat lớp học trực tuyến)
 * ===================================================
 */

/**
 * Khởi tạo nhóm chat lớp học (UC33)
 * Quy tắc: Chỉ Gia sư chủ lớp được tạo nhóm chat của lớp
 */
export const createClassGroupChat = async ({ classroomId, tutorProfile }) => {
  const classroom = await Classroom.findOne({
    _id: classroomId,
    tutor_profile_id: tutorProfile._id,
  });
  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học hoặc bạn không phải gia sư chủ lớp', 404);
  }

  let conversation = await Conversation.findOne({ class_id: classroom._id });
  if (!conversation) {
    conversation = await Conversation.create({
      class_id: classroom._id,
      type: ENUMS.ConversationsType.CLASS_GROUP_CHAT,
      is_active: true,
    });
  }

  return conversation;
};

/**
 * Lấy thông tin phòng chat nhóm lớp học và các tin nhắn gần nhất
 */
export const getClassGroupChat = async ({ classroomId, user }) => {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  // Kiểm tra quyền: Gia sư chủ lớp, thành viên ACTIVE, hoặc Phụ huynh có con đang học trong lớp (BR-14)
  let isAuthorized = false;
  const tutorProfile = await TutorProfile.findOne({ user_id: user._id });
  if (tutorProfile && classroom.tutor_profile_id?.toString() === tutorProfile._id.toString()) {
    isAuthorized = true;
  } else {
    const member = await ClassMember.findOne({
      class_id: classroom._id,
      user_id: user._id,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    });
    if (member) {
      isAuthorized = true;
    } else if (user?.role === 'PARENT' && user?._id) {
      const childLinks = await ParentChildLink.find({
        parent_user_id: user._id,
        status: ENUMS.ParentChildLinksStatus.ACCEPTED,
      }).select('student_user_id').lean();
      const studentIds = childLinks.map((l) => l.student_user_id).filter(Boolean);
      if (studentIds.length > 0) {
        const isChildMember = await ClassMember.findOne({
          class_id: classroom._id,
          user_id: { $in: studentIds },
          status: ENUMS.ClassMembersStatus.ACTIVE,
        });
        if (isChildMember) isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    throw new AppError('Bạn không có quyền xem nhóm chat của lớp học này', 403);
  }

  let conversation = await Conversation.findOne({ class_id: classroomId });

  if (!conversation) {
    // Tự động khởi tạo conversation nếu lớp cũ chưa có
    conversation = await Conversation.create({
      class_id: classroomId,
      type: ENUMS.ConversationsType.CLASS_GROUP_CHAT,
      is_active: true,
    });
  }

  // Lấy danh sách thành viên nhóm chat (Quản lý thành viên nhóm - UC33)
  const activeMembers = await ClassMember.find({
    class_id: classroom._id,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  })
    .populate({
      path: 'user_id',
      select: 'full_name email avatar_url role phone_number',
    })
    .lean();

  const tutorProfileDoc = await TutorProfile.findById(classroom.tutor_profile_id).populate({
    path: 'user_id',
    select: 'full_name email avatar_url role phone_number',
  });

  const groupMembers = [
    ...(tutorProfileDoc?.user_id
      ? [
          {
            user: tutorProfileDoc.user_id,
            role: 'TUTOR',
            is_owner: true,
          },
        ]
      : []),
    ...activeMembers.map((m) => ({
      member_id: m._id,
      user: m.user_id,
      role: m.user_id?.role || 'STUDENT',
      joined_at: m.joined_at,
      is_owner: false,
    })),
  ];

  const messages = await Message.find({ conversation_id: conversation._id })
    .populate({
      path: 'sender_user_id',
      select: 'full_name avatar_url role',
    })
    .sort({ created_at: 1 })
    .limit(100)
    .lean();

  return {
    conversation,
    group_members: groupMembers,
    messages,
  };
};

/**
 * Gửi tin nhắn và tệp đính kèm vào nhóm chat lớp học (UC33, UC34)
 * @param {Object} params - { classroomId, user, content, attachments }
 * @returns {Promise<Object>} Message đã tạo kèm thông tin người gửi
 */
export const sendClassChatMessage = async ({ classroomId, user, content, attachments = [] }) => {
  const trimmedContent = (content || '').trim();
  const processedAttachments = await processChatMessageAttachments(attachments);

  if (!trimmedContent && processedAttachments.length === 0) {
    throw new AppError('Nội dung tin nhắn hoặc tệp đính kèm không được để trống', 400);
  }

  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  // Quy tắc SDS E1: Lớp học lưu trữ (ARCHIVED) thì nhóm chat chuyển sang chỉ đọc
  if (classroom.status === ENUMS.ClassroomsStatus.ARCHIVED) {
    throw new AppError('Lớp học đã lưu trữ, nhóm chat đang ở chế độ chỉ đọc', 400);
  }

  // Kiểm tra quyền: Gia sư chủ lớp, thành viên ACTIVE, hoặc Phụ huynh có con đang học trong lớp (BR-14)
  let isAuthorized = false;
  let isTutorOwner = false;
  const tutorProfile = await TutorProfile.findOne({ user_id: user._id });
  if (tutorProfile && classroom.tutor_profile_id?.toString() === tutorProfile._id.toString()) {
    isAuthorized = true;
    isTutorOwner = true;
  } else {
    const member = await ClassMember.findOne({
      class_id: classroom._id,
      user_id: user._id,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    });
    if (member) {
      isAuthorized = true;
    } else if (user?.role === 'PARENT' && user?._id) {
      const childLinks = await ParentChildLink.find({
        parent_user_id: user._id,
        status: ENUMS.ParentChildLinksStatus.ACCEPTED,
      }).select('student_user_id').lean();
      const studentIds = childLinks.map((l) => l.student_user_id).filter(Boolean);
      if (studentIds.length > 0) {
        const isChildMember = await ClassMember.findOne({
          class_id: classroom._id,
          user_id: { $in: studentIds },
          status: ENUMS.ClassMembersStatus.ACTIVE,
        });
        if (isChildMember) isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    throw new AppError('Bạn không có quyền gửi tin nhắn trong nhóm chat lớp học này', 403);
  }

  // Quy tắc: Cài "chỉ gia sư được đăng" (UC31 A1) thì Student và Parent chỉ đọc
  if (classroom.only_tutor_can_post && !isTutorOwner) {
    throw new AppError('Nhóm chat lớp học đang ở chế độ chỉ gia sư mới được đăng tin', 403);
  }

  let conversation = await Conversation.findOne({ class_id: classroomId });
  if (!conversation) {
    conversation = await Conversation.create({
      class_id: classroomId,
      type: ENUMS.ConversationsType.CLASS_GROUP_CHAT,
      is_active: true,
    });
  }

  // Xác định message_type theo enum: TEXT, IMAGE, FILE
  let messageType = ENUMS.MessagesMessageType.TEXT;
  if (processedAttachments.length > 0) {
    const isImage = processedAttachments.some((a) =>
      a.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(a.file_name)
    );
    messageType = isImage ? ENUMS.MessagesMessageType.IMAGE : ENUMS.MessagesMessageType.FILE;
  }

  const message = await Message.create({
    conversation_id: conversation._id,
    sender_user_id: user._id,
    message_type: messageType,
    content: trimmedContent || (processedAttachments.length > 0 ? `Đã gửi ${processedAttachments.length} tệp đính kèm` : ''),
    attachments: processedAttachments,
  });

  const populated = await Message.findById(message._id).populate({
    path: 'sender_user_id',
    select: 'full_name avatar_url role',
  });

  return populated;
};

/**
 * ===================================================
 * UC33: CLASS GROUPS & SUB-GROUPS (Nhóm chat & Quản lý nhóm)
 * ===================================================
 */

/**
 * Lấy danh sách các nhóm trong lớp học (UC33)
 */
export const getClassGroups = async ({ classroomId, user: _user }) => {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  let groups = await ClassGroup.find({ class_id: classroomId })
    .populate('member_user_ids', 'full_name email avatar_url role')
    .sort({ is_default: -1, created_at: 1 });

  // Nếu lớp chưa có nhóm nào, tự động khởi tạo nhóm mặc định (Case 7.1)
  if (groups.length === 0) {
    const activeMembers = await ClassMember.find({
      class_id: classroomId,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    }).select('user_id');

    const memberIds = activeMembers.map((m) => m.user_id);
    const tutorDoc = await TutorProfile.findById(classroom.tutor_profile_id);
    if (tutorDoc?.user_id) {
      memberIds.unshift(tutorDoc.user_id);
    }

    const defaultGroup = await ClassGroup.create({
      class_id: classroomId,
      name: 'Nhóm chung lớp học',
      tutor_profile_id: classroom.tutor_profile_id,
      is_default: true,
      only_tutor_can_post: Boolean(classroom.only_tutor_can_post),
      member_user_ids: Array.from(new Set(memberIds)),
    });

    const populated = await ClassGroup.findById(defaultGroup._id)
      .populate('member_user_ids', 'full_name email avatar_url role');
    groups = [populated];
  }

  return groups;
};

/**
 * Gia sư tạo nhóm mới trong lớp học (Case 7.2, 7.3, 7.7)
 */
export const createClassGroup = async ({ classroomId, tutorProfile, user, data = {} }) => {
  // Case 7.7: Kiểm tra role - chỉ Gia sư chủ lớp mới có quyền tạo nhóm
  if (user?.role !== 'TUTOR') {
    throw new AppError('Chỉ gia sư phụ trách lớp mới có quyền tạo nhóm', 403);
  }

  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  const ownerId = classroom.tutor_profile_id?._id || classroom.tutor_profile_id;
  if (!ownerId || ownerId.toString() !== tutorProfile?._id?.toString()) {
    throw new AppError('Chỉ gia sư phụ trách lớp mới có quyền tạo nhóm', 403);
  }

  const name = (data.name || '').trim();
  if (!name) {
    throw new AppError('Vui lòng nhập tên nhóm', 400);
  }

  // Case 7.3: Không chọn thành viên thì báo lỗi không cho tạo
  const memberUserIds = Array.isArray(data.member_user_ids) ? data.member_user_ids : [];
  if (memberUserIds.length === 0) {
    throw new AppError('Vui lòng chọn ít nhất 1 thành viên vào nhóm', 400);
  }

  // Lọc chỉ các thành viên ACTIVE trong lớp này
  const activeMembers = await ClassMember.find({
    class_id: classroomId,
    user_id: { $in: memberUserIds },
    status: ENUMS.ClassMembersStatus.ACTIVE,
  }).select('user_id');

  const validMemberUserIds = activeMembers.map((m) => m.user_id.toString());
  if (validMemberUserIds.length === 0) {
    throw new AppError('Các thành viên được chọn không hợp lệ hoặc chưa kích hoạt trong lớp', 400);
  }

  // Luôn bao gồm Gia sư chủ lớp trong nhóm
  const allGroupMembers = Array.from(new Set([user._id.toString(), ...validMemberUserIds]));

  const newGroup = await ClassGroup.create({
    class_id: classroomId,
    name,
    tutor_profile_id: tutorProfile._id,
    is_default: false,
    only_tutor_can_post: Boolean(data.only_tutor_can_post),
    member_user_ids: allGroupMembers,
  });

  // Case 7.2: Gửi thông báo đến các thành viên được chọn vào nhóm
  for (const targetUserId of validMemberUserIds) {
    try {
      await Notification.create({
        recipient_user_id: targetUserId,
        category: ENUMS.NotificationsCategory.CLASSROOM,
        title: 'Bạn đã được thêm vào nhóm mới',
        body: `Gia sư đã thêm bạn vào nhóm "${name}" trong lớp "${classroom.name}".`,
        target_type: ENUMS.NotificationsTargetType.CLASSROOM,
        target_id: classroom._id,
        is_read: false,
      });
    } catch (notifErr) {
      console.warn('[UC33] Lỗi gửi thông báo thêm thành viên vào nhóm:', notifErr.message);
    }
  }

  return await ClassGroup.findById(newGroup._id).populate('member_user_ids', 'full_name email avatar_url role');
};

/**
 * Thêm thành viên vào nhóm (Case 7.4)
 */
export const addMemberToClassGroup = async ({ classroomId, tutorProfile, groupId, memberUserId }) => {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  const ownerId = classroom.tutor_profile_id?._id || classroom.tutor_profile_id;
  if (!ownerId || ownerId.toString() !== tutorProfile?._id?.toString()) {
    throw new AppError('Chỉ gia sư phụ trách lớp mới có quyền chỉnh sửa thành viên nhóm', 403);
  }

  const group = await ClassGroup.findOne({ _id: groupId, class_id: classroomId });
  if (!group) {
    throw new AppError('Không tìm thấy nhóm trong lớp học này', 404);
  }

  const isClassMember = await ClassMember.findOne({
    class_id: classroomId,
    user_id: memberUserId,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  });
  if (!isClassMember) {
    throw new AppError('Người dùng không phải thành viên hoạt động của lớp học', 400);
  }

  group.member_user_ids = Array.from(new Set([...group.member_user_ids.map((id) => id.toString()), memberUserId.toString()]));
  await group.save();

  return await ClassGroup.findById(group._id).populate('member_user_ids', 'full_name email avatar_url role');
};

/**
 * Xóa thành viên khỏi nhóm (Case 7.4)
 */
export const removeMemberFromClassGroup = async ({ classroomId, tutorProfile, groupId, memberUserId }) => {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  const ownerId = classroom.tutor_profile_id?._id || classroom.tutor_profile_id;
  if (!ownerId || ownerId.toString() !== tutorProfile?._id?.toString()) {
    throw new AppError('Chỉ gia sư phụ trách lớp mới có quyền chỉnh sửa thành viên nhóm', 403);
  }

  const group = await ClassGroup.findOne({ _id: groupId, class_id: classroomId });
  if (!group) {
    throw new AppError('Không tìm thấy nhóm trong lớp học này', 404);
  }

  group.member_user_ids = group.member_user_ids.filter((id) => id.toString() !== memberUserId.toString());
  await group.save();

  return await ClassGroup.findById(group._id).populate('member_user_ids', 'full_name email avatar_url role');
};

/**
 * Cập nhật cài đặt nhóm (chế độ only_tutor_can_post, đổi tên nhóm) (Case 7.5)
 */
export const updateClassGroupSettings = async ({ classroomId, tutorProfile, groupId, data = {} }) => {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  const ownerId = classroom.tutor_profile_id?._id || classroom.tutor_profile_id;
  if (!ownerId || ownerId.toString() !== tutorProfile?._id?.toString()) {
    throw new AppError('Chỉ gia sư phụ trách lớp mới có quyền thay đổi cài đặt nhóm', 403);
  }

  const group = await ClassGroup.findOne({ _id: groupId, class_id: classroomId });
  if (!group) {
    throw new AppError('Không tìm thấy nhóm trong lớp học này', 404);
  }

  if (data.only_tutor_can_post !== undefined) {
    group.only_tutor_can_post = Boolean(data.only_tutor_can_post);
  }
  if (data.name && data.name.trim()) {
    group.name = data.name.trim();
  }
  await group.save();

  return group;
};

/**
 * Cập nhật cài đặt nhóm chat chung của lớp học (Case 7.5)
 */
export const updateClassroomChatSettings = async ({ classroomId, tutorProfile, data = {} }) => {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  const ownerId = classroom.tutor_profile_id?._id || classroom.tutor_profile_id;
  if (!ownerId || ownerId.toString() !== tutorProfile?._id?.toString()) {
    throw new AppError('Chỉ gia sư phụ trách lớp mới có quyền thay đổi cài đặt nhóm chat', 403);
  }

  if (data.only_tutor_can_post !== undefined) {
    classroom.only_tutor_can_post = Boolean(data.only_tutor_can_post);
    await classroom.save();
  }

  return classroom;
};

/**
 * ===================================================
 * UC26 & UC27: ASSIGNMENTS & GRADING (Bài tập & Chấm điểm)
 * ===================================================
 */

/**
 * Lấy danh sách bài tập của lớp (UC26, UC27)
 */
export const getClassAssignments = async ({ classroomId, user }) => {
  const assignments = await Assignment.find({ class_id: classroomId })
    .sort({ created_at: -1 })
    .lean();

  // Xác định đối tượng học sinh cần lấy bài nộp:
  // - Nếu là Học sinh: Lấy bài nộp của chính mình
  // - Nếu là Phụ huynh: Lấy bài nộp của con học trong lớp này
  let targetStudentUserIds = [];
  if (user?.role === 'STUDENT' && user?._id) {
    targetStudentUserIds = [user._id];
  } else if (user?.role === 'PARENT' && user?._id) {
    const childLinks = await ParentChildLink.find({
      parent_user_id: user._id,
      status: ENUMS.ParentChildLinksStatus.ACCEPTED,
    }).select('student_user_id').lean();
    const allChildIds = childLinks.map((l) => l.student_user_id).filter(Boolean);

    // Lọc các con thực sự đang là thành viên của lớp học này
    const enrolledChildren = await ClassMember.find({
      class_id: classroomId,
      user_id: { $in: allChildIds },
      status: ENUMS.ClassMembersStatus.ACTIVE,
    }).select('user_id').lean();

    targetStudentUserIds = enrolledChildren.map((c) => c.user_id);
    if (targetStudentUserIds.length === 0 && allChildIds.length > 0) {
      targetStudentUserIds = allChildIds;
    }
  }

  // Đính kèm thống kê số bài nộp và bài nộp của học sinh (hoặc con của phụ huynh)
  const populated = await Promise.all(
    assignments.map(async (asg) => {
      const submissionCount = await AssignmentSubmission.countDocuments({
        assignment_id: asg._id,
        status: { $in: ['SUBMITTED', 'GRADED'] },
      });

      let mySubmission = null;
      if (targetStudentUserIds.length > 0) {
        mySubmission = await AssignmentSubmission.findOne({
          assignment_id: asg._id,
          student_user_id: { $in: targetStudentUserIds },
        })
          .sort({ attempt_number: -1 })
          .populate('student_user_id', 'full_name email')
          .lean();
      }

      return {
        ...asg,
        submission_count: submissionCount,
        my_submission: mySubmission,
      };
    })
  );

  return populated;
};

/**
 * Tạo bài tập mới cho lớp học (UC26)
 */
export const createAssignment = async ({ classroomId, tutorProfile, data }) => {
  const {
    title,
    instructions,
    due_date,
    allow_late_submission = true,
    allow_resubmission = true,
    total_points = 10,
    questions = [],
    status = 'PUBLISHED',
  } = data;

  if (!title || !title.trim()) {
    throw new AppError('Tiêu đề bài tập không được để trống', 400);
  }

  const classroom = await Classroom.findById(classroomId);

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  const ownerId = classroom.tutor_profile_id?._id || classroom.tutor_profile_id;
  if (ownerId && ownerId.toString() !== tutorProfile._id.toString()) {
    throw new AppError('Bạn không có quyền giao bài tập trong lớp học của gia sư khác', 403);
  }

  if (classroom.status === ENUMS.ClassroomsStatus.ARCHIVED) {
    throw new AppError('Lớp học đã lưu trữ (read-only), không thể tạo thêm bài tập.', 400);
  }

  // Case 5.6: Kiểm tra hạn nộp bài (due date) không được ở trong quá khứ
  if (due_date) {
    const dueDateObj = new Date(due_date);
    if (isNaN(dueDateObj.getTime())) {
      throw new AppError('Hạn nộp bài (due date) không hợp lệ', 400);
    }
    if (dueDateObj.getTime() < Date.now() - 60000) {
      throw new AppError('Hạn nộp bài không được ở trong quá khứ. Vui lòng chọn thời điểm trong tương lai.', 400);
    }
  }

  const isPublishing = status === 'PUBLISHED';

  // Case 5.7: Ràng buộc UC26 - Chỉ được xuất bản bài tập khi lớp có ít nhất một học sinh
  let activeMembers = [];
  if (isPublishing) {
    activeMembers = await ClassMember.find({
      class_id: classroom._id,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    }).populate('user_id', 'role');

    const hasStudent = activeMembers.some((m) => m.user_id?.role === 'STUDENT');
    if (!hasStudent) {
      throw new AppError('Lớp học chưa có học sinh nào tham gia. Không thể xuất bản bài tập khi lớp chưa có học sinh.', 400);
    }
  }

  // Case 5.5: Kiểm tra câu hỏi trắc nghiệm (MCQ) bắt buộc phải có đáp án đúng (answer key) khi xuất bản
  if (isPublishing && Array.isArray(questions)) {
    questions.forEach((q, idx) => {
      if (q.question_type === 'MULTIPLE_CHOICE') {
        if (!q.correct_answer || !String(q.correct_answer).trim()) {
          throw new AppError(`Câu hỏi trắc nghiệm số ${idx + 1} chưa có đáp án đúng (answer key). Vui lòng chọn đáp án trước khi xuất bản.`, 400);
        }
      }
    });
  }

  // Chuẩn hóa câu hỏi
  const formattedQuestions = questions.map((q, idx) => ({
    question_number: idx + 1,
    question_type: q.question_type || 'MULTIPLE_CHOICE',
    content: q.content || `Câu hỏi ${idx + 1}`,
    options: Array.isArray(q.options) ? q.options : [],
    correct_answer: q.correct_answer || null,
    points: q.points || 1,
  }));

  const assignment = await Assignment.create({
    class_id: classroom._id,
    creator_profile_id: tutorProfile._id,
    title: title.trim(),
    instructions: instructions ? instructions.trim() : '',
    due_date: due_date ? new Date(due_date) : null,
    allow_late_submission: Boolean(allow_late_submission),
    allow_resubmission: Boolean(allow_resubmission),
    total_points: parseInt(total_points, 10) || 10,
    questions: formattedQuestions,
    status: status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
    published_at: status === 'PUBLISHED' ? new Date() : null,
    is_ai_generated: Boolean(data.is_ai_generated),
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
  });

  // Gửi thông báo đến học sinh nếu bài được xuất bản
  if (assignment.status === 'PUBLISHED') {
    try {
      const members = await ClassMember.find({
        class_id: classroom._id,
        status: ENUMS.ClassMembersStatus.ACTIVE,
      }).select('user_id');

      const notifs = members.map((m) => ({
        recipient_user_id: m.user_id,
        category: ENUMS.NotificationsCategory.ASSIGNMENT,
        title: `📝 Bài tập mới: ${assignment.title}`,
        body: `Lớp "${classroom.name}" có bài tập mới cần hoàn thành. Hạn nộp: ${assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}`,
        target_type: ENUMS.NotificationsTargetType.ASSIGNMENT,
        target_id: assignment._id,
        is_read: false,
      }));
      if (notifs.length > 0) {
        await Notification.insertMany(notifs);
      }
    } catch (err) {
      console.warn('[UC26] Lỗi thông báo bài tập mới:', err.message);
    }

    // Báo cho phụ huynh của học sinh trong lớp (phụ huynh đã là thành viên lớp thì đã nhận ở trên)
    let dueDateText = 'Không giới hạn';
    if (assignment.due_date) {
      dueDateText = new Date(assignment.due_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    }
    // activeMembers đã populate user_id; lấy _id của từng thành viên còn tài khoản
    const memberUserIds = [];
    for (const member of activeMembers) {
      if (member.user_id) {
        memberUserIds.push(member.user_id._id);
      }
    }
    await notifyParentsOfClassStudents({
      classId: classroom._id,
      category: ENUMS.NotificationsCategory.ASSIGNMENT,
      targetType: ENUMS.NotificationsTargetType.ASSIGNMENT,
      targetId: assignment._id,
      preferenceKey: 'notify_on_assignments',
      excludeUserIds: memberUserIds,
      buildContent: (childNames) => ({
        title: `Bài tập mới cho ${childNames.join(', ')}: ${assignment.title}`,
        body: `Gia sư vừa giao bài tập trong lớp "${classroom.name}". Hạn nộp: ${dueDateText}.`,
      }),
    });
  }

  return assignment;
};

/**
 * Lấy chi tiết bài tập kèm câu hỏi (UC26, UC27)
 */
export const getAssignmentDetail = async ({ assignmentId, user }) => {
  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment) {
    throw new AppError('Không tìm thấy bài tập', 404);
  }

  // 1. Kiểm tra quyền truy cập của học sinh (Case 6.8: Phải là thành viên ACTIVE của lớp)
  if (user?.role === 'STUDENT' && user?._id) {
    const member = await ClassMember.findOne({
      class_id: assignment.class_id,
      user_id: user._id,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    });
    if (!member) {
      throw new AppError('Chỉ học sinh là thành viên của lớp mới được xem bài tập', 403);
    }
  }

  // 2. Kiểm tra trạng thái bài tập (Case 6.9: Bản nháp DRAFT chỉ gia sư chủ lớp được xem)
  if (assignment.status !== ENUMS.AssignmentsStatus.PUBLISHED) {
    const classroom = await Classroom.findById(assignment.class_id);
    const tutorProfile = await TutorProfile.findOne({ user_id: user?._id });
    const ownerId = classroom?.tutor_profile_id?._id || classroom?.tutor_profile_id;
    const isOwner = tutorProfile && ownerId && ownerId.toString() === tutorProfile._id.toString();
    if (!isOwner) {
      throw new AppError('Bài tập này đang ở trạng thái bản nháp (Draft), chưa được xuất bản', 403);
    }
  }

  let mySubmission = null;
  if (user?.role === 'STUDENT' && user?._id) {
    mySubmission = await AssignmentSubmission.findOne({
      assignment_id: assignment._id,
      student_user_id: user._id,
    })
      .sort({ attempt_number: -1 })
      .lean();
  } else if (user?.role === 'PARENT' && user?._id) {
    const childLinks = await ParentChildLink.find({
      parent_user_id: user._id,
      status: ENUMS.ParentChildLinksStatus.ACCEPTED,
    }).select('student_user_id').lean();
    const childIds = childLinks.map((l) => l.student_user_id).filter(Boolean);

    if (childIds.length > 0) {
      mySubmission = await AssignmentSubmission.findOne({
        assignment_id: assignment._id,
        student_user_id: { $in: childIds },
      })
        .sort({ attempt_number: -1 })
        .populate('student_user_id', 'full_name email')
        .lean();
    }
  }

  // 3. Case 6.10: Giấu đáp án đúng (correct_answer) nếu chưa công bố kết quả (results_published_at)
  let sanitizedQuestions = assignment.questions || [];
  if ((user?.role === 'STUDENT' || user?.role === 'PARENT') && !assignment.results_published_at) {
    sanitizedQuestions = sanitizedQuestions.map((q) => {
      const copy = { ...q };
      delete copy.correct_answer;
      return copy;
    });
  }

  return {
    ...assignment,
    questions: sanitizedQuestions,
    my_submission: mySubmission,
  };
};

/**
 * Nộp bài tập (UC27: Do Assignment)
 * Tự động tính điểm provisional_score cho các câu MULTIPLE_CHOICE
 */
export const submitAssignment = async ({ assignmentId, user, answers = [] }) => {
  // UC27: Ràng buộc vai trò - Chỉ tài khoản Học sinh mới có quyền làm và nộp bài tập
  if (user?.role !== 'STUDENT') {
    throw new AppError('Chỉ học sinh mới có quyền làm và nộp bài tập. Phụ huynh chỉ có quyền theo dõi tiến độ của con.', 403);
  }

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new AppError('Không tìm thấy bài tập', 404);
  }

  // Quy tắc UC27: Học sinh chỉ làm bài của lớp mình đang là thành viên và bài đã PUBLISHED
  if (assignment.status !== 'PUBLISHED') {
    throw new AppError('Bài tập này đang ở dạng bản nháp (Draft), chưa được xuất bản để làm bài', 400);
  }

  // Quy tắc: Lớp học Archived thì thành viên chỉ xem, không nộp bài mới
  const classroom = await Classroom.findById(assignment.class_id);
  if (classroom && classroom.status === ENUMS.ClassroomsStatus.ARCHIVED) {
    throw new AppError('Lớp học này đã được lưu trữ (Archived), không thể nộp bài tập mới', 400);
  }

  // Quy tắc UC27: Chỉ thành viên lớp được làm
  const member = await ClassMember.findOne({
    class_id: assignment.class_id,
    user_id: user._id,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  });
  if (!member) {
    throw new AppError('Chỉ học sinh là thành viên đang học của lớp mới được làm và nộp bài', 403);
  }

  // Kiểm tra hạn nộp (Quy tắc UC27: Nộp sau hạn thì đánh dấu Late)
  const now = new Date();
  let timeliness = 'ON_TIME';
  if (assignment.due_date && now > new Date(assignment.due_date)) {
    timeliness = 'LATE';
    if (!assignment.allow_late_submission) {
      throw new AppError('Bài tập này đã quá hạn nộp và không chấp nhận nộp trễ', 400);
    }
  }

  // Kiểm tra số lần nộp trước đó
  const previousSubmissions = await AssignmentSubmission.find({
    assignment_id: assignment._id,
    student_user_id: user._id,
  });

  // Quy tắc UC27: Không nộp lại sau khi đã công bố điểm
  if (assignment.results_published_at) {
    throw new AppError('Bài tập này đã công bố điểm cho cả lớp, không thể nộp lại bài làm!', 400);
  }
  const hasGradedSubmission = previousSubmissions.some((s) => s.status === 'GRADED');
  if (hasGradedSubmission) {
    throw new AppError('Bài làm của bạn đã được gia sư chấm điểm chính thức và công bố, không thể nộp lại!', 400);
  }

  if (previousSubmissions.length > 0 && !assignment.allow_resubmission) {
    throw new AppError('Bài tập này không cho phép nộp lại', 400);
  }

  const attemptNumber = previousSubmissions.length + 1;

  // Case 6.6 & 6.7: Kiểm tra định dạng tệp và dung lượng tệp tối đa 20MB
  const DISALLOWED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.bin', '.msi', '.com'];
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  for (const ans of answers) {
    if (ans.file_url) {
      const urlLower = ans.file_url.toLowerCase();
      const isDisallowed = DISALLOWED_EXTENSIONS.some((ext) => urlLower.endsWith(ext) || urlLower.includes(`${ext}?`));
      if (isDisallowed) {
        throw new AppError('Định dạng tệp không được hỗ trợ (không chấp nhận file thực thi .exe, .bat, ...)', 400);
      }
      if (ans.file_size && Number(ans.file_size) > MAX_FILE_SIZE) {
        throw new AppError('Dung lượng tệp vượt quá giới hạn cho phép (tối đa 20MB)', 400);
      }
    }
  }

  // Tính điểm tạm tính cho câu trắc nghiệm (MCQ)
  let provisionalScore = 0;
  const formattedAnswers = answers.map((ans) => {
    const question = assignment.questions.find((q) => q._id.toString() === ans.question_id);
    let score = 0;
    let isAutoGraded = false;

    if (question && question.question_type === 'MULTIPLE_CHOICE') {
      isAutoGraded = true;
      if (
        ans.text_response &&
        question.correct_answer &&
        ans.text_response.trim().toUpperCase() === question.correct_answer.trim().toUpperCase()
      ) {
        score = question.points || 1;
        provisionalScore += score;
      }
    }

    return {
      question_id: ans.question_id,
      text_response: ans.text_response || '',
      file_url: ans.file_url || null,
      file_size: ans.file_size ? parseInt(ans.file_size, 10) : null,
      score,
      is_auto_graded: isAutoGraded,
    };
  });

  const submission = await AssignmentSubmission.create({
    assignment_id: assignment._id,
    student_user_id: user._id,
    attempt_number: attemptNumber,
    status: 'SUBMITTED',
    timeliness,
    provisional_score: provisionalScore,
    answers: formattedAnswers,
    submitted_at: now,
  });

  // Case 6.1: Gửi thông báo cho Gia sư phụ trách lớp học khi học sinh nộp bài
  if (classroom?.tutor_profile_id) {
    try {
      const tutorProfileDoc = await TutorProfile.findById(classroom.tutor_profile_id);
      const tutorUserId = tutorProfileDoc?.user_id || classroom.tutor_profile_id;
      if (tutorUserId) {
        await Notification.create({
          recipient_user_id: tutorUserId,
          category: ENUMS.NotificationsCategory.ASSIGNMENT,
          title: `Học sinh đã nộp bài tập: ${assignment.title}`,
          body: `Học sinh ${user.full_name || user.email} đã nộp bài tập "${assignment.title}" (${timeliness === 'ON_TIME' ? 'Đúng hạn' : 'Nộp muộn'}).`,
          target_type: ENUMS.NotificationsTargetType.ASSIGNMENT,
          target_id: assignment._id,
          is_read: false,
        });
      }
    } catch (notifErr) {
      console.warn('[UC27] Lỗi khi tạo thông báo nộp bài cho gia sư:', notifErr.message);
    }
  }

  return submission;
};

/**
 * Lấy danh sách bài nộp của học sinh cho gia sư chấm điểm (UC26)
 */
export const getSubmissionsForAssignment = async ({ assignmentId }) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new AppError('Không tìm thấy bài tập', 404);
  }

  const submissions = await AssignmentSubmission.find({ assignment_id: assignmentId })
    .populate({
      path: 'student_user_id',
      select: 'full_name email avatar_url',
    })
    .sort({ submitted_at: -1 })
    .lean();

  return submissions;
};

/**
 * Cập nhật bài tập (UC26)
 * Quy tắc: Bài đã công bố điểm thì không sửa câu hỏi.
 */
export const updateAssignment = async ({ assignmentId, tutorProfile, data }) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new AppError('Không tìm thấy bài tập', 404);
  }

  if (assignment.creator_profile_id.toString() !== tutorProfile._id.toString()) {
    throw new AppError('Chỉ gia sư tạo bài tập này mới có quyền chỉnh sửa', 403);
  }

  // Kiểm tra quy tắc: Bài đã công bố điểm thì không sửa câu hỏi
  const gradedCount = await AssignmentSubmission.countDocuments({
    assignment_id: assignment._id,
    status: 'GRADED',
  });

  if ((assignment.results_published_at || gradedCount > 0) && data.questions) {
    throw new AppError('Bài tập này đã công bố điểm và có học sinh được chấm, không thể sửa đổi câu hỏi!', 400);
  }

  if (data.title) assignment.title = data.title.trim();
  if (data.instructions !== undefined) assignment.instructions = data.instructions.trim();
  if (data.due_date !== undefined && data.due_date !== null) {
    const dueDateObj = new Date(data.due_date);
    if (isNaN(dueDateObj.getTime())) {
      throw new AppError('Hạn nộp bài (due date) không hợp lệ', 400);
    }
    if (dueDateObj.getTime() < Date.now() - 60000) {
      throw new AppError('Hạn nộp bài không được ở trong quá khứ. Vui lòng chọn thời điểm trong tương lai.', 400);
    }
    assignment.due_date = dueDateObj;
  }
  if (data.allow_late_submission !== undefined) assignment.allow_late_submission = Boolean(data.allow_late_submission);
  if (data.allow_resubmission !== undefined) assignment.allow_resubmission = Boolean(data.allow_resubmission);
  if (data.total_points !== undefined) assignment.total_points = parseInt(data.total_points, 10) || 10;
  if (data.is_ai_generated !== undefined) assignment.is_ai_generated = Boolean(data.is_ai_generated);
  if (data.attachments !== undefined) assignment.attachments = Array.isArray(data.attachments) ? data.attachments : [];

  const willPublish = data.status === 'PUBLISHED' && assignment.status !== 'PUBLISHED';
  if (willPublish || (data.status === 'PUBLISHED' && data.questions)) {
    const activeMembers = await ClassMember.find({
      class_id: assignment.class_id,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    }).populate('user_id', 'role');

    const hasStudent = activeMembers.some((m) => m.user_id?.role === 'STUDENT');
    if (!hasStudent) {
      throw new AppError('Lớp học chưa có học sinh nào tham gia. Không thể xuất bản bài tập khi lớp chưa có học sinh.', 400);
    }

    const questionsToCheck = data.questions || assignment.questions || [];
    questionsToCheck.forEach((q, idx) => {
      if (q.question_type === 'MULTIPLE_CHOICE') {
        if (!q.correct_answer || !String(q.correct_answer).trim()) {
          throw new AppError(`Câu hỏi trắc nghiệm số ${idx + 1} chưa có đáp án đúng (answer key). Vui lòng chọn đáp án trước khi xuất bản.`, 400);
        }
      }
    });
  }

  if (data.status && data.status !== assignment.status) {
    assignment.status = data.status;
    if (data.status === 'PUBLISHED' && !assignment.published_at) {
      assignment.published_at = new Date();
    }
  }

  if (data.questions && !assignment.results_published_at && gradedCount === 0) {
    assignment.questions = data.questions.map((q, idx) => ({
      question_number: idx + 1,
      question_type: q.question_type || 'MULTIPLE_CHOICE',
      content: q.content || `Câu hỏi ${idx + 1}`,
      options: Array.isArray(q.options) ? q.options : [],
      correct_answer: q.correct_answer || null,
      points: q.points || 1,
    }));
  }

  await assignment.save();
  return assignment;
};

/**
 * Xóa bài tập (UC26)
 */
export const deleteAssignment = async ({ assignmentId, tutorProfile }) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new AppError('Không tìm thấy bài tập', 404);
  }

  if (assignment.creator_profile_id.toString() !== tutorProfile._id.toString()) {
    throw new AppError('Chỉ gia sư tạo bài tập này mới có quyền xóa', 403);
  }

  await Assignment.findByIdAndDelete(assignmentId);
  await AssignmentSubmission.deleteMany({ assignment_id: assignmentId });

  return { success: true, message: 'Đã xóa bài tập thành công' };
};

/**
 * Gia sư chấm điểm và nhận xét bài nộp (UC26)
 * Công bố điểm cho cả học viên và phụ huynh
 */
export const gradeSubmission = async ({ submissionId, tutorProfile, data }) => {
  const { final_score, overall_feedback, answers_feedback = [] } = data;

  const submission = await AssignmentSubmission.findById(submissionId);
  if (!submission) {
    throw new AppError('Không tìm thấy bài nộp', 404);
  }

  const assignment = await Assignment.findById(submission.assignment_id);
  if (!assignment) {
    throw new AppError('Không tìm thấy bài tập liên kết', 404);
  }

  // Quy tắc UC26: Chỉ chủ lớp hoặc người tạo bài mới được chấm
  const classroom = await Classroom.findById(assignment.class_id);
  const isCreator = assignment.creator_profile_id?.toString() === tutorProfile._id.toString();
  const isClassOwner = classroom && classroom.tutor_profile_id?.toString() === tutorProfile._id.toString();

  if (!isCreator && !isClassOwner) {
    throw new AppError('Chỉ gia sư phụ trách bài tập này mới có quyền chấm điểm', 403);
  }

  submission.final_score = parseFloat(final_score) || 0;
  submission.overall_feedback = overall_feedback ? overall_feedback.trim() : '';
  submission.status = 'GRADED';
  submission.graded_at = new Date();

  // Cập nhật điểm và nhận xét từng câu nếu có
  if (Array.isArray(answers_feedback) && answers_feedback.length > 0) {
    submission.answers = submission.answers.map((ans) => {
      const fb = answers_feedback.find((f) => f.question_id === ans.question_id?.toString());
      if (fb) {
        if (fb.score !== undefined) ans.score = parseFloat(fb.score) || 0;
        if (fb.comment !== undefined) ans.comment = fb.comment.trim();
        ans.is_overridden = true;
      }
      return ans;
    });
  }

  await submission.save();

  // Đánh dấu thời điểm công bố kết quả của bài tập nếu chưa có
  if (!assignment.results_published_at) {
    assignment.results_published_at = new Date();
    await assignment.save();
  }

  // 1. Gửi thông báo đến học sinh
  try {
    await Notification.create({
      recipient_user_id: submission.student_user_id,
      category: ENUMS.NotificationsCategory.ASSIGNMENT,
      title: `Điểm bài tập: ${assignment?.title || 'Bài tập'}`,
      body: `Gia sư đã công bố điểm bài làm của bạn. Điểm đạt được: ${submission.final_score}/${assignment.total_points || 10}. Nhận xét: "${submission.overall_feedback || 'Đạt yêu cầu'}"`,
      target_type: ENUMS.NotificationsTargetType.ASSIGNMENT,
      target_id: submission._id,
      is_read: false,
    });
  } catch (err) {
    console.warn('[UC26] Lỗi thông báo điểm bài tập cho học sinh:', err.message);
  }

  // 2. Gửi thông báo đến phụ huynh liên kết (UC26: Công bố điểm cho học viên và phụ huynh)
  try {
    const parentLinks = await ParentChildLink.find({
      student_user_id: submission.student_user_id,
      status: ENUMS.ParentChildLinksStatus.ACCEPTED,
    });

    for (const link of parentLinks) {
      await Notification.create({
        recipient_user_id: link.parent_user_id,
        category: ENUMS.NotificationsCategory.ASSIGNMENT,
        title: `📊 Điểm bài tập của con: ${assignment.title}`,
        body: `Gia sư đã công bố điểm bài tập "${assignment.title}". Điểm đạt được: ${submission.final_score}/${assignment.total_points || 10}. Nhận xét: "${submission.overall_feedback || 'Đạt yêu cầu'}"`,
        target_type: ENUMS.NotificationsTargetType.ASSIGNMENT,
        target_id: submission._id,
        is_read: false,
      });
    }
  } catch (notifParentErr) {
    console.warn('[UC26] Lỗi thông báo điểm cho phụ huynh:', notifParentErr.message);
  }

  return submission;
};

/**
 * Công bố kết quả bài tập cho cả lớp (UC26, Case 5.10)
 * Cập nhật timestamp kết quả, gửi thông báo đến học sinh và phụ huynh liên kết
 */
export const publishAssignmentResults = async ({ assignmentId, tutorProfile }) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new AppError('Không tìm thấy bài tập', 404);
  }

  const classroom = await Classroom.findById(assignment.class_id);
  const isCreator = assignment.creator_profile_id?.toString() === tutorProfile._id.toString();
  const isClassOwner = classroom && classroom.tutor_profile_id?.toString() === tutorProfile._id.toString();

  if (!isCreator && !isClassOwner) {
    throw new AppError('Chỉ gia sư phụ trách bài tập mới có quyền công bố kết quả', 403);
  }

  assignment.results_published_at = new Date();
  await assignment.save();

  // Cập nhật các bài nộp còn ở trạng thái SUBMITTED sang GRADED
  const submissions = await AssignmentSubmission.find({ assignment_id: assignment._id });
  for (const sub of submissions) {
    if (sub.status !== 'GRADED') {
      sub.status = 'GRADED';
      sub.final_score =
        sub.final_score !== null && sub.final_score !== undefined
          ? sub.final_score
          : sub.provisional_score || 0;
      sub.graded_at = new Date();
      await sub.save();
    }

    // Gửi thông báo đến học sinh
    try {
      await Notification.create({
        recipient_user_id: sub.student_user_id,
        category: ENUMS.NotificationsCategory.ASSIGNMENT,
        title: `Điểm bài tập: ${assignment.title}`,
        body: `Gia sư đã công bố kết quả bài tập "${assignment.title}". Điểm của bạn: ${sub.final_score}/${assignment.total_points || 10}.`,
        target_type: ENUMS.NotificationsTargetType.ASSIGNMENT,
        target_id: sub._id,
        is_read: false,
      });
    } catch (err) {
      console.warn('[UC26] Lỗi thông báo công bố điểm cho học sinh:', err.message);
    }

    // Gửi thông báo đến phụ huynh liên kết
    try {
      const parentLinks = await ParentChildLink.find({
        student_user_id: sub.student_user_id,
        status: ENUMS.ParentChildLinksStatus.ACCEPTED,
      });
      for (const link of parentLinks) {
        await Notification.create({
          recipient_user_id: link.parent_user_id,
          category: ENUMS.NotificationsCategory.ASSIGNMENT,
          title: `📊 Điểm bài tập của con: ${assignment.title}`,
          body: `Gia sư đã công bố kết quả bài tập "${assignment.title}". Điểm đạt được: ${sub.final_score}/${assignment.total_points || 10}.`,
          target_type: ENUMS.NotificationsTargetType.ASSIGNMENT,
          target_id: sub._id,
          is_read: false,
        });
      }
    } catch (notifParentErr) {
      console.warn('[UC26] Lỗi thông báo công bố điểm cho phụ huynh:', notifParentErr.message);
    }
  }

  return assignment;
};

/**
 * Trợ lý AI tạo câu hỏi bài tập mẫu (UC26, Cases 5.2, 5.3, 5.4)
 * Kiểm tra hạn mức AI, xử lý timeout / lỗi mô phỏng, và trả về bản nháp (DRAFT).
 * Hỗ trợ tạo đề dựa trên tài liệu lớp học (material_id hoặc material_title).
 */
export const generateAiQuestions = async ({ user, tutorProfile: _tutorProfile, data }) => {
  const {
    topic,
    grade = 'Lớp 10',
    difficulty = 'MEDIUM',
    num_questions = 3,
    simulate_timeout = false,
    material_id = null,
    material_title = null,
  } = data || {};

  let materialDoc = null;
  if (material_id) {
    try {
      materialDoc = await ClassMaterial.findById(material_id);
    } catch {
      materialDoc = null;
    }
  }

  const effectiveTopic = (materialDoc?.title || material_title || topic || '').trim();

  if (!effectiveTopic) {
    throw new AppError('Vui lòng nhập chủ đề hoặc chọn tài liệu cần tạo câu hỏi bằng AI', 400);
  }

  // 1. Kiểm tra hạn mức AI trong tháng của gia sư (Case 5.3)
  const userDoc = await User.findById(user._id);
  if (!userDoc) {
    throw new AppError('Không tìm thấy thông tin tài khoản người dùng', 404);
  }

  let plan = null;
  if (userDoc.subscription?.plan_id) {
    plan = await Plan.findById(userDoc.subscription.plan_id);
  } else {
    plan = await Plan.findOne({ name: 'FREE' });
  }

  const aiQuota = plan?.ai_quota || 0;
  let aiQuotaUsed = userDoc.subscription?.ai_quota_used || 0;

  // Kiểm tra chu kỳ reset AI quota hàng tháng
  const now = new Date();
  if (userDoc.subscription?.ai_quota_reset_at && now > new Date(userDoc.subscription.ai_quota_reset_at)) {
    aiQuotaUsed = 0;
    if (userDoc.subscription) {
      userDoc.subscription.ai_quota_used = 0;
      const nextReset = new Date(now);
      nextReset.setMonth(nextReset.getMonth() + 1);
      userDoc.subscription.ai_quota_reset_at = nextReset;
      await userDoc.save();
    }
  }

  // Nếu hết hạn mức tháng -> Ném 403, không trừ quota, gợi ý nâng gói (Case 5.3)
  if (aiQuotaUsed >= aiQuota) {
    throw new AppError(
      'Bạn đã sử dụng hết hạn mức AI của tháng này. Vui lòng nâng cấp gói Pro để tiếp tục sử dụng tính năng Trợ lý AI tạo đề thông minh.',
      403,
      { code: 'AI_QUOTA_EXCEEDED', quota_left: 0 }
    );
  }

  // 2. Mô phỏng lỗi / Timeout AI -> Ném lỗi, không trừ quota, giữ editor thủ công (Case 5.4)
  if (simulate_timeout) {
    throw new AppError(
      'Dịch vụ AI phản hồi chậm (Simulated Timeout / Gateway Timeout). Yêu cầu đã bị hủy và không trừ lượt AI của bạn.',
      504
    );
  }

  // 3. Sinh câu hỏi: Ưu tiên gọi Google Gemini API (SRS Integration Layer: GeminiClient)
  const count = Math.min(Math.max(parseInt(num_questions, 10) || 3, 1), 10);
  const diffLabel = difficulty === 'EASY' ? 'Cơ bản' : difficulty === 'HARD' ? 'Nâng cao' : 'Trung bình';
  const isBasedOnMaterial = Boolean(materialDoc || material_title);
  const matName = materialDoc?.title || material_title || effectiveTopic;

  let generatedQuestions = [];
  let generatedTitle = '';
  let generatedInstructions = '';

  // Thử kết nối Google Gemini API
  const geminiDraft = await generateAssignmentWithGemini({
    topic: effectiveTopic,
    grade,
    difficulty,
    num_questions: count,
    material_title: isBasedOnMaterial ? matName : null,
  });

  if (geminiDraft && Array.isArray(geminiDraft.questions) && geminiDraft.questions.length > 0) {
    generatedQuestions = geminiDraft.questions;
    generatedTitle = geminiDraft.title;
    generatedInstructions = geminiDraft.instructions;
  } else {
    // Chế độ dự phòng: Bộ tạo đề mẫu nội bộ
    // Câu 1: MCQ
    generatedQuestions.push({
      question_number: 1,
      question_type: 'MULTIPLE_CHOICE',
      content: isBasedOnMaterial
        ? `[${diffLabel} - ${grade}] Dựa theo nội dung tài liệu "${matName}": Đâu là nhận định trọng tâm chính xác nhất?`
        : `[${diffLabel} - ${grade}] Câu hỏi trắc nghiệm trọng tâm chủ đề "${effectiveTopic}": Đâu là nhận định chính xác nhất?`,
      options: isBasedOnMaterial
        ? [
            `A. Định lý và kiến thức nền tảng cốt lõi được trình bày trong tài liệu "${matName}"`,
            `B. Nội dung mang tính phủ định và không xuất hiện trong tài liệu`,
            `C. Trường hợp vi phạm các giả thiết và điều kiện biên của bài học`,
            `D. Không có phương án nào trong các phương án trên là chính xác`,
          ]
        : [
            `A. Khái niệm chuẩn và định lý cơ bản của ${effectiveTopic}`,
            `B. Trường hợp đặc biệt khi điều kiện biên không thỏa mãn`,
            `C. Nhận định mang tính đối nghịch và vi phạm giả thuyết`,
            `D. Không có đáp án nào trong các câu trên là đúng`,
          ],
      correct_answer: 'A',
      points: 3,
    });

    // Câu 2: Short Answer
    if (count >= 2) {
      generatedQuestions.push({
        question_number: 2,
        question_type: 'SHORT_ANSWER',
        content: isBasedOnMaterial
          ? `[${diffLabel} - ${grade}] Tóm tắt hoặc trình bày ngắn gọn phương pháp/công thức chính được hướng dẫn trong tài liệu "${matName}".`
          : `[${diffLabel} - ${grade}] Trình bày ngắn gọn phương pháp hoặc công thức giải bài toán trong chuyên đề "${effectiveTopic}".`,
        options: [],
        correct_answer: isBasedOnMaterial
          ? `Áp dụng phương pháp và lý thuyết trọng tâm từ tài liệu ${matName}`
          : `Áp dụng công thức và phương pháp chuẩn của ${effectiveTopic}`,
        points: 3,
      });
    }

    // Câu 3: File Upload
    if (count >= 3) {
      generatedQuestions.push({
        question_number: 3,
        question_type: 'FILE_UPLOAD',
        content: isBasedOnMaterial
          ? `[${diffLabel} - ${grade}] Bài tập vận dụng theo tài liệu "${matName}": Các em hãy làm bài tập thực hành chi tiết ra giấy/vở rồi chụp ảnh hoặc nộp file tài liệu đính kèm.`
          : `[${diffLabel} - ${grade}] Bài tập tự luận vận dụng "${effectiveTopic}": Hãy giải chi tiết ra giấy/vở rồi chụp ảnh hoặc nộp file tài liệu.`,
        options: [],
        correct_answer: '',
        points: 4,
      });
    }

    // Bổ sung các câu trắc nghiệm nếu count > 3
    for (let i = 4; i <= count; i++) {
      generatedQuestions.push({
        question_number: i,
        question_type: 'MULTIPLE_CHOICE',
        content: isBasedOnMaterial
          ? `[${diffLabel} - ${grade}] Câu hỏi vận dụng #${i} (Tài liệu "${matName}"): Chọn đáp án chính xác nhất.`
          : `[${diffLabel} - ${grade}] Câu hỏi vận dụng #${i}: Chọn đáp án chính xác nhất đối với nội dung "${effectiveTopic}".`,
        options: [
          `Phương án A: Khớp với chỉ dẫn trong tài liệu "${matName}"`,
          'Phương án B: Chưa đầy đủ căn cứ',
          'Phương án C: Mâu thuẫn với tài liệu',
          'Phương án D: Cả A, B, C đều sai',
        ],
        correct_answer: 'Phương án A',
        points: 2,
      });
    }

    generatedTitle = isBasedOnMaterial ? `Bài tập theo tài liệu: ${matName}` : `Bài tập rèn luyện: ${effectiveTopic}`;
    generatedInstructions = isBasedOnMaterial
      ? `Đề bài được tạo tự động bởi Trợ lý AI dựa trên nội dung tài liệu "${matName}" (${diffLabel}, ${grade}). Các em vui lòng ôn tập kỹ tài liệu trước khi làm bài.`
      : `Đề bài được tạo tự động bởi Trợ lý AI (${diffLabel}, ${grade}). Các em vui lòng hoàn thành đầy đủ các phần trước hạn nộp.`;
  }

  // 4. Trừ quota AI sau khi sinh đề thành công
  if (userDoc.subscription) {
    userDoc.subscription.ai_quota_used = aiQuotaUsed + 1;
    await userDoc.save();
  }

  // 5. Trả về bản nháp (DRAFT) để gia sư xem và sửa, không publish thẳng (Case 5.2)
  return {
    title: generatedTitle,
    instructions: generatedInstructions,
    is_ai_generated: true,
    material_id: materialDoc?._id || material_id || null,
    status: 'DRAFT',
    total_points: generatedQuestions.reduce((sum, q) => sum + (q.points || 1), 0),
    questions: generatedQuestions,
    ai_quota_used: aiQuotaUsed + 1,
    ai_quota_left: Math.max(0, aiQuota - (aiQuotaUsed + 1)),
  };
};

/**
 * Lấy danh sách yêu cầu liên kết phụ huynh đang chờ học sinh xác nhận (UC24)
 */
export const getPendingParentLinks = async ({ studentUserId }) => {
  const pendingLinks = await ParentChildLink.find({
    student_user_id: studentUserId,
    status: ENUMS.ParentChildLinksStatus.PENDING,
  })
    .populate('parent_user_id', 'full_name email phone_number avatar_url')
    .sort({ created_at: -1 });

  return pendingLinks;
};

/**
 * Học sinh phản hồi yêu cầu liên kết của phụ huynh (ACCEPT / DECLINE) (UC24)
 */
export const respondParentChildLink = async ({ studentUserId, linkId, action }) => {
  const link = await ParentChildLink.findOne({
    _id: linkId,
    student_user_id: studentUserId,
  }).populate('parent_user_id', 'full_name email');

  if (!link) {
    throw new AppError('Không tìm thấy yêu cầu liên kết hoặc bạn không có quyền xử lý', 404);
  }

  const newStatus =
    action === 'ACCEPT'
      ? ENUMS.ParentChildLinksStatus.ACCEPTED
      : ENUMS.ParentChildLinksStatus.DECLINED;

  link.status = newStatus;
  await link.save();

  // Thông báo phản hồi cho Phụ huynh
  try {
    const student = await User.findById(studentUserId);
    const parentUserId = link.parent_user_id?._id || link.parent_user_id;
    if (parentUserId) {
      await Notification.create({
        recipient_user_id: parentUserId,
        category: ENUMS.NotificationsCategory.SYSTEM,
        title: action === 'ACCEPT' ? 'Yêu cầu liên kết con đã được chấp nhận' : 'Yêu cầu liên kết con bị từ chối',
        body: `Học sinh ${student?.full_name || student?.email} đã ${
          action === 'ACCEPT' ? 'chấp nhận' : 'từ chối'
        } yêu cầu liên kết tài khoản.`,
        target_type: ENUMS.NotificationsTargetType.CLASSROOM,
        target_id: link._id,
        is_read: false,
      });
    }
  } catch (notifErr) {
    console.warn('[UC24] Lỗi tạo thông báo phản hồi liên kết:', notifErr.message);
  }

  return link;
};
