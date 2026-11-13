import mongoose from 'mongoose';
import { ParentChildLink } from '../models/ParentChildLink.js';
import { ClassSession } from '../models/ClassSession.js';
import { Assignment } from '../models/Assignment.js';
import { AssignmentSubmission } from '../models/AssignmentSubmission.js';
import { User } from '../models/User.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { assertRole } from '../common/utils/assertRole.js';
import { buildPagination } from '../common/utils/pagination.js';
import { getClassSummaries, listJoinedClasses, listUpcomingSessions } from './studentDashboard.service.js';

// UC35 – Phụ huynh theo dõi tiến độ của con: lớp, buổi học sắp tới, điểm danh, kết quả bài tập và xu hướng điểm.
// Dữ liệu lấy từ các collection có sẵn của lớp học (không thêm schema).

const { SessionAttendanceStatus } = ENUMS;

/**
 * Tính tỉ lệ chuyên cần từ số lượt điểm danh theo từng trạng thái
 * @param {{ present?: number, late?: number, absent?: number }} counts
 * @returns {{ present: number, late: number, absent: number, total: number, attended: number, rate: number|null }}
 * rate là phần trăm (1 chữ số thập phân) buổi đã tham dự (có mặt hoặc đi muộn đều tính là đã tham dự), null nếu chưa có lượt điểm danh nào
 */
export const buildAttendanceSummary = (counts) => {
  const present = counts.present || 0;
  const late = counts.late || 0;
  const absent = counts.absent || 0;
  const total = present + late + absent;
  const attended = present + late;

  let rate = null;
  if (total > 0) {
    rate = Math.round((attended / total) * 1000) / 10;
  }
  return { present: present, late: late, absent: absent, total: total, attended: attended, rate: rate };
};

/**
 * Điểm theo phần trăm (1 chữ số thập phân, trong khoảng 0-100); null nếu thiếu điểm hoặc tổng điểm
 * @param {number|null|undefined} score
 * @param {number|null|undefined} totalPoints
 * @returns {number|null}
 */
export const toScorePercent = (score, totalPoints) => {
  if (score === null || score === undefined || !totalPoints) {
    return null;
  }
  const percent = Math.round((score / totalPoints) * 1000) / 10;
  return Math.max(0, Math.min(100, percent));
};

/**
 * Tách điểm của bài nộp thành phần máy tự chấm (trắc nghiệm) và phần gia sư chấm tay
 * @param {Object[]} answers - submission.answers
 * @returns {{ auto_graded_points: number, manual_points: number, has_auto_graded: boolean }}
 */
export const splitAnswerScores = (answers) => {
  let autoGradedPoints = 0;
  let manualPoints = 0;
  let hasAutoGraded = false;

  for (const answer of answers || []) {
    if (answer.score === null || answer.score === undefined) {
      continue;
    }
    if (answer.is_auto_graded === true) {
      autoGradedPoints += answer.score;
      hasAutoGraded = true;
    } else {
      manualPoints += answer.score;
    }
  }
  return { auto_graded_points: autoGradedPoints, manual_points: manualPoints, has_auto_graded: hasAutoGraded };
};

/**
 * Xác nhận con đã liên kết (ACCEPTED) với phụ huynh. Không liên kết hoặc id sai đều trả 404 để không lộ thông tin
 * @param {Object} user - req.user { id, role }
 * @param {string} childId
 * @returns {Promise<{ _id: ObjectId, full_name: string, avatar_url: string|null }>}
 */
const getLinkedChild = async (user, childId) => {
  assertRole(user, ENUMS.UserRole.PARENT);
  if (!mongoose.isValidObjectId(childId)) {
    throw new AppError('Child not found', 404);
  }

  const link = await ParentChildLink.findOne({
    parent_user_id: user.id,
    student_user_id: childId,
    status: ENUMS.ParentChildLinksStatus.ACCEPTED,
  }).lean();
  if (!link) {
    throw new AppError('Child not found', 404);
  }

  const child = await User.findById(childId).select('full_name avatar_url').lean();
  if (!child) {
    throw new AppError('Child not found', 404);
  }
  return child;
};

// Dùng lại các hàm của Student Dashboard (UC36) với vai trò học sinh của con
const asStudent = (child) => ({ id: String(child._id), role: ENUMS.UserRole.STUDENT });

/**
 * Điều kiện match các buổi học đã có điểm danh của học sinh (bỏ buổi đã hủy)
 * @param {ObjectId} childObjectId
 * @returns {Object[]} các stage aggregate: match, lấy đúng dòng điểm danh của con, bỏ trạng thái rỗng
 */
const buildAttendanceStages = (childObjectId) => {
  return [
    {
      $match: {
        'attendance.student_user_id': childObjectId,
        status: { $ne: ENUMS.ClassSessionsStatus.CANCELLED },
      },
    },
    {
      $project: {
        class_id: 1,
        title: 1,
        start_time: 1,
        entry: {
          $filter: {
            input: '$attendance',
            as: 'item',
            cond: { $eq: ['$$item.student_user_id', childObjectId] },
          },
        },
      },
    },
    { $unwind: '$entry' },
    { $match: { 'entry.status': { $in: Object.values(SessionAttendanceStatus) } } },
  ];
};

/**
 * Đếm số lượt điểm danh của học sinh theo trạng thái
 * @param {ObjectId} childObjectId
 * @returns {Promise<ReturnType<typeof buildAttendanceSummary>>}
 */
const countAttendance = async (childObjectId) => {
  const rows = await ClassSession.aggregate([
    ...buildAttendanceStages(childObjectId),
    { $group: { _id: '$entry.status', count: { $sum: 1 } } },
  ]);

  const counts = { present: 0, late: 0, absent: 0 };
  for (const row of rows) {
    if (row._id === SessionAttendanceStatus.PRESENT) {
      counts.present = row.count;
    } else if (row._id === SessionAttendanceStatus.LATE) {
      counts.late = row.count;
    } else if (row._id === SessionAttendanceStatus.ABSENT) {
      counts.absent = row.count;
    }
  }
  return buildAttendanceSummary(counts);
};

/**
 * Bài nộp đã chấm của học sinh mà gia sư đã công bố kết quả, mỗi bài tập chỉ lấy lần nộp mới nhất
 * @param {ObjectId} childObjectId
 * @param {{ skip: number, limit: number, direction: 1|-1 }} options - direction: -1 mới nhất trước, 1 cũ nhất trước
 * @returns {Promise<{ submissions: Object[], total: number, assignmentById: Map<string, Object> }>}
 */
const findPublishedResults = async (childObjectId, { skip, limit, direction }) => {
  const now = new Date();
  const gradedAssignmentIds = await AssignmentSubmission.distinct('assignment_id', {
    student_user_id: childObjectId,
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
        student_user_id: childObjectId,
        status: ENUMS.AssignmentSubmissionsStatus.GRADED,
        assignment_id: { $in: publishedAssignments.map((assignment) => assignment._id) },
      },
    },
    { $sort: { attempt_number: -1 } },
    { $group: { _id: '$assignment_id', submission: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$submission' } },
    { $sort: { graded_at: direction, _id: direction } },
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  let total = 0;
  if (result.total.length > 0) {
    total = result.total[0].count;
  }
  return { submissions: result.items, total: total, assignmentById: assignmentById };
};

/**
 * Tổng quan tiến độ của một người con: số lớp, chuyên cần và điểm trung bình
 * @param {Object} user - req.user { id, role }
 * @param {string} childId
 * @returns {Promise<Object>} { child, class_count, attendance, results: { count, average_percent, latest } }
 */
export const getChildSummary = async (user, childId) => {
  const child = await getLinkedChild(user, childId);
  const childObjectId = child._id;

  const [classes, attendance, results] = await Promise.all([
    listJoinedClasses(asStudent(child), { page: 1, limit: 1 }),
    countAttendance(childObjectId),
    findPublishedResults(childObjectId, { skip: 0, limit: 1000, direction: -1 }),
  ]);

  const percents = [];
  for (const submission of results.submissions) {
    const assignment = results.assignmentById.get(String(submission.assignment_id));
    const percent = toScorePercent(submission.final_score, assignment.total_points);
    if (percent !== null) {
      percents.push(percent);
    }
  }

  let averagePercent = null;
  if (percents.length > 0) {
    const sum = percents.reduce((total, percent) => total + percent, 0);
    averagePercent = Math.round((sum / percents.length) * 10) / 10;
  }

  let latestPercent = null;
  if (results.submissions.length > 0) {
    const latest = results.submissions[0];
    latestPercent = toScorePercent(latest.final_score, results.assignmentById.get(String(latest.assignment_id)).total_points);
  }

  return {
    child: { _id: String(child._id), full_name: child.full_name, avatar_url: child.avatar_url || null },
    class_count: classes.pagination.total,
    attendance: attendance,
    results: { count: results.total, average_percent: averagePercent, latest_percent: latestPercent },
  };
};

/**
 * Các lớp con đang tham gia
 * @param {Object} user - req.user { id, role }
 * @param {string} childId
 * @param {Object} query - { page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listChildClasses = async (user, childId, query) => {
  const child = await getLinkedChild(user, childId);
  return listJoinedClasses(asStudent(child), query);
};

/**
 * Buổi học sắp diễn ra (7 ngày tới) của con, sớm nhất trước
 * @param {Object} user - req.user { id, role }
 * @param {string} childId
 * @param {Object} query - { page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listChildUpcomingSessions = async (user, childId, query) => {
  const child = await getLinkedChild(user, childId);
  return listUpcomingSessions(asStudent(child), query);
};

/**
 * Lịch sử điểm danh của con (mỗi buổi một dòng), buổi gần nhất trước
 * @param {Object} user - req.user { id, role }
 * @param {string} childId
 * @param {Object} query - { page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object, summary: Object }>} summary: tỉ lệ chuyên cần
 */
export const listChildAttendance = async (user, childId, { page, limit }) => {
  const child = await getLinkedChild(user, childId);

  const [pageResult] = await ClassSession.aggregate([
    ...buildAttendanceStages(child._id),
    { $sort: { start_time: -1, _id: -1 } },
    {
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  let total = 0;
  if (pageResult.total.length > 0) {
    total = pageResult.total[0].count;
  }

  const classSummaries = await getClassSummaries(pageResult.items.map((session) => session.class_id));
  const items = pageResult.items.map((session) => ({
    session_id: String(session._id),
    title: session.title,
    start_time: session.start_time,
    status: session.entry.status,
    comment: session.entry.comment || null,
    class: classSummaries.get(String(session.class_id)) || null,
  }));

  const summary = await countAttendance(child._id);
  return { items: items, pagination: buildPagination(page, limit, total), summary: summary };
};

/**
 * Chuyển một bài nộp đã chấm thành dòng kết quả cho phụ huynh
 * @param {Object} submission - AssignmentSubmission (lean)
 * @param {Object} assignment - { _id, title, total_points }
 * @param {Object|null} classSummary - { _id, name, subject, tutor_name }
 * @returns {Object}
 */
export const toResultDto = (submission, assignment, classSummary) => {
  const scores = splitAnswerScores(submission.answers);
  return {
    _id: String(submission._id),
    assignment_id: String(submission.assignment_id),
    assignment_title: assignment.title,
    total_points: assignment.total_points,
    final_score: submission.final_score,
    score_percent: toScorePercent(submission.final_score, assignment.total_points),
    auto_graded_points: scores.auto_graded_points,
    manual_points: scores.manual_points,
    has_auto_graded: scores.has_auto_graded,
    overall_feedback: submission.overall_feedback,
    timeliness: submission.timeliness,
    graded_at: submission.graded_at,
    class: classSummary,
  };
};

/**
 * Kết quả các bài tập đã được gia sư công bố của con, mới chấm trước
 * @param {Object} user - req.user { id, role }
 * @param {string} childId
 * @param {Object} query - { page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listChildResults = async (user, childId, { page, limit }) => {
  const child = await getLinkedChild(user, childId);
  const results = await findPublishedResults(child._id, { skip: (page - 1) * limit, limit: limit, direction: -1 });

  const classSummaries = await getClassSummaries([...results.assignmentById.values()].map((assignment) => assignment.class_id));
  const items = results.submissions.map((submission) => {
    const assignment = results.assignmentById.get(String(submission.assignment_id));
    return toResultDto(submission, assignment, classSummaries.get(String(assignment.class_id)) || null);
  });
  return { items: items, pagination: buildPagination(page, limit, results.total) };
};

/**
 * Xu hướng điểm: các bài đã công bố gần nhất, xếp từ cũ đến mới để vẽ biểu đồ
 * @param {Object} user - req.user { id, role }
 * @param {string} childId
 * @param {Object} query - { page, limit } (limit = số bài gần nhất, mặc định 10, tối đa 100)
 * @returns {Promise<{ items: Object[], pagination: Object }>} items: { assignment_id, assignment_title, score_percent, final_score, total_points, graded_at }
 */
export const getChildScoreTrend = async (user, childId, { page, limit }) => {
  const child = await getLinkedChild(user, childId);
  const results = await findPublishedResults(child._id, { skip: (page - 1) * limit, limit: limit, direction: -1 });

  // Lấy mới nhất trước để cắt đúng số bài gần nhất, rồi đảo lại theo thời gian tăng dần
  const items = results.submissions
    .map((submission) => {
      const assignment = results.assignmentById.get(String(submission.assignment_id));
      return {
        assignment_id: String(submission.assignment_id),
        assignment_title: assignment.title,
        final_score: submission.final_score,
        total_points: assignment.total_points,
        score_percent: toScorePercent(submission.final_score, assignment.total_points),
        graded_at: submission.graded_at,
      };
    })
    .reverse();
  return { items: items, pagination: buildPagination(page, limit, results.total) };
};

/**
 * Chi tiết một kết quả bài tập của con: điểm từng câu, phần máy tự chấm (trắc nghiệm), nhận xét của gia sư
 * @param {Object} user - req.user { id, role }
 * @param {string} childId
 * @param {string} submissionId
 * @returns {Promise<Object>} kết quả (như listChildResults) kèm questions[] và instructions
 */
export const getChildResultDetail = async (user, childId, submissionId) => {
  const child = await getLinkedChild(user, childId);
  if (!mongoose.isValidObjectId(submissionId)) {
    throw new AppError('Result not found', 404);
  }

  const submission = await AssignmentSubmission.findOne({
    _id: submissionId,
    student_user_id: child._id,
    status: ENUMS.AssignmentSubmissionsStatus.GRADED,
  }).lean();
  if (!submission) {
    throw new AppError('Result not found', 404);
  }

  // Chỉ xem được khi gia sư đã công bố kết quả của bài tập
  const assignment = await Assignment.findOne({
    _id: submission.assignment_id,
    results_published_at: { $ne: null, $lte: new Date() },
  }).lean();
  if (!assignment) {
    throw new AppError('Result not found', 404);
  }

  const classSummaries = await getClassSummaries([assignment.class_id]);
  const answerByQuestionId = new Map();
  for (const answer of submission.answers || []) {
    answerByQuestionId.set(String(answer.question_id), answer);
  }

  const questions = (assignment.questions || [])
    .map((question) => {
      const answer = answerByQuestionId.get(String(question._id)) || null;
      const isMultipleChoice = question.question_type === ENUMS.AssignmentQuestionsQuestionType.MULTIPLE_CHOICE;
      let answerDto = null;
      if (answer) {
        answerDto = {
          text_response: answer.text_response,
          file_url: answer.file_url,
          score: answer.score,
          is_auto_graded: answer.is_auto_graded === true,
          is_overridden: answer.is_overridden === true,
          comment: answer.comment || null,
        };
      }
      return {
        question_id: String(question._id),
        question_number: question.question_number,
        question_type: question.question_type,
        content: question.content,
        options: question.options || [],
        // Đáp án đúng chỉ hiện với câu trắc nghiệm (đã công bố kết quả)
        correct_answer: isMultipleChoice ? question.correct_answer : null,
        points: question.points,
        answer: answerDto,
      };
    })
    .sort((first, second) => (first.question_number || 0) - (second.question_number || 0));

  const dto = toResultDto(submission, assignment, classSummaries.get(String(assignment.class_id)) || null);
  return { ...dto, instructions: assignment.instructions || null, questions: questions };
};
