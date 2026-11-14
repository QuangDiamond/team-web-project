import { buildPagination } from '../common/utils/pagination.js';
import { ClassSession } from '../models/ClassSession.js';
import { Classroom } from '../models/Classroom.js';
import { ClassMember } from '../models/ClassMember.js';
import { ParentChildLink } from '../models/ParentChildLink.js';
import { User } from '../models/User.js';
import { ENUMS } from '../models/enums.js';
import { getTutorProfileOrThrow } from './tutorContext.service.js';

/**
 * Find classrooms visible to the authenticated user based on their role
 * @param {Object} user - Authenticated user { id, role }
 * @returns {Promise<Object[]>} Classrooms visible to the user
 */
const getVisibleClassrooms = async (user) => {
  if (user.role === ENUMS.UserRole.TUTOR) {
    const tutorProfile = await getTutorProfileOrThrow(user);
    return Classroom.find({ tutor_profile_id: tutorProfile._id })
      .select('_id name subject grade status')
      .lean();
  }

  let memberUserIds = [user.id];
  if (user.role === ENUMS.UserRole.PARENT) {
    const childLinks = await ParentChildLink.find({
      parent_user_id: user.id,
      status: ENUMS.ParentChildLinksStatus.ACCEPTED,
    })
      .select('student_user_id')
      .lean();
    memberUserIds = childLinks.map((link) => link.student_user_id).filter(Boolean);
  }

  if (memberUserIds.length === 0) {
    return [];
  }

  const memberships = await ClassMember.find({
    user_id: { $in: memberUserIds },
    status: ENUMS.ClassMembersStatus.ACTIVE,
  })
    .select('class_id')
    .lean();
  const classIds = memberships.map((membership) => membership.class_id).filter(Boolean);

  return Classroom.find({ _id: { $in: classIds } })
    .select('_id name subject grade status')
    .lean();
};

/**
 * Get all sessions from classrooms visible to the authenticated user
 * @param {Object} user - Authenticated user { id, role }
 * @param {{ page: number, limit: number }} query - Pagination options
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const getUserSessions = async (user, { page, limit }) => {
  const classrooms = await getVisibleClassrooms(user);
  const classroomById = new Map(classrooms.map((classroom) => [String(classroom._id), classroom]));
  const classIds = classrooms.map((classroom) => classroom._id);
  const filter = { class_id: { $in: classIds } };

  const [sessions, total] = await Promise.all([
    ClassSession.find(filter)
      .sort({ start_time: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ClassSession.countDocuments(filter),
  ]);

  const memberships = await ClassMember.find({
    class_id: { $in: classIds },
    status: ENUMS.ClassMembersStatus.ACTIVE,
  })
    .select('class_id user_id')
    .lean();
  const memberIds = [...new Set(memberships.map((membership) => String(membership.user_id)))];
  const activeStudentIds = await User.distinct('_id', {
    _id: { $in: memberIds },
    role: ENUMS.UserRole.STUDENT,
    account_status: ENUMS.UserAccountStatus.ACTIVE,
  });
  const activeStudentIdSet = new Set(activeStudentIds.map((studentId) => String(studentId)));
  const activeStudentCounts = new Map();
  for (const membership of memberships) {
    if (activeStudentIdSet.has(String(membership.user_id))) {
      const classId = String(membership.class_id);
      activeStudentCounts.set(classId, (activeStudentCounts.get(classId) || 0) + 1);
    }
  }

  const items = sessions.map((classSession) => {
    const classroom = classroomById.get(String(classSession.class_id));
    const attendanceRecords = Array.isArray(classSession.attendance) ? classSession.attendance : [];
    const attendanceRecord = user.role === ENUMS.UserRole.STUDENT
      ? attendanceRecords.find((record) => String(record.student_user_id) === String(user.id))
      : null;
    return {
      _id: String(classSession._id),
      class_id: String(classSession.class_id),
      tutor_profile_id: String(classSession.tutor_profile_id),
      rule_id: classSession.rule_id ? String(classSession.rule_id) : null,
      title: classSession.title,
      start_time: classSession.start_time,
      end_time: classSession.end_time,
      meeting_link: classSession.meeting_link,
      status: classSession.status,
      attendance_status: attendanceRecord ? attendanceRecord.status : null,
      created_at: classSession.created_at,
      updated_at: classSession.updated_at,
      classroom: classroom
        ? {
            _id: String(classroom._id),
            name: classroom.name,
            subject: classroom.subject,
            grade: classroom.grade,
            status: classroom.status,
            active_student_count: activeStudentCounts.get(String(classroom._id)) || 0,
          }
        : null,
    };
  });

  return {
    items: items,
    pagination: buildPagination(page, limit, total),
  };
};
