import crypto from 'crypto';
import { Classroom } from '../models/Classroom.js';
import { Conversation } from '../models/Conversation.js';
import { ClassMember } from '../models/ClassMember.js';
import { ClassAnnouncement } from '../models/ClassAnnouncement.js';
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
import { AppError } from '../common/utils/AppError.js';
import { ENUMS } from '../models/enums.js';

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

  // Sĩ số tối đa: mặc định 20 học sinh nếu không nhập
  let parsedCapacity = 20;
  if (capacity !== undefined && capacity !== null && capacity !== '') {
    parsedCapacity = parseInt(capacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity < 1 || parsedCapacity > 200) {
      throw new AppError('Sức chứa của lớp học phải là số nguyên từ 1 đến 200 học sinh', 400);
    }
  }

  // 2. Kiểm tra ngoại lệ E1: Trùng tên lớp đối với cùng 1 gia sư (Primary Actor, E1)
  const existingClass = await Classroom.findOne({
    tutor_profile_id: tutorProfile._id,
    name: name.trim(),
    status: 'ACTIVE',
  });
  if (existingClass) {
    throw new AppError('Bạn đã có một lớp học mang tên này đang hoạt động. Vui lòng đặt tên khác.', 400);
  }

  // 3. Kiểm tra quy tắc BR-12: Kiểm tra hạn ngạch số lớp tạo theo gói của gia sư (PLANS.max_classrooms)
  const currentActiveCount = await Classroom.countDocuments({
    tutor_profile_id: tutorProfile._id,
    status: 'ACTIVE',
  });

  let maxAllowed = 5; // Mặc định nếu chưa cấu hình gói
  let planName = 'Cơ bản (Free)';

  if (user?.subscription?.plan_id) {
    const userPlan = await Plan.findById(user.subscription.plan_id);
    if (userPlan) {
      planName = userPlan.name || planName;
      if (userPlan.max_classrooms !== null && userPlan.max_classrooms !== undefined) {
        maxAllowed = userPlan.max_classrooms;
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
    const agreement = await TutoringAgreement.findById(agreement_id);
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

  // Tự động thêm học sinh/phụ huynh vào lớp nếu tạo từ thỏa thuận kết nối
  if (verifiedAgreement) {
    const studentUserId =
      verifiedAgreement.proposer_user_id?.toString() === user._id.toString()
        ? verifiedAgreement.accepted_by_user_id
        : verifiedAgreement.proposer_user_id;

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

  return {
    classroom,
    conversation_id: conversation?._id || null,
  };
};

/**
 * Lấy danh sách lớp học của người dùng hiện tại (Hỗ trợ cả Gia sư chủ lớp, Học viên và Phụ huynh)
 */
export const getUserClassrooms = async ({ user, tutorProfile, query = {} }) => {
  const { search, status } = query;
  let filter = {};

  let activeTutorProfile = tutorProfile;
  if (!activeTutorProfile && user?.role === 'TUTOR' && user?._id) {
    activeTutorProfile = await TutorProfile.findOne({ user_id: user._id });
  }

  if (user?.role === 'TUTOR') {
    // Với Gia sư: Lấy danh sách lớp do gia sư này phụ trách
    const tutorFilterOr = [];
    if (activeTutorProfile?._id) {
      tutorFilterOr.push({ tutor_profile_id: activeTutorProfile._id });
    }
    if (user._id) {
      tutorFilterOr.push({ tutor_profile_id: user._id });
    }

    if (tutorFilterOr.length > 0) {
      filter.$or = tutorFilterOr;
    }

    // Nếu môi trường dev mà chưa có lớp nào khớp, hiển thị các lớp cho dev test
    if (env.nodeEnv !== 'production') {
      const count = await Classroom.countDocuments(filter);
      if (count === 0) {
        filter = {};
      }
    }
  } else if (user) {
    // Với Student / Parent: Lấy danh sách lớp đã tham gia thành công (ACTIVE)
    const memberships = await ClassMember.find({
      user_id: user._id,
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
      const memberCount = await ClassMember.countDocuments({
        class_id: cls._id,
        status: 'ACTIVE',
      });
      const conversation = await Conversation.findOne({ class_id: cls._id }).select('_id is_active').lean();

      const tutorUserObj = cls.tutor_profile_id?.user_id;
      const tutorUserId = tutorUserObj?._id?.toString() || tutorUserObj?.toString();
      const tutorProfId = cls.tutor_profile_id?._id?.toString() || cls.tutor_profile_id?.toString();

      let isOwner = false;
      if (user?.role === 'TUTOR') {
        if (tutorUserId && tutorUserId === user._id?.toString()) {
          isOwner = true;
        } else if (activeTutorProfile && tutorProfId === activeTutorProfile._id?.toString()) {
          isOwner = true;
        } else if (cls.tutor_profile_id?.toString() === user._id?.toString()) {
          isOwner = true;
        } else if (env.nodeEnv !== 'production') {
          isOwner = true;
        }
      }

      return {
        ...cls,
        member_count: memberCount,
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
    const isMember = await ClassMember.findOne({
      class_id: classroomId,
      user_id: user?._id,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    });
    if (!isMember && env.nodeEnv === 'production') {
      throw new AppError('Bạn không có quyền truy cập lớp học này', 403);
    }
  }

  const memberCount = await ClassMember.countDocuments({
    class_id: classroom._id,
    status: 'ACTIVE',
  });
  const conversation = await Conversation.findOne({ class_id: classroom._id }).lean();

  return {
    ...classroom,
    member_count: memberCount,
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
    .sort({ updated_at: -1 })
    .lean();

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
  const classroom = await Classroom.findOne({
    _id: classroomId,
    tutor_profile_id: tutorProfile._id,
  });

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học hoặc bạn không có quyền chỉnh sửa', 404);
  }

  // 1. Kiểm tra trùng tên với lớp khác đang ACTIVE của cùng gia sư (E1)
  if (data.name && data.name.trim() !== classroom.name) {
    const existing = await Classroom.findOne({
      _id: { $ne: classroom._id },
      tutor_profile_id: tutorProfile._id,
      name: data.name.trim(),
      status: ENUMS.ClassroomsStatus.ACTIVE,
    });
    if (existing) {
      throw new AppError('Bạn đã có một lớp học khác mang tên này đang hoạt động.', 400);
    }
    classroom.name = data.name.trim();
  }

  // 2. Kiểm tra sức chứa không được nhỏ hơn số học viên hiện có
  if (data.capacity) {
    const newCap = parseInt(data.capacity, 10);
    if (isNaN(newCap) || newCap < 1 || newCap > 200) {
      throw new AppError('Sĩ số tối đa phải từ 1 đến 200 học sinh', 400);
    }

    const currentMemberCount = await ClassMember.countDocuments({
      class_id: classroom._id,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    });

    if (newCap < currentMemberCount) {
      throw new AppError(
        `Sĩ số tối đa không thể nhỏ hơn số học viên hiện tại trong lớp (${currentMemberCount} học viên)`,
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

  const classroom = await Classroom.findOne({
    _id: classroomId,
    tutor_profile_id: tutorProfile._id,
  });

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học hoặc bạn không có quyền cập nhật', 404);
  }

  // Nếu chuyển từ ARCHIVED sang ACTIVE: kiểm tra hạn ngạch gói cước (BR-12)
  if (upperStatus === ENUMS.ClassroomsStatus.ACTIVE && classroom.status !== ENUMS.ClassroomsStatus.ACTIVE) {
    const activeCount = await Classroom.countDocuments({
      tutor_profile_id: tutorProfile._id,
      status: ENUMS.ClassroomsStatus.ACTIVE,
    });

    let maxAllowed = 5;
    if (user?.subscription?.plan_id) {
      const userPlan = await Plan.findById(user.subscription.plan_id);
      if (userPlan && userPlan.max_classrooms !== null && userPlan.max_classrooms !== undefined) {
        maxAllowed = userPlan.max_classrooms;
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
  const classroom = await Classroom.findOne({
    _id: classroomId,
    tutor_profile_id: tutorProfile._id,
  });

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
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
  const classroom = await Classroom.findOne({
    _id: classroomId,
    tutor_profile_id: tutorProfile._id,
  });

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
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

  // Loại bỏ các bản ghi tài khoản Gia sư khỏi danh sách thành viên học viên/phụ huynh
  const validMembers = enrichedMembers.filter(
    (m) => m.user_id && m.user_id.role !== 'TUTOR'
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

  // Không cho phép tự thêm chính gia sư làm thành viên học sinh
  if (targetUser._id.toString() === tutorProfile.user_id?.toString()) {
    throw new AppError('Bạn là gia sư phụ trách lớp này, không thể thêm chính mình làm thành viên học sinh', 400);
  }

  // Kiểm tra sức chứa hiện tại
  const currentCount = await ClassMember.countDocuments({
    class_id: classroom._id,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  });

  if (currentCount >= classroom.capacity) {
    throw new AppError(`Lớp học đã đạt sĩ số tối đa (${classroom.capacity} học viên)`, 400);
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

  const allInDb = await Classroom.find({}).select('name join_code status').lean();
  console.log('[DEBUG DB CLASSROOMS]:', allInDb);

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
    throw new AppError('Không tìm thấy lớp học với mã tham gia này', 404);
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
      400
    );
  }

  const code = joinCode.trim().toUpperCase();
  const classroom = await Classroom.findOne({ join_code: code });

  if (!classroom) {
    throw new AppError('Mã tham gia không chính xác hoặc không tồn tại', 404);
  }

  if (classroom.status !== ENUMS.ClassroomsStatus.ACTIVE) {
    throw new AppError('Lớp học này hiện đã lưu trữ hoặc ngưng nhận học viên mới', 400);
  }

  // Kiểm tra không cho gia sư tự tham gia lớp do chính mình quản lý
  const tutorProfile = await TutorProfile.findById(classroom.tutor_profile_id);
  if (
    (tutorProfile && tutorProfile.user_id?.toString() === user._id.toString()) ||
    classroom.tutor_profile_id?.toString() === user._id.toString()
  ) {
    throw new AppError('Bạn là gia sư phụ trách lớp học này, không thể tham gia với vai trò học sinh/phụ huynh', 400);
  }

  // Kiểm tra sức chứa
  const memberCount = await ClassMember.countDocuments({
    class_id: classroom._id,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  });

  if (memberCount >= classroom.capacity) {
    throw new AppError('Lớp học đã đạt sĩ số tối đa, không thể tham gia lúc này', 400);
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

  // Luồng UC24: Nếu là Parent, cho phép liên kết con đang ở trong lớp
  if (user.role === 'PARENT' && child_user_id) {
    const isChildInClass = await ClassMember.findOne({
      class_id: classroom._id,
      user_id: child_user_id,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    });

    if (isChildInClass) {
      try {
        await ParentChildLink.findOneAndUpdate(
          { parent_user_id: user._id, student_user_id: child_user_id },
          {
            parent_user_id: user._id,
            student_user_id: child_user_id,
            status: ENUMS.ParentChildLinksStatus.ACCEPTED,
          },
          { upsert: true, new: true }
        );
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
  } catch (convErr) {
    console.warn('[UC24] Lỗi cập nhật conversation read_states:', convErr.message);
  }

  // Gửi thông báo đến Gia sư phụ trách lớp
  try {
    const tutorUser = await User.findOne({
      _id: classroom.tutor_profile_id?.user_id || classroom.tutor_profile_id,
    });
    if (tutorUser) {
      await Notification.create({
        recipient_user_id: tutorUser._id,
        category: ENUMS.NotificationsCategory.SYSTEM,
        title: `Học viên mới tham gia: ${classroom.name}`,
        body: `${user.full_name || 'Một học viên'} đã tham gia lớp học qua mã ${code}. Sĩ số hiện tại: ${memberCount + 1}/${classroom.capacity}`,
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

  // Kiểm tra quyền: Gia sư chủ lớp hoặc thành viên ACTIVE
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
    if (member) isAuthorized = true;
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
 * Gửi tin nhắn vào nhóm chat lớp học (UC33, UC34)
 */
export const sendClassChatMessage = async ({ classroomId, user, content }) => {
  if (!content || !content.trim()) {
    throw new AppError('Nội dung tin nhắn không được để trống', 400);
  }

  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
  }

  // Kiểm tra quyền: Gia sư chủ lớp hoặc thành viên ACTIVE
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
    if (member) isAuthorized = true;
  }

  if (!isAuthorized) {
    throw new AppError('Bạn không có quyền gửi tin nhắn trong nhóm chat lớp học này', 403);
  }

  let conversation = await Conversation.findOne({ class_id: classroomId });
  if (!conversation) {
    conversation = await Conversation.create({
      class_id: classroomId,
      type: ENUMS.ConversationsType.CLASS_GROUP_CHAT,
      is_active: true,
    });
  }

  const message = await Message.create({
    conversation_id: conversation._id,
    sender_user_id: user._id,
    message_type: ENUMS.MessagesMessageType.TEXT,
    content: content.trim(),
  });

  const populated = await Message.findById(message._id).populate({
    path: 'sender_user_id',
    select: 'full_name avatar_url role',
  });

  return populated;
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

  // Đính kèm thống kê số bài nộp và bài nộp của chính user (nếu là học sinh)
  const populated = await Promise.all(
    assignments.map(async (asg) => {
      const submissionCount = await AssignmentSubmission.countDocuments({
        assignment_id: asg._id,
        status: { $in: ['SUBMITTED', 'GRADED'] },
      });

      let mySubmission = null;
      if (user?._id) {
        mySubmission = await AssignmentSubmission.findOne({
          assignment_id: asg._id,
          student_user_id: user._id,
        })
          .sort({ attempt_number: -1 })
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

  const classroom = await Classroom.findOne({
    _id: classroomId,
    tutor_profile_id: tutorProfile._id,
  });

  if (!classroom) {
    throw new AppError('Không tìm thấy lớp học', 404);
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

  let mySubmission = null;
  if (user?._id) {
    mySubmission = await AssignmentSubmission.findOne({
      assignment_id: assignment._id,
      student_user_id: user._id,
    })
      .sort({ attempt_number: -1 })
      .lean();
  }

  return {
    ...assignment,
    my_submission: mySubmission,
  };
};

/**
 * Nộp bài tập (UC27: Do Assignment)
 * Tự động tính điểm provisional_score cho các câu MULTIPLE_CHOICE
 */
export const submitAssignment = async ({ assignmentId, user, answers = [] }) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new AppError('Không tìm thấy bài tập', 404);
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

  return submission;
};

/**
 * Lấy danh sách bài nộp của học sinh cho gia sư chấm điểm (UC26)
 */
export const getSubmissionsForAssignment = async ({ assignmentId, tutorProfile }) => {
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
  if (data.due_date !== undefined) assignment.due_date = data.due_date ? new Date(data.due_date) : null;
  if (data.allow_late_submission !== undefined) assignment.allow_late_submission = Boolean(data.allow_late_submission);
  if (data.allow_resubmission !== undefined) assignment.allow_resubmission = Boolean(data.allow_resubmission);
  if (data.total_points !== undefined) assignment.total_points = parseInt(data.total_points, 10) || 10;
  if (data.is_ai_generated !== undefined) assignment.is_ai_generated = Boolean(data.is_ai_generated);

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

  // Quy tắc UC26: Chỉ chủ lớp (người tạo bài) mới được chấm
  if (assignment.creator_profile_id.toString() !== tutorProfile._id.toString()) {
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


