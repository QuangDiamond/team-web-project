import mongoose from 'mongoose';
import { AppError } from '../common/utils/AppError.js';
import { buildPagination } from '../common/utils/pagination.js';
import { ClassMember } from '../models/ClassMember.js';
import { ClassSession } from '../models/ClassSession.js';
import { User } from '../models/User.js';
import { ENUMS } from '../models/enums.js';
import { getOwnedActiveClassroom } from './topic.service.js';

const ATTENDANCE_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Find a session that belongs to the active classroom
 * @param {Object} classroom - Active classroom owned by the authenticated tutor
 * @param {string} sessionId - Class session ID
 * @returns {Promise<Object>} Class session document
 */
const getSessionOrThrow = async (classroom, sessionId) => {
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
 * Get active student account IDs from the class membership roster
 * @param {Object} classroom - Active classroom
 * @returns {Promise<ObjectId[]>} Active student user IDs
 */
const getActiveStudentIds = async (classroom) => {
  const memberUserIds = await ClassMember.distinct('user_id', {
    class_id: classroom._id,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  });

  if (memberUserIds.length === 0) {
    return [];
  }

  return User.distinct('_id', {
    _id: { $in: memberUserIds },
    role: ENUMS.UserRole.STUDENT,
    account_status: ENUMS.UserAccountStatus.ACTIVE,
  });
};

/**
 * Check whether attendance can be created or changed at the current time
 * @param {Object} classSession - Class session document
 * @returns {void}
 */
const validateAttendanceWindow = (classSession) => {
  if (classSession.status === ENUMS.ClassSessionsStatus.CANCELLED) {
    throw new AppError('Attendance cannot be marked for a cancelled session', 422);
  }

  const now = new Date();
  if (now < classSession.start_time) {
    throw new AppError('Attendance can only be marked when the session starts', 422);
  }

  const updateDeadline = new Date(classSession.end_time.getTime() + ATTENDANCE_EDIT_WINDOW_MS);
  if (now > updateDeadline) {
    throw new AppError('The 24-hour attendance update window has expired', 422);
  }
};

/**
 * Ensure submitted attendance covers the active student roster exactly once
 * @param {Object} classroom - Active classroom
 * @param {Array<Object>} records - Submitted attendance records
 * @returns {Promise<void>}
 */
const validateStudentRecords = async (classroom, records) => {
  const activeStudentIds = await getActiveStudentIds(classroom);
  const activeStudentIdSet = new Set(activeStudentIds.map((studentId) => String(studentId)));
  const submittedStudentIds = new Set(records.map((record) => record.student_user_id.toLowerCase()));

  for (const studentId of submittedStudentIds) {
    if (!activeStudentIdSet.has(studentId)) {
      throw new AppError('Attendance can only be recorded for active students in this class', 422);
    }
  }

  if (submittedStudentIds.size !== activeStudentIdSet.size) {
    throw new AppError('Submit attendance for every active student in this class', 422);
  }
};

/**
 * Convert a session document to the attendance API response
 * @param {Object} classSession - Class session document
 * @returns {{ session: Object, attendance: Object[], has_attendance: boolean }} Attendance response
 */
const toAttendanceResponse = (classSession) => ({
  session: {
    _id: String(classSession._id),
    class_id: String(classSession.class_id),
    title: classSession.title,
    start_time: classSession.start_time,
    end_time: classSession.end_time,
    status: classSession.status,
  },
  attendance: classSession.attendance.map((record) => ({
    student_user_id: String(record.student_user_id),
    status: record.status,
    comment: record.comment,
    marked_at: record.marked_at,
  })),
  has_attendance: classSession.attendance.length > 0,
});

/**
 * Get the student roster and attendance marks for a session
 * @param {Object} user - Authenticated tutor { id, role }
 * @param {string} classId - Classroom ID
 * @param {string} sessionId - Class session ID
 * @param {{ page: number, limit: number }} query - Pagination options
 * @returns {Promise<{ session: Object, items: Object[], pagination: Object, has_attendance: boolean }>}
 */
export const getSessionAttendance = async (user, classId, sessionId, { page, limit }) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const classSession = await getSessionOrThrow(classroom, sessionId);
  const studentIds = await getActiveStudentIds(classroom);
  const filter = { _id: { $in: studentIds } };
  const [students, total] = await Promise.all([
    User.find(filter)
      .select('_id full_name email avatar_url')
      .sort({ full_name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  const attendanceByStudentId = new Map(
    classSession.attendance.map((record) => [String(record.student_user_id), record]),
  );
  const items = students.map((student) => {
    const record = attendanceByStudentId.get(String(student._id));
    return {
      student_user_id: String(student._id),
      full_name: student.full_name,
      email: student.email,
      avatar_url: student.avatar_url,
      status: record ? record.status : null,
      comment: record ? record.comment : null,
      marked_at: record ? record.marked_at : null,
    };
  });

  return {
    session: {
      _id: String(classSession._id),
      class_id: String(classSession.class_id),
      title: classSession.title,
      start_time: classSession.start_time,
      end_time: classSession.end_time,
      status: classSession.status,
    },
    has_attendance: classSession.attendance.length > 0,
    items,
    pagination: buildPagination(page, limit, total),
  };
};

/**
 * Create attendance marks once the session has started
 * @param {Object} user - Authenticated tutor { id, role }
 * @param {string} classId - Classroom ID
 * @param {string} sessionId - Class session ID
 * @param {{ records: Array<{ student_user_id: string, status: string, comment: string|null }> }} data - Student marks
 * @returns {Promise<{ session: Object, attendance: Object[], has_attendance: boolean }>}
 */
export const createSessionAttendance = async (user, classId, sessionId, data) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const classSession = await getSessionOrThrow(classroom, sessionId);
  validateAttendanceWindow(classSession);

  if (classSession.attendance.length > 0) {
    throw new AppError('Attendance has already been recorded; use the update action', 409);
  }
  await validateStudentRecords(classroom, data.records);

  const markedAt = new Date();
  classSession.attendance = data.records.map((record) => ({
    student_user_id: new mongoose.Types.ObjectId(record.student_user_id),
    status: record.status,
    comment: record.comment,
    marked_at: markedAt,
  }));
  await classSession.save();
  return toAttendanceResponse(classSession);
};

/**
 * Update attendance marks within 24 hours after the session ends
 * @param {Object} user - Authenticated tutor { id, role }
 * @param {string} classId - Classroom ID
 * @param {string} sessionId - Class session ID
 * @param {{ records: Array<{ student_user_id: string, status: string, comment: string|null }> }} data - Updated student marks
 * @returns {Promise<{ session: Object, attendance: Object[], has_attendance: boolean }>}
 */
export const updateSessionAttendance = async (user, classId, sessionId, data) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const classSession = await getSessionOrThrow(classroom, sessionId);
  validateAttendanceWindow(classSession);

  if (classSession.attendance.length === 0) {
    throw new AppError('Attendance has not been recorded yet', 409);
  }
  await validateStudentRecords(classroom, data.records);

  const markedAt = new Date();
  classSession.attendance = data.records.map((record) => ({
    student_user_id: new mongoose.Types.ObjectId(record.student_user_id),
    status: record.status,
    comment: record.comment,
    marked_at: markedAt,
  }));
  await classSession.save();
  return toAttendanceResponse(classSession);
};
