import mongoose from 'mongoose';
import { ClassMember } from '../models/ClassMember.js';
import { Classroom } from '../models/Classroom.js';
import { ClassSession } from '../models/ClassSession.js';
import { Assignment } from '../models/Assignment.js';
import { AssignmentSubmission } from '../models/AssignmentSubmission.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { User } from '../models/User.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { buildPagination } from '../common/utils/pagination.js';

const UPCOMING_WINDOW_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Bài đã nộp hoặc đã chấm thì không còn là "pending"
const FINISHED_SUBMISSION_STATUSES = [
  ENUMS.AssignmentSubmissionsStatus.SUBMITTED,
  ENUMS.AssignmentSubmissionsStatus.GRADED,
];

/**
 * Chỉ tài khoản STUDENT được xem Student Dashboard
 * TODO: chuyển sang authorize('STUDENT') ở route khi middleware authorize được xây dựng
 * @param {Object} user - req.user { id, role }
 * @returns {void}
 */
export const assertStudent = (user) => {
  if (user.role !== ENUMS.UserRole.STUDENT) {
    throw new AppError('Only student accounts can view the student dashboard', 403);
  }
};

/**
 * Xác định trạng thái hiển thị của một bài tập chưa nộp
 * @param {Object} assignment - { due_date, allow_late_submission }
 * @param {boolean} isInProgress - học sinh đã có bài làm dở (IN_PROGRESS)
 * @param {Date} now
 * @returns {{ status: 'PENDING'|'IN_PROGRESS'|'OVERDUE', can_submit: boolean }}
 */
export const getAssignmentProgress = (assignment, isInProgress, now) => {
  let isOverdue = false;
  if (assignment.due_date) {
    isOverdue = new Date(assignment.due_date).getTime() < now.getTime();
  }

  if (isOverdue) {
    // Quá hạn: chỉ được nộp nếu bài cho phép nộp muộn
    return { status: 'OVERDUE', can_submit: assignment.allow_late_submission === true };
  }

  if (isInProgress) {
    return { status: 'IN_PROGRESS', can_submit: true };
  }

  return { status: 'PENDING', can_submit: true };
};

/**
 * Lấy id các lớp học sinh đang tham gia (thành viên ACTIVE, lớp ACTIVE)
 * @param {string} studentId
 * @returns {Promise<mongoose.Types.ObjectId[]>}
 */
const getActiveClassIds = async (studentId) => {
  const memberClassIds = await ClassMember.distinct('class_id', {
    user_id: studentId,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  });

  return Classroom.distinct('_id', {
    _id: { $in: memberClassIds },
    status: ENUMS.ClassroomsStatus.ACTIVE,
  });
};

/**
 * Lấy tên gia sư theo danh sách tutor_profile_id
 * @param {Array} tutorProfileIds
 * @returns {Promise<Map<string, string>>} tutor_profile_id -> full_name
 */
const getTutorNames = async (tutorProfileIds) => {
  const tutorNames = new Map();
  if (tutorProfileIds.length === 0) {
    return tutorNames;
  }

  const profiles = await TutorProfile.find({ _id: { $in: tutorProfileIds } })
    .select('user_id')
    .lean();
  const userIds = profiles.map((profile) => profile.user_id);
  const users = await User.find({ _id: { $in: userIds } })
    .select('full_name')
    .lean();

  const userNames = new Map();
  for (const user of users) {
    userNames.set(String(user._id), user.full_name);
  }
  for (const profile of profiles) {
    tutorNames.set(String(profile._id), userNames.get(String(profile.user_id)) || null);
  }
  return tutorNames;
};

/**
 * Lấy thông tin ngắn của các lớp (tên, môn, gia sư) để gắn vào buổi học / bài tập
 * @param {Array} classIds
 * @returns {Promise<Map<string, Object>>} class_id -> { _id, name, subject, tutor_name }
 */
const getClassSummaries = async (classIds) => {
  const classSummaries = new Map();
  if (classIds.length === 0) {
    return classSummaries;
  }

  const classrooms = await Classroom.find({ _id: { $in: classIds } })
    .select('name subject tutor_profile_id')
    .lean();
  const tutorNames = await getTutorNames(classrooms.map((classroom) => classroom.tutor_profile_id));

  for (const classroom of classrooms) {
    classSummaries.set(String(classroom._id), {
      _id: String(classroom._id),
      name: classroom.name,
      subject: classroom.subject,
      tutor_name: tutorNames.get(String(classroom.tutor_profile_id)) || null,
    });
  }
  return classSummaries;
};

/**
 * Danh sách lớp đang tham gia của học sinh
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listJoinedClasses = async (user, { page, limit }) => {
  assertStudent(user);

  const memberships = await ClassMember.find({
    user_id: user.id,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  })
    .select('class_id joined_at')
    .lean();

  const joinedAtByClass = new Map();
  for (const membership of memberships) {
    joinedAtByClass.set(String(membership.class_id), membership.joined_at);
  }

  const filter = {
    _id: { $in: memberships.map((membership) => membership.class_id) },
    status: ENUMS.ClassroomsStatus.ACTIVE,
  };
  const [classrooms, total] = await Promise.all([
    Classroom.find(filter)
      .select('name subject grade description tutor_profile_id')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Classroom.countDocuments(filter),
  ]);

  const tutorNames = await getTutorNames(classrooms.map((classroom) => classroom.tutor_profile_id));
  const items = classrooms.map((classroom) => {
    return {
      _id: String(classroom._id),
      name: classroom.name,
      subject: classroom.subject,
      grade: classroom.grade,
      description: classroom.description,
      tutor_name: tutorNames.get(String(classroom.tutor_profile_id)) || null,
      joined_at: joinedAtByClass.get(String(classroom._id)) || null,
    };
  });

  return { items: items, pagination: buildPagination(page, limit, total) };
};

/**
 * Buổi học SCHEDULED trong 7 ngày tới của các lớp đang tham gia, sớm nhất trước
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listUpcomingSessions = async (user, { page, limit }) => {
  assertStudent(user);

  const now = new Date();
  const windowEnd = new Date(now.getTime() + UPCOMING_WINDOW_DAYS * DAY_IN_MS);
  const classIds = await getActiveClassIds(user.id);

  const filter = {
    class_id: { $in: classIds },
    status: ENUMS.ClassSessionsStatus.SCHEDULED,
    start_time: { $gte: now, $lte: windowEnd },
  };
  const [sessions, total] = await Promise.all([
    ClassSession.find(filter)
      .select('class_id title start_time end_time meeting_link')
      .sort({ start_time: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ClassSession.countDocuments(filter),
  ]);

  const classSummaries = await getClassSummaries(sessions.map((session) => session.class_id));
  const items = sessions.map((session) => {
    return {
      _id: String(session._id),
      title: session.title,
      start_time: session.start_time,
      end_time: session.end_time,
      meeting_link: session.meeting_link,
      class: classSummaries.get(String(session.class_id)) || null,
    };
  });

  return { items: items, pagination: buildPagination(page, limit, total) };
};

/**
 * Bài tập đã xuất bản của các lớp đang tham gia mà học sinh chưa nộp, hạn nộp gần nhất trước
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listPendingAssignments = async (user, { page, limit }) => {
  assertStudent(user);

  const now = new Date();
  const classIds = await getActiveClassIds(user.id);
  const finishedAssignmentIds = await AssignmentSubmission.distinct('assignment_id', {
    student_user_id: user.id,
    status: { $in: FINISHED_SUBMISSION_STATUSES },
  });

  const filter = {
    class_id: { $in: classIds },
    status: ENUMS.AssignmentsStatus.PUBLISHED,
    _id: { $nin: finishedAssignmentIds },
    // Bài hẹn giờ xuất bản trong tương lai thì chưa hiện
    $or: [{ published_at: null }, { published_at: { $lte: now } }],
  };
  const [assignments, total] = await Promise.all([
    Assignment.find(filter)
      .select('class_id title due_date allow_late_submission total_points')
      .sort({ due_date: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Assignment.countDocuments(filter),
  ]);

  const inProgressAssignmentIds = await AssignmentSubmission.distinct('assignment_id', {
    student_user_id: user.id,
    status: ENUMS.AssignmentSubmissionsStatus.IN_PROGRESS,
    assignment_id: { $in: assignments.map((assignment) => assignment._id) },
  });
  const inProgressSet = new Set(inProgressAssignmentIds.map((id) => String(id)));

  const classSummaries = await getClassSummaries(assignments.map((assignment) => assignment.class_id));
  const items = assignments.map((assignment) => {
    const progress = getAssignmentProgress(assignment, inProgressSet.has(String(assignment._id)), now);
    return {
      _id: String(assignment._id),
      title: assignment.title,
      due_date: assignment.due_date,
      total_points: assignment.total_points,
      allow_late_submission: assignment.allow_late_submission === true,
      status: progress.status,
      can_submit: progress.can_submit,
      class: classSummaries.get(String(assignment.class_id)) || null,
    };
  });

  return { items: items, pagination: buildPagination(page, limit, total) };
};

/**
 * Điểm và nhận xét đã công bố (lần nộp đã chấm mới nhất của mỗi bài), mới chấm nhất trước
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listPublishedGrades = async (user, { page, limit }) => {
  assertStudent(user);

  const now = new Date();
  const studentId = new mongoose.Types.ObjectId(user.id);

  // Chỉ lấy bài tập mà gia sư đã công bố kết quả
  const gradedAssignmentIds = await AssignmentSubmission.distinct('assignment_id', {
    student_user_id: studentId,
    status: ENUMS.AssignmentSubmissionsStatus.GRADED,
  });
  const publishedAssignments = await Assignment.find({
    _id: { $in: gradedAssignmentIds },
    results_published_at: { $ne: null, $lte: now },
  })
    .select('class_id title total_points')
    .lean();

  const assignmentById = new Map();
  for (const assignment of publishedAssignments) {
    assignmentById.set(String(assignment._id), assignment);
  }

  const [result] = await AssignmentSubmission.aggregate([
    {
      $match: {
        student_user_id: studentId,
        status: ENUMS.AssignmentSubmissionsStatus.GRADED,
        assignment_id: { $in: publishedAssignments.map((assignment) => assignment._id) },
      },
    },
    // Mỗi bài tập chỉ giữ lần nộp đã chấm có attempt_number lớn nhất
    { $sort: { attempt_number: -1 } },
    { $group: { _id: '$assignment_id', submission: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$submission' } },
    { $sort: { graded_at: -1 } },
    {
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  let total = 0;
  if (result.total.length > 0) {
    total = result.total[0].count;
  }

  const classSummaries = await getClassSummaries(publishedAssignments.map((assignment) => assignment.class_id));
  const items = result.items.map((submission) => {
    const assignment = assignmentById.get(String(submission.assignment_id));
    return {
      _id: String(submission._id),
      assignment_id: String(submission.assignment_id),
      assignment_title: assignment.title,
      total_points: assignment.total_points,
      final_score: submission.final_score,
      overall_feedback: submission.overall_feedback,
      graded_at: submission.graded_at,
      class: classSummaries.get(String(assignment.class_id)) || null,
    };
  });

  return { items: items, pagination: buildPagination(page, limit, total) };
};
