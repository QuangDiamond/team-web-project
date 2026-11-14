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
export const getClassSummaries = async (classIds) => {
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

/**
 * Danh sách tất cả bài tập của học sinh từ các lớp đang tham gia
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { page, limit, status, classId, search }
 * @returns {Promise<{ items: Object[], pagination: Object, counts: Object }>}
 */
export const listAllAssignments = async (user, { page, limit, status, classId, search }) => {
  assertStudent(user);

  const now = new Date();
  const classIds = await getActiveClassIds(user.id);
  const counts = { ALL: 0, PENDING: 0, SUBMITTED: 0, GRADED: 0, OVERDUE: 0 };

  if (classIds.length === 0) {
    return { items: [], pagination: buildPagination(page, limit, 0), counts };
  }

  let targetClassIds = classIds;
  if (classId) {
    const isMemberOfClass = classIds.some((id) => String(id) === String(classId));
    if (!isMemberOfClass) {
      return { items: [], pagination: buildPagination(page, limit, 0), counts };
    }
    targetClassIds = [new mongoose.Types.ObjectId(classId)];
  }

  const assignmentFilter = {
    class_id: { $in: targetClassIds },
    status: ENUMS.AssignmentsStatus.PUBLISHED,
    $or: [{ published_at: null }, { published_at: { $lte: now } }],
  };

  if (search && search.trim()) {
    assignmentFilter.title = { $regex: search.trim(), $options: 'i' };
  }

  const allAssignments = await Assignment.find(assignmentFilter)
    .select('class_id title instructions due_date allow_late_submission allow_resubmission total_points published_at results_published_at questions')
    .sort({ due_date: 1, created_at: -1 })
    .lean();

  if (allAssignments.length === 0) {
    return { items: [], pagination: buildPagination(page, limit, 0), counts };
  }

  const assignmentIds = allAssignments.map((a) => a._id);
  const submissions = await AssignmentSubmission.find({
    student_user_id: user.id,
    assignment_id: { $in: assignmentIds },
  })
    .sort({ attempt_number: -1 })
    .lean();

  const submissionByAssignment = new Map();
  for (const sub of submissions) {
    const key = String(sub.assignment_id);
    if (!submissionByAssignment.has(key)) {
      submissionByAssignment.set(key, sub);
    }
  }

  const classSummaries = await getClassSummaries(allAssignments.map((a) => a.class_id));

  const mappedItems = allAssignments.map((assignment) => {
    const sub = submissionByAssignment.get(String(assignment._id)) || null;

    let derivedStatus = 'PENDING';
    const isPastDue = assignment.due_date ? new Date(assignment.due_date).getTime() < now.getTime() : false;

    if (sub) {
      if (sub.status === ENUMS.AssignmentSubmissionsStatus.GRADED) {
        derivedStatus = 'GRADED';
      } else if (sub.status === ENUMS.AssignmentSubmissionsStatus.SUBMITTED) {
        derivedStatus = 'SUBMITTED';
      } else if (isPastDue) {
        derivedStatus = 'OVERDUE';
      } else {
        derivedStatus = 'PENDING';
      }
    } else if (isPastDue) {
      derivedStatus = 'OVERDUE';
    } else {
      derivedStatus = 'PENDING';
    }

    let canSubmit = true;
    if (
      derivedStatus === 'GRADED' ||
      (assignment.results_published_at && new Date(assignment.results_published_at).getTime() <= now.getTime())
    ) {
      canSubmit = false;
    } else if (derivedStatus === 'SUBMITTED' && assignment.allow_resubmission === false) {
      canSubmit = false;
    } else if (derivedStatus === 'OVERDUE' && assignment.allow_late_submission !== true) {
      canSubmit = false;
    }

    counts.ALL += 1;
    if (counts[derivedStatus] !== undefined) {
      counts[derivedStatus] += 1;
    }

    return {
      _id: String(assignment._id),
      title: assignment.title,
      instructions: assignment.instructions,
      due_date: assignment.due_date,
      total_points: assignment.total_points || 10,
      allow_late_submission: assignment.allow_late_submission === true,
      allow_resubmission: assignment.allow_resubmission === true,
      results_published_at: assignment.results_published_at,
      question_count: assignment.questions?.length || 0,
      status: derivedStatus,
      can_submit: canSubmit,
      submission: sub
        ? {
            _id: String(sub._id),
            status: sub.status,
            timeliness: sub.timeliness,
            provisional_score: sub.provisional_score,
            final_score: sub.final_score,
            overall_feedback: sub.overall_feedback,
            submitted_at: sub.submitted_at,
            graded_at: sub.graded_at,
            attempt_number: sub.attempt_number,
          }
        : null,
      class: classSummaries.get(String(assignment.class_id)) || null,
    };
  });

  let filtered = mappedItems;
  if (status && status !== 'ALL') {
    filtered = mappedItems.filter((item) => item.status === status);
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);

  return { items, pagination: buildPagination(page, limit, total), counts };
};

/**
 * Lấy dữ liệu hoạt động học tập của học sinh theo các tuần gần nhất để vẽ biểu đồ đường
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { weeks }
 * @returns {Promise<{ summary: Object, points: Object[] }>}
 */
export const getLearningActivity = async (user, { weeks = 6 } = {}) => {
  assertStudent(user);

  const numWeeks = Math.min(Math.max(Number(weeks) || 6, 4), 12);
  const now = new Date();
  const studentId = new mongoose.Types.ObjectId(user.id);
  const classIds = await getActiveClassIds(user.id);

  // 1. Lấy tất cả bài nộp của học sinh
  const submissions = await AssignmentSubmission.find({
    student_user_id: studentId,
    status: { $in: [ENUMS.AssignmentSubmissionsStatus.SUBMITTED, ENUMS.AssignmentSubmissionsStatus.GRADED] },
  })
    .select('status final_score provisional_score submitted_at graded_at created_at')
    .lean();

  // 2. Lấy tất cả buổi học của các lớp đang tham gia
  let sessions = [];
  if (classIds.length > 0) {
    sessions = await ClassSession.find({
      class_id: { $in: classIds },
      status: { $ne: ENUMS.ClassSessionsStatus.CANCELLED },
    })
      .select('start_time end_time')
      .lean();
  }

  // 3. Tính toán từng khoảng tuần (từ tuần xa nhất đến tuần hiện tại)
  const points = [];
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekEnd = new Date(now.getTime() - i * oneWeekMs);
    const weekStart = new Date(now.getTime() - (i + 1) * oneWeekMs);

    // Lọc bài nộp trong tuần
    const weekSubmissions = submissions.filter((sub) => {
      const time = new Date(sub.submitted_at || sub.created_at).getTime();
      return time >= weekStart.getTime() && time < weekEnd.getTime();
    });

    // Lọc bài đã có điểm trong tuần
    const gradedSubmissions = weekSubmissions.filter(
      (sub) => sub.status === ENUMS.AssignmentSubmissionsStatus.GRADED && typeof sub.final_score === 'number'
    );

    let avgScore = null;
    if (gradedSubmissions.length > 0) {
      const sum = gradedSubmissions.reduce((acc, cur) => acc + cur.final_score, 0);
      avgScore = Math.round((sum / gradedSubmissions.length) * 10) / 10;
    }

    // Lọc buổi học trong tuần
    const weekSessions = sessions.filter((s) => {
      const time = new Date(s.start_time).getTime();
      return time >= weekStart.getTime() && time < weekEnd.getTime();
    });

    const startStr = `${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')}`;
    const endStr = `${String(weekEnd.getDate()).padStart(2, '0')}/${String(weekEnd.getMonth() + 1).padStart(2, '0')}`;

    points.push({
      weekIndex: numWeeks - i,
      label: `${startStr} - ${endStr}`,
      shortLabel: i === 0 ? 'Hiện tại' : `T-${i}`,
      avgScore: avgScore,
      submissionsCount: weekSubmissions.length,
      sessionsCount: weekSessions.length,
      activityCount: weekSubmissions.length + weekSessions.length,
    });
  }

  // 4. Tổng quan (Summary)
  const allGraded = submissions.filter(
    (sub) => sub.status === ENUMS.AssignmentSubmissionsStatus.GRADED && typeof sub.final_score === 'number'
  );
  let overallAvgScore = 0;
  if (allGraded.length > 0) {
    const sum = allGraded.reduce((acc, cur) => acc + cur.final_score, 0);
    overallAvgScore = Math.round((sum / allGraded.length) * 10) / 10;
  }

  const summary = {
    totalSubmissions: submissions.length,
    gradedSubmissionsCount: allGraded.length,
    averageScore: overallAvgScore,
    totalSessions: sessions.filter((s) => new Date(s.start_time).getTime() <= now.getTime()).length,
    totalActivities:
      submissions.length + sessions.filter((s) => new Date(s.start_time).getTime() <= now.getTime()).length,
  };

  return { summary, points };
};

/**
 * Lịch sử các lần nộp bài tập của học sinh
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { page, limit, classId, search, status }
 * @returns {Promise<{ items: Object[], pagination: Object, stats: Object }>}
 */
export const listSubmissionHistory = async (user, { page, limit, classId, search, status = 'ALL' }) => {
  assertStudent(user);

  const studentId = new mongoose.Types.ObjectId(user.id);
  const classIds = await getActiveClassIds(user.id);
  const emptyResult = {
    items: [],
    pagination: buildPagination(page, limit, 0),
    stats: { totalSubmissions: 0, gradedCount: 0, averageScore: 0 },
  };

  if (classIds.length === 0) {
    return emptyResult;
  }

  let targetClassIds = classIds;
  if (classId) {
    const isMemberOfClass = classIds.some((id) => String(id) === String(classId));
    if (!isMemberOfClass) {
      return emptyResult;
    }
    targetClassIds = [new mongoose.Types.ObjectId(classId)];
  }

  const assignmentFilter = {
    class_id: { $in: targetClassIds },
  };
  if (search && search.trim()) {
    assignmentFilter.title = { $regex: search.trim(), $options: 'i' };
  }

  const matchingAssignments = await Assignment.find(assignmentFilter)
    .select('class_id title total_points due_date results_published_at')
    .lean();

  if (matchingAssignments.length === 0) {
    return emptyResult;
  }

  const assignmentById = new Map();
  for (const asg of matchingAssignments) {
    assignmentById.set(String(asg._id), asg);
  }

  const submissionFilter = {
    student_user_id: studentId,
    assignment_id: { $in: matchingAssignments.map((a) => a._id) },
    status: { $in: [ENUMS.AssignmentSubmissionsStatus.SUBMITTED, ENUMS.AssignmentSubmissionsStatus.GRADED] },
  };
  if (status && status !== 'ALL') {
    submissionFilter.status = status;
  }

  const [submissions, total] = await Promise.all([
    AssignmentSubmission.find(submissionFilter)
      .select('assignment_id attempt_number status timeliness provisional_score final_score overall_feedback submitted_at graded_at created_at')
      .sort({ submitted_at: -1, created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AssignmentSubmission.countDocuments(submissionFilter),
  ]);

  const classSummaries = await getClassSummaries(matchingAssignments.map((a) => a.class_id));

  const items = submissions.map((sub) => {
    const asg = assignmentById.get(String(sub.assignment_id));
    return {
      _id: String(sub._id),
      assignment_id: String(sub.assignment_id),
      attempt_number: sub.attempt_number || 1,
      status: sub.status,
      timeliness: sub.timeliness || 'ON_TIME',
      provisional_score: sub.provisional_score,
      final_score: sub.final_score,
      overall_feedback: sub.overall_feedback,
      submitted_at: sub.submitted_at || sub.created_at,
      graded_at: sub.graded_at,
      assignment: asg
        ? {
            _id: String(asg._id),
            title: asg.title,
            total_points: asg.total_points || 10,
            due_date: asg.due_date,
            results_published_at: asg.results_published_at,
          }
        : null,
      class: asg ? classSummaries.get(String(asg.class_id)) || null : null,
    };
  });

  const allStudentSubmissions = await AssignmentSubmission.find({
    student_user_id: studentId,
    assignment_id: { $in: matchingAssignments.map((a) => a._id) },
    status: { $in: [ENUMS.AssignmentSubmissionsStatus.SUBMITTED, ENUMS.AssignmentSubmissionsStatus.GRADED] },
  })
    .select('status final_score')
    .lean();

  const gradedSubmissions = allStudentSubmissions.filter(
    (s) => s.status === ENUMS.AssignmentSubmissionsStatus.GRADED && typeof s.final_score === 'number'
  );
  let averageScore = 0;
  if (gradedSubmissions.length > 0) {
    const sum = gradedSubmissions.reduce((acc, cur) => acc + cur.final_score, 0);
    averageScore = Math.round((sum / gradedSubmissions.length) * 10) / 10;
  }

  const stats = {
    totalSubmissions: allStudentSubmissions.length,
    gradedCount: gradedSubmissions.length,
    averageScore,
  };

  return { items, pagination: buildPagination(page, limit, total), stats };
};

/**
 * Lấy danh sách lịch học của học sinh theo khoảng thời gian (UC30 / UC32)
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { startDate, endDate, classId, status }
 * @returns {Promise<{ items: Object[], stats: Object }>}
 */
export const listStudentSchedule = async (user, query = {}) => {
  assertStudent(user);

  const activeClassIds = await getActiveClassIds(user.id);
  if (activeClassIds.length === 0) {
    return {
      items: [],
      stats: { totalSessions: 0, upcomingCount: 0, completedCount: 0 },
    };
  }

  let targetClassIds = activeClassIds;
  if (query.classId) {
    const isJoined = activeClassIds.some((id) => String(id) === String(query.classId));
    if (!isJoined) {
      throw new AppError('Forbidden: Bạn không thuộc lớp học này', 403);
    }
    targetClassIds = [query.classId];
  }

  const filter = {
    class_id: { $in: targetClassIds },
  };

  if (query.status && query.status !== 'ALL') {
    filter.status = query.status;
  } else {
    filter.status = { $ne: ENUMS.ClassSessionsStatus.CANCELLED };
  }

  if (query.startDate || query.endDate) {
    filter.start_time = {};
    if (query.startDate) {
      filter.start_time.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.start_time.$lte = new Date(query.endDate);
    }
  }

  const sessions = await ClassSession.find(filter)
    .sort({ start_time: 1 })
    .lean();

  const classSummaries = await getClassSummaries(sessions.map((s) => s.class_id));

  const now = new Date();
  let upcomingCount = 0;
  let completedCount = 0;

  const items = sessions.map((s) => {
    const startTime = new Date(s.start_time);
    const endTime = new Date(s.end_time);
    const isCompleted = s.status === ENUMS.ClassSessionsStatus.COMPLETED || endTime < now;
    const isUpcoming = s.status === ENUMS.ClassSessionsStatus.SCHEDULED && startTime >= now;

    if (isUpcoming) upcomingCount += 1;
    if (isCompleted) completedCount += 1;

    return {
      _id: String(s._id),
      class_id: String(s.class_id),
      title: s.title,
      start_time: s.start_time,
      end_time: s.end_time,
      meeting_link: s.meeting_link,
      status: s.status,
      class: classSummaries.get(String(s.class_id)) || null,
    };
  });

  return {
    items,
    stats: {
      totalSessions: items.length,
      upcomingCount,
      completedCount,
    },
  };
};
