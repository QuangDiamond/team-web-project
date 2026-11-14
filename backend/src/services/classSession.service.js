import mongoose from 'mongoose';
import { AppError } from '../common/utils/AppError.js';
import { buildPagination } from '../common/utils/pagination.js';
import { ClassMember } from '../models/ClassMember.js';
import { ClassSession } from '../models/ClassSession.js';
import { Classroom } from '../models/Classroom.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ParentChildLink } from '../models/ParentChildLink.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { RecurringRule } from '../models/RecurringRule.js';
import { ScheduleChangeRequest } from '../models/ScheduleChangeRequest.js';
import { SessionReminder } from '../models/SessionReminder.js';
import { ENUMS } from '../models/enums.js';
import { getOwnedActiveClassroom, getStudentActiveClassroom } from './topic.service.js';
import { notifyParentsOfClassStudents } from './notification.service.js';

const SESSION_NOTIFICATION_TITLES = {
  CREATED: 'Lịch học mới',
  UPDATED: 'Lịch học thay đổi',
  CANCELLED: 'Buổi học bị hủy',
};

/**
 * Check if user is owner, active member, or parent of an active member of the classroom
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @returns {Promise<Object>} Classroom document
 */
export const assertClassroomMemberOrOwner = async (user, classId) => {
  if (!mongoose.isValidObjectId(classId)) {
    throw new AppError('Classroom not found', 404);
  }

  const classroom = await Classroom.findById(classId);
  if (!classroom) {
    throw new AppError('Classroom not found', 404);
  }

  if (user.role === ENUMS.UserRole.ADMIN) {
    return classroom;
  }

  if (user.role === ENUMS.UserRole.TUTOR) {
    const tutorProfile = await TutorProfile.findOne({ user_id: user.id });
    const isOwner =
      (tutorProfile && String(classroom.tutor_profile_id) === String(tutorProfile._id)) ||
      String(classroom.tutor_profile_id) === String(user.id);
    if (!isOwner) {
      throw new AppError('Forbidden: Only the classroom owner can access this classroom', 403);
    }
    return classroom;
  }

  if (user.role === ENUMS.UserRole.STUDENT) {
    const isMember = await ClassMember.findOne({
      class_id: classId,
      user_id: user.id,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    });
    if (!isMember) {
      throw new AppError('Forbidden: Bạn chưa tham gia lớp học này', 403);
    }
    return classroom;
  }

  if (user.role === ENUMS.UserRole.PARENT) {
    const childrenLinks = await ParentChildLink.find({
      parent_user_id: user.id,
      status: ENUMS.ParentChildLinksStatus.ACCEPTED,
    });
    const childUserIds = childrenLinks.map((l) => l.student_user_id);
    const isChildMember = await ClassMember.findOne({
      class_id: classId,
      user_id: { $in: childUserIds },
      status: ENUMS.ClassMembersStatus.ACTIVE,
    });
    if (!isChildMember) {
      throw new AppError('Forbidden: Con của bạn chưa tham gia lớp học này', 403);
    }
    return classroom;
  }

  throw new AppError('Forbidden', 403);
};

/**
 * Find a class session that belongs to the classroom
 * @param {Object} classroom - Active classroom
 * @param {string} sessionId - Class session ID
 * @returns {Promise<Object>} ClassSession document
 */
const getClassSessionOrThrow = async (classroom, sessionId) => {
  if (!mongoose.isValidObjectId(sessionId)) {
    throw new AppError('Class session not found', 404);
  }

  const classSession = await ClassSession.findOne({ _id: sessionId, class_id: classroom._id });
  if (!classSession) {
    throw new AppError('Class session not found', 404);
  }
  return classSession;
};

/**
 * Convert a Mongoose class session document or lean object to the API response shape
 * @param {Object} classSession - ClassSession document or lean object
 * @returns {Object} Class session DTO
 */
const toClassSessionDto = (classSession) => ({
  _id: String(classSession._id),
  class_id: String(classSession.class_id),
  tutor_profile_id: String(classSession.tutor_profile_id),
  rule_id: classSession.rule_id ? String(classSession.rule_id) : null,
  title: classSession.title,
  start_time: classSession.start_time,
  end_time: classSession.end_time,
  meeting_link: classSession.meeting_link,
  status: classSession.status,
  attendance: classSession.attendance || [],
  created_at: classSession.created_at,
  updated_at: classSession.updated_at,
});

/**
 * Định dạng thời gian buổi học theo giờ Việt Nam để hiển thị trong thông báo
 * @param {Date} value
 * @returns {string}
 */
const formatSessionTime = (value) => {
  return new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Báo cho phụ huynh của học sinh trong lớp khi gia sư tạo / đổi / hủy buổi học
 * @param {Object} classroom - Classroom document
 * @param {Object} classSession - ClassSession document
 * @param {'CREATED'|'UPDATED'|'CANCELLED'} action
 * @returns {Promise<void>}
 */
const notifyParentsAboutSession = async (classroom, classSession, action) => {
  const sessionTime = formatSessionTime(classSession.start_time);
  await notifyParentsOfClassStudents({
    classId: classroom._id,
    category: ENUMS.NotificationsCategory.SESSION,
    targetType: ENUMS.NotificationsTargetType.CLASSROOM,
    targetId: classroom._id,
    preferenceKey: 'notify_on_sessions',
    buildContent: (childNames) => ({
      title: `${SESSION_NOTIFICATION_TITLES[action]}: ${classSession.title}`,
      body: `Lớp "${classroom.name}" của ${childNames.join(', ')} – buổi học lúc ${sessionTime}.`,
    }),
  });
};

/**
 * Ensure a newly scheduled session starts in the future
 * @param {Date} startTime - Session start time
 * @returns {void}
 */
const validateFutureStartTime = (startTime) => {
  if (startTime <= new Date()) {
    throw new AppError('Class session must start in the future', 422);
  }
};

/**
 * Reject a session time range that overlaps another non-cancelled session in any active classroom owned by the tutor
 * @param {Object} classroom - Active classroom being scheduled
 * @param {Date} startTime - Proposed session start time
 * @param {Date} endTime - Proposed session end time
 * @param {string | null} excludedSessionId - Session ID to ignore while updating
 * @returns {Promise<void>}
 */
const ensureNoSessionOverlap = async (classroom, startTime, endTime, excludedSessionId = null) => {
  const activeClassrooms = await Classroom.find({
    tutor_profile_id: classroom.tutor_profile_id,
    status: ENUMS.ClassroomsStatus.ACTIVE,
  })
    .select('_id')
    .lean();
  const activeClassIds = activeClassrooms.map((activeClassroom) => activeClassroom._id);
  if (!activeClassIds.some((classId) => String(classId) === String(classroom._id))) {
    activeClassIds.push(classroom._id);
  }

  const filter = {
    class_id: { $in: activeClassIds },
    status: { $ne: ENUMS.ClassSessionsStatus.CANCELLED },
    $or: [
      {
        start_time: { $lte: startTime },
        end_time: { $gte: startTime },
      },
      {
        start_time: { $lte: endTime },
        end_time: { $gte: endTime },
      },
      {
        start_time: { $gte: startTime },
        end_time: { $lte: endTime },
      },
    ],
  };

  if (excludedSessionId) {
    filter._id = { $ne: excludedSessionId };
  }

  const conflictingSession = await ClassSession.exists(filter);
  if (conflictingSession) {
    throw new AppError('Class session overlaps with another scheduled session in one of your active classes', 409);
  }
};

/**
 * Notify active students after a tutor directly changes a class session time
 * @param {Object} classroom - Classroom whose session time changed
 * @param {Object} session - Updated session
 * @returns {Promise<void>}
 */
const notifyStudentsAboutScheduleChange = async (classroom, session) => {
  try {
    const memberIds = await ClassMember.distinct('user_id', {
      class_id: classroom._id,
      status: ENUMS.ClassMembersStatus.ACTIVE,
    });
    const students = await User.find({
      _id: { $in: memberIds },
      role: ENUMS.UserRole.STUDENT,
      account_status: ENUMS.UserAccountStatus.ACTIVE,
    })
      .select('_id')
      .lean();
    if (students.length === 0) {
      return;
    }
    await Notification.insertMany(students.map((student) => ({
      recipient_user_id: student._id,
      category: ENUMS.NotificationsCategory.SCHEDULE_CHANGE,
      title: 'Lịch buổi học đã thay đổi',
      body: `Buổi “${session.title || 'Buổi học'}” của lớp ${classroom.name} đã được chuyển sang ${session.start_time.toLocaleString('vi-VN')}.`,
      target_type: ENUMS.NotificationsTargetType.SESSION,
      target_id: session._id,
      is_read: false,
    })));
  } catch (error) {
    console.warn('[SCHEDULE_CHANGE] Could not notify class students:', error.message);
  }
};

/**
 * Lên lịch nhắc hẹn 24h và 30m trước giờ học (BR-10 Reminders)
 * @param {Object} session - ClassSession document
 */
const scheduleRemindersForSession = async (session) => {
  try {
    const now = new Date();
    const remind24h = new Date(session.start_time.getTime() - 24 * 60 * 60 * 1000);
    const remind30m = new Date(session.start_time.getTime() - 30 * 60 * 1000);

    const remindersToCreate = [];
    if (remind24h > now) {
      remindersToCreate.push({
        session_id: session._id,
        user_id: session.tutor_profile_id,
        channel: ENUMS.SessionRemindersChannel.EMAIL,
        trigger_time: ENUMS.SessionRemindersTriggerTime.BEFORE_24H,
        status: ENUMS.SessionRemindersStatus.PENDING,
        scheduled_for: remind24h,
      });
    }
    if (remind30m > now) {
      remindersToCreate.push({
        session_id: session._id,
        user_id: session.tutor_profile_id,
        channel: ENUMS.SessionRemindersChannel.EMAIL,
        trigger_time: ENUMS.SessionRemindersTriggerTime.BEFORE_30M,
        status: ENUMS.SessionRemindersStatus.PENDING,
        scheduled_for: remind30m,
      });
    }
    if (remindersToCreate.length > 0) {
      await SessionReminder.insertMany(remindersToCreate);
    }
  } catch (err) {
    console.warn('Lên lịch nhắc hẹn gặp lỗi nhẹ:', err.message);
  }
};

/**
 * List sessions from a classroom (accessible to owner tutor, active students and parents)
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {{ page: number, limit: number }} query - Pagination options
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listClassSessions = async (user, classId, { page, limit }) => {
  const classroom = await assertClassroomMemberOrOwner(user, classId);
  const filter = { class_id: classroom._id };
  const [sessions, total] = await Promise.all([
    ClassSession.find(filter)
      .sort({ start_time: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ClassSession.countDocuments(filter),
  ]);
  const memberIds = await ClassMember.distinct('user_id', {
    class_id: classroom._id,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  });
  const activeStudentCount = await User.countDocuments({
    _id: { $in: memberIds },
    role: ENUMS.UserRole.STUDENT,
    account_status: ENUMS.UserAccountStatus.ACTIVE,
  });

  return {
    items: sessions.map((classSession) => ({
      ...toClassSessionDto(classSession),
      active_student_count: activeStudentCount,
    })),
    pagination: buildPagination(page, limit, total),
  };
};

/**
 * List sessions from an active classroom the authenticated student belongs to
 * @param {Object} user - Authenticated student { id, role }
 * @param {string} classId - Classroom ID
 * @param {{ page: number, limit: number }} query - Pagination options
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listStudentClassSessions = async (user, classId, { page, limit }) => {
  const classroom = await getStudentActiveClassroom(user, classId);
  const filter = { class_id: classroom._id };
  const [sessions, total] = await Promise.all([
    ClassSession.find(filter)
      .sort({ start_time: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ClassSession.countDocuments(filter),
  ]);
  const memberIds = await ClassMember.distinct('user_id', {
    class_id: classroom._id,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  });
  const activeStudentCount = await User.countDocuments({
    _id: { $in: memberIds },
    role: ENUMS.UserRole.STUDENT,
    account_status: ENUMS.UserAccountStatus.ACTIVE,
  });

  return {
    items: sessions.map((session) => {
      const attendanceRecords = Array.isArray(session.attendance) ? session.attendance : [];
      const attendanceRecord = attendanceRecords.find((record) => (
        String(record.student_user_id) === String(user.id)
      ));

      return {
        ...toClassSessionDto(session),
        class_name: classroom.name,
        active_student_count: activeStudentCount,
        attendance_status: attendanceRecord ? attendanceRecord.status : null,
      };
    }),
    pagination: buildPagination(page, limit, total),
  };
};

/**
 * Get one session from a classroom
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {string} sessionId - Class session ID
 * @returns {Promise<Object>} Class session DTO
 */
export const getClassSession = async (user, classId, sessionId) => {
  const classroom = await assertClassroomMemberOrOwner(user, classId);
  const classSession = await getClassSessionOrThrow(classroom, sessionId);
  return toClassSessionDto(classSession);
};

/**
 * Create a one-off or recurring session for an active classroom owned by the authenticated tutor
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {Object} data - Validated class session fields
 * @returns {Promise<Object>} Created class session DTO
 */
export const createClassSession = async (user, classId, data) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  validateFutureStartTime(data.start_time);
  await ensureNoSessionOverlap(classroom, data.start_time, data.end_time);

  // 1. Nếu không có lặp lại (buổi lẻ)
  if (!data.repeat) {
    const classSession = await ClassSession.create({
      class_id: classroom._id,
      tutor_profile_id: classroom.tutor_profile_id,
      rule_id: null,
      title: data.title,
      start_time: data.start_time,
      end_time: data.end_time,
      meeting_link: data.meeting_link,
      status: ENUMS.ClassSessionsStatus.SCHEDULED,
    });

    await scheduleRemindersForSession(classSession);
    await notifyParentsAboutSession(classroom, classSession, 'CREATED');
    return toClassSessionDto(classSession);
  }

  // 2. Nếu có quy tắc lặp lại (Recurring Rule)
  const durationMs = data.end_time.getTime() - data.start_time.getTime();
  const durationMinutes = Math.round(durationMs / (60 * 1000));
  const startTimeStr = `${String(data.start_time.getHours()).padStart(2, '0')}:${String(data.start_time.getMinutes()).padStart(2, '0')}`;

  const recurringRule = await RecurringRule.create({
    class_id: classroom._id,
    days_of_week: data.repeat.days_of_week,
    start_time: startTimeStr,
    duration_minutes: durationMinutes,
    end_date: data.repeat.end_date,
  });

  const DAY_MAP = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
  };
  const targetDays = new Set(data.repeat.days_of_week.map((d) => DAY_MAP[d]));

  const generatedSessions = [];
  const curr = new Date(data.start_time);
  const endDate = new Date(data.repeat.end_date);

  while (curr <= endDate) {
    if (targetDays.has(curr.getDay())) {
      const sStart = new Date(curr);
      const sEnd = new Date(curr.getTime() + durationMs);
      generatedSessions.push({
        class_id: classroom._id,
        tutor_profile_id: classroom.tutor_profile_id,
        rule_id: recurringRule._id,
        title: data.title,
        start_time: sStart,
        end_time: sEnd,
        meeting_link: data.meeting_link,
        status: ENUMS.ClassSessionsStatus.SCHEDULED,
      });
    }
    curr.setDate(curr.getDate() + 1);
  }

  if (generatedSessions.length === 0) {
    generatedSessions.push({
      class_id: classroom._id,
      tutor_profile_id: classroom.tutor_profile_id,
      rule_id: recurringRule._id,
      title: data.title,
      start_time: data.start_time,
      end_time: data.end_time,
      meeting_link: data.meeting_link,
      status: ENUMS.ClassSessionsStatus.SCHEDULED,
    });
  }

  for (const s of generatedSessions) {
    await ensureNoSessionOverlap(classroom, s.start_time, s.end_time);
  }

  const createdSessions = await ClassSession.insertMany(generatedSessions);
  for (const s of createdSessions) {
    await scheduleRemindersForSession(s);
    await notifyParentsAboutSession(classroom, s, 'CREATED');
  }

  await notifyParentsAboutSession(classroom, createdSessions[0], 'CREATED');
  return toClassSessionDto(createdSessions[0]);
};

/**
 * Update a session in an active classroom owned by the authenticated tutor
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {string} sessionId - Class session ID
 * @param {Object} data - Validated fields to update
 * @returns {Promise<Object>} Updated class session DTO
 */
export const updateClassSession = async (user, classId, sessionId, data) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const classSession = await getClassSessionOrThrow(classroom, sessionId);

  if (classSession.status === ENUMS.ClassSessionsStatus.CANCELLED) {
    throw new AppError('Cancelled class sessions cannot be changed', 422);
  }
  if (classSession.start_time <= new Date()) {
    throw new AppError('Past class sessions cannot be updated', 422);
  }

  if (data.start_time && data.end_time) {
    validateFutureStartTime(data.start_time);
    await ensureNoSessionOverlap(
      classroom,
      data.start_time,
      data.end_time,
      classSession._id,
    );
  }

  const updatedSession = await ClassSession.findOneAndUpdate(
    { _id: classSession._id, class_id: classroom._id },
    { $set: data },
    { new: true, runValidators: true },
  );

  if (!updatedSession) {
    throw new AppError('Class session changed before update; reload and try again', 409);
  }
  if (data.start_time && classSession.start_time.getTime() !== data.start_time.getTime()) {
    await notifyStudentsAboutScheduleChange(classroom, updatedSession);
  }

  let sessionAction = 'UPDATED';
  if (updatedSession.status === ENUMS.ClassSessionsStatus.CANCELLED) {
    sessionAction = 'CANCELLED';
  }
  await notifyParentsAboutSession(classroom, updatedSession, sessionAction);
  return toClassSessionDto(updatedSession);
};

/**
 * Delete a future session from an active classroom owned by the authenticated tutor
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {string} sessionId - Class session ID
 * @returns {Promise<{ _id: string }>}
 */
export const deleteClassSession = async (user, classId, sessionId) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const classSession = await getClassSessionOrThrow(classroom, sessionId);

  if (classSession.start_time <= new Date()) {
    throw new AppError('Past class sessions cannot be deleted', 422);
  }

  const deletedSession = await ClassSession.findOneAndDelete({
    _id: classSession._id,
    class_id: classroom._id,
  });

  if (!deletedSession) {
    throw new AppError('Class session changed before deletion; reload and try again', 409);
  }

  await notifyParentsAboutSession(classroom, deletedSession, 'CANCELLED');
  return { _id: String(deletedSession._id) };
};

/**
 * Điểm danh học sinh sau khi buổi học bắt đầu hoặc kết thúc (UC26.A2)
 * @param {Object} user - Authenticated tutor
 * @param {string} classId
 * @param {string} sessionId
 * @param {{ items: Array<{ student_user_id: string, status: string, comment?: string }> }} data
 */
export const markAttendance = async (user, classId, sessionId, { items }) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const classSession = await getClassSessionOrThrow(classroom, sessionId);

  if (new Date(classSession.start_time) > new Date()) {
    throw new AppError('Chỉ có thể điểm danh sau khi buổi học đã bắt đầu', 422);
  }

  const attendanceRecords = items.map((item) => ({
    student_user_id: item.student_user_id,
    status: item.status,
    comment: item.comment || null,
    marked_at: new Date(),
  }));

  classSession.attendance = attendanceRecords;
  classSession.status = ENUMS.ClassSessionsStatus.COMPLETED;
  await classSession.save();

  return toClassSessionDto(classSession);
};

/**
 * Học sinh hoặc phụ huynh gửi yêu cầu đổi / hủy lịch học (UC27)
 * Ràng buộc BR-10: Phải gửi trước giờ học ít nhất 12 tiếng
 * @param {Object} user
 * @param {string} classId
 * @param {string} sessionId
 * @param {Object} data - { request_type, proposed_start_time, proposed_end_time, reason }
 */
export const createScheduleChangeRequest = async (user, classId, sessionId, data) => {
  const classroom = await assertClassroomMemberOrOwner(user, classId);
  const classSession = await getClassSessionOrThrow(classroom, sessionId);

  if (classSession.status !== ENUMS.ClassSessionsStatus.SCHEDULED) {
    throw new AppError('Chỉ có thể xin đổi lịch cho buổi học chưa diễn ra và đang được lên lịch', 422);
  }

  const now = new Date();
  const noticeMs = new Date(classSession.start_time).getTime() - now.getTime();
  const MIN_NOTICE_MS = 12 * 60 * 60 * 1000;

  if (noticeMs < MIN_NOTICE_MS) {
    throw new AppError(
      'Theo quy định, yêu cầu đổi/hủy lịch học phải được gửi trước giờ học ít nhất 12 tiếng. Do đã cận giờ, vui lòng nhắn tin trực tiếp cho gia sư trong nhóm chat.',
      422
    );
  }

  const existingPending = await ScheduleChangeRequest.findOne({
    session_id: classSession._id,
    status: ENUMS.ScheduleChangeRequestsStatus.PENDING,
  });
  if (existingPending) {
    throw new AppError('Buổi học này đã có một yêu cầu đổi lịch đang chờ gia sư phản hồi', 409);
  }

  const changeRequest = await ScheduleChangeRequest.create({
    session_id: classSession._id,
    requester_user_id: user.id,
    responder_user_id: null,
    request_type: data.request_type,
    proposed_start_time: data.proposed_start_time || null,
    proposed_end_time: data.proposed_end_time || null,
    reason: data.reason,
    status: ENUMS.ScheduleChangeRequestsStatus.PENDING,
    response_comment: null,
    responded_at: null,
  });

  return changeRequest;
};

/**
 * Lấy danh sách yêu cầu đổi lịch của lớp học (UC27 / UC28)
 * @param {Object} user
 * @param {string} classId
 */
export const listScheduleChangeRequests = async (user, classId) => {
  const classroom = await assertClassroomMemberOrOwner(user, classId);
  const sessions = await ClassSession.find({ class_id: classroom._id }).select('_id title').lean();
  const sessionIds = sessions.map((s) => s._id);

  const requests = await ScheduleChangeRequest.find({ session_id: { $in: sessionIds } })
    .populate('session_id', 'title start_time end_time meeting_link status')
    .populate('requester_user_id', 'full_name email role avatar_url')
    .sort({ created_at: -1 })
    .lean();

  return requests;
};

/**
 * Gia sư duyệt hoặc từ chối yêu cầu đổi lịch học (UC28)
 * @param {Object} user
 * @param {string} classId
 * @param {string} requestId
 * @param {{ status: 'APPROVED' | 'REJECTED', response_comment?: string }} data
 */
export const respondScheduleChangeRequest = async (user, classId, requestId, data) => {
  const classroom = await getOwnedActiveClassroom(user, classId);

  if (!mongoose.isValidObjectId(requestId)) {
    throw new AppError('Schedule change request not found', 404);
  }

  const changeRequest = await ScheduleChangeRequest.findById(requestId).populate('session_id');
  if (!changeRequest) {
    throw new AppError('Schedule change request not found', 404);
  }

  if (changeRequest.status !== ENUMS.ScheduleChangeRequestsStatus.PENDING) {
    throw new AppError('Yêu cầu đổi lịch này đã được phản hồi trước đó', 409);
  }

  const session = await ClassSession.findById(changeRequest.session_id);
  if (!session || String(session.class_id) !== String(classroom._id)) {
    throw new AppError('Buổi học không thuộc lớp này', 404);
  }

  if (data.status === ENUMS.ScheduleChangeRequestsStatus.APPROVED) {
    if (changeRequest.request_type === ENUMS.ScheduleChangeRequestsRequestType.MOVE) {
      await ensureNoSessionOverlap(classroom, changeRequest.proposed_start_time, changeRequest.proposed_end_time, session._id);
      session.start_time = changeRequest.proposed_start_time;
      session.end_time = changeRequest.proposed_end_time;
      await session.save();
    } else if (changeRequest.request_type === ENUMS.ScheduleChangeRequestsRequestType.CANCEL) {
      session.status = ENUMS.ClassSessionsStatus.CANCELLED;
      await session.save();
    }
  }

  changeRequest.status = data.status;
  changeRequest.response_comment = data.response_comment || null;
  changeRequest.responder_user_id = user.id;
  changeRequest.responded_at = new Date();
  await changeRequest.save();

  return changeRequest;
};
