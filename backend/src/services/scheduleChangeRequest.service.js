import mongoose from 'mongoose';
import { AppError } from '../common/utils/AppError.js';
import { buildPagination } from '../common/utils/pagination.js';
import { ClassMember } from '../models/ClassMember.js';
import { ClassSession } from '../models/ClassSession.js';
import { Classroom } from '../models/Classroom.js';
import { Notification } from '../models/Notification.js';
import { ScheduleChangeRequest } from '../models/ScheduleChangeRequest.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { User } from '../models/User.js';
import { ENUMS } from '../models/enums.js';
import { updateClassSession } from './classSession.service.js';
import { getOwnedActiveClassroom, getStudentActiveClassroom } from './topic.service.js';
import { getTutorProfileOrThrow } from './tutorContext.service.js';

const MINIMUM_NOTICE_MS = 12 * 60 * 60 * 1000;

/**
 * Load a session and verify that the authenticated tutor or student can access its active classroom
 * @param {Object} user - Authenticated tutor or student { id, role }
 * @param {string} sessionId - Class session ID
 * @returns {Promise<{ session: Object, classroom: Object }>} Session and accessible classroom
 */
const getAccessibleSession = async (user, sessionId) => {
  if (!mongoose.isValidObjectId(sessionId)) {
    throw new AppError('Class session not found', 404);
  }

  const session = await ClassSession.findById(sessionId).lean();
  if (!session) {
    throw new AppError('Class session not found', 404);
  }

  let classroom;
  if (user.role === ENUMS.UserRole.TUTOR) {
    classroom = await getOwnedActiveClassroom(user, String(session.class_id));
  } else if (user.role === ENUMS.UserRole.STUDENT) {
    classroom = await getStudentActiveClassroom(user, String(session.class_id));
  } else {
    throw new AppError('Forbidden', 403);
  }

  return { session, classroom };
};

/**
 * Get active student IDs for one classroom
 * @param {ObjectId} classId - Classroom ID
 * @returns {Promise<ObjectId[]>} Active student user IDs
 */
const getActiveStudentIds = async (classId) => {
  const memberships = await ClassMember.find({
    class_id: classId,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  })
    .select('user_id')
    .lean();
  const memberIds = memberships.map((membership) => membership.user_id).filter(Boolean);

  if (memberIds.length === 0) {
    return [];
  }

  return User.distinct('_id', {
    _id: { $in: memberIds },
    role: ENUMS.UserRole.STUDENT,
    account_status: ENUMS.UserAccountStatus.ACTIVE,
  });
};

/**
 * Enforce the one-student request policy and minimum notice window
 * @param {Object} session - Class session
 * @param {ObjectId[]} studentIds - Active student IDs in the class
 * @returns {void}
 */
const validateRequestableSession = (session, studentIds) => {
  if (session.status === ENUMS.ClassSessionsStatus.CANCELLED) {
    throw new AppError('Cancelled sessions cannot have schedule change requests', 422);
  }

  const now = new Date();
  if (session.start_time <= now) {
    throw new AppError('Class session has already started', 422);
  }
  if (session.start_time.getTime() - now.getTime() < MINIMUM_NOTICE_MS) {
    throw new AppError('Schedule change requests must be submitted at least 12 hours before the session', 422);
  }
  if (studentIds.length !== 1) {
    throw new AppError('Schedule change requests are only available for classes with one active student', 422);
  }
};

/**
 * Send a schedule change notification without failing the underlying request action
 * @param {ObjectId} recipientId - Notification recipient
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {ObjectId} sessionId - Related session ID
 * @returns {Promise<void>}
 */
const notifyScheduleChange = async (recipientId, title, body, sessionId) => {
  try {
    await Notification.create({
      recipient_user_id: recipientId,
      category: ENUMS.NotificationsCategory.SCHEDULE_CHANGE,
      title,
      body,
      target_type: ENUMS.NotificationsTargetType.SESSION,
      target_id: sessionId,
      is_read: false,
    });
  } catch (error) {
    console.warn('[SCHEDULE_CHANGE] Could not create notification:', error.message);
  }
};

/**
 * Get visible classroom IDs for the authenticated tutor or student
 * @param {Object} user - Authenticated tutor or student { id, role }
 * @returns {Promise<ObjectId[]>} Classroom IDs visible to the user
 */
const getVisibleClassIds = async (user) => {
  if (user.role === ENUMS.UserRole.TUTOR) {
    const tutorProfile = await getTutorProfileOrThrow(user);
    return Classroom.distinct('_id', { tutor_profile_id: tutorProfile._id });
  }

  const memberships = await ClassMember.find({
    user_id: user.id,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  })
    .select('class_id')
    .lean();
  const memberClassIds = memberships.map((membership) => membership.class_id).filter(Boolean);
  if (memberClassIds.length === 0) {
    return [];
  }

  return Classroom.distinct('_id', { _id: { $in: memberClassIds } });
};

/**
 * Count active student members for multiple classrooms
 * @param {ObjectId[]} classIds - Classroom IDs
 * @returns {Promise<Map<string, number>>} Active student count by classroom ID
 */
const getActiveStudentCounts = async (classIds) => {
  const counts = new Map();
  if (classIds.length === 0) {
    return counts;
  }

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

  for (const membership of memberships) {
    if (activeStudentIdSet.has(String(membership.user_id))) {
      const classId = String(membership.class_id);
      counts.set(classId, (counts.get(classId) || 0) + 1);
    }
  }

  return counts;
};

/**
 * Format a populated schedule change request for the client
 * @param {Object} request - Populated request document
 * @param {Object} user - Current authenticated user
 * @param {Map<string, Object>} classroomsById - Classroom lookup
 * @param {Map<string, number>} studentCounts - Active student counts by classroom
 * @returns {Object} Client schedule change request DTO
 */
const toScheduleChangeRequestDto = (request, user, classroomsById, studentCounts) => {
  const session = request.session_id;
  const requester = request.requester_user_id;
  const isOutgoing = String(requester._id) === String(user.id);
  const classroom = session ? classroomsById.get(String(session.class_id)) : null;
  const activeStudentCount = session ? (studentCounts.get(String(session.class_id)) || 0) : 0;
  const classroomIsActive = classroom && classroom.status === ENUMS.ClassroomsStatus.ACTIVE;
  const isOppositeParty = (user.role === ENUMS.UserRole.TUTOR && requester.role === ENUMS.UserRole.STUDENT)
    || (user.role === ENUMS.UserRole.STUDENT && requester.role === ENUMS.UserRole.TUTOR);

  return {
    _id: String(request._id),
    request_type: request.request_type,
    status: request.status,
    proposed_start_time: request.proposed_start_time,
    proposed_end_time: request.proposed_end_time,
    reason: request.reason,
    response_comment: request.response_comment,
    created_at: request.created_at,
    responded_at: request.responded_at,
    direction: isOutgoing ? 'OUTGOING' : 'INCOMING',
    can_respond: !isOutgoing
      && isOppositeParty
      && classroomIsActive
      && session.status !== ENUMS.ClassSessionsStatus.CANCELLED
      && activeStudentCount === 1
      && request.status === ENUMS.ScheduleChangeRequestsStatus.PENDING,
    requester: {
      _id: String(requester._id),
      full_name: requester.full_name,
      role: requester.role,
    },
    responder: request.responder_user_id
      ? {
          _id: String(request.responder_user_id._id),
          full_name: request.responder_user_id.full_name,
        }
      : null,
    session: session
      ? {
          _id: String(session._id),
          class_id: String(session.class_id),
          class_name: classroom ? classroom.name : 'Lớp học',
          title: session.title,
          start_time: session.start_time,
          end_time: session.end_time,
          status: session.status,
          active_student_count: activeStudentCount,
        }
      : null,
  };
};

/**
 * List schedule change requests for sessions in classrooms visible to the authenticated user
 * @param {Object} user - Authenticated tutor or student { id, role }
 * @param {{ page: number, limit: number }} query - Pagination options
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listScheduleChangeRequests = async (user, { page, limit }) => {
  const classIds = await getVisibleClassIds(user);
  const sessions = await ClassSession.find({ class_id: { $in: classIds } })
    .select('_id class_id')
    .lean();
  const sessionIds = sessions.map((session) => session._id);
  const requestFilter = { session_id: { $in: sessionIds } };
  const [requests, total] = await Promise.all([
    ScheduleChangeRequest.find(requestFilter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('requester_user_id', 'full_name role')
      .populate('responder_user_id', 'full_name')
      .populate('session_id', 'class_id title start_time end_time status')
      .lean(),
    ScheduleChangeRequest.countDocuments(requestFilter),
  ]);
  const visibleClassrooms = await Classroom.find({ _id: { $in: classIds } })
    .select('_id name status')
    .lean();
  const classroomsById = new Map(visibleClassrooms.map((classroom) => [String(classroom._id), classroom]));
  const studentCounts = await getActiveStudentCounts(classIds);

  return {
    items: requests.map((request) => toScheduleChangeRequestDto(request, user, classroomsById, studentCounts)),
    pagination: buildPagination(page, limit, total),
  };
};

/**
 * Create a schedule move request for an upcoming session in a one-student class
 * @param {Object} user - Authenticated tutor or student { id, role }
 * @param {Object} data - { session_id, proposed_start_time, proposed_end_time, reason }
 * @returns {Promise<Object>} Created schedule change request
 */
export const createScheduleChangeRequest = async (user, data) => {
  // validate 1 đống thứ :)).
  // validate sự tồn tại của session
    // với role tutor: 
      // Validate thk tutor đã xong profile 
      // validate xem cái classroom có tồn tại ko ? 
      // validate xem classroom đó có thuộc quyền sở hữu của thk này ko ?
      // validate xem classroom status có able để sửa ko ? 
    // với role student:
      // check xem classID có hợp lệ ko và role có phải student ko :)))
      // check xem classroom có tồn tại ko ?
      // và status của class đấy có phải active ko?
      // check xem thk học sinh có phải mem của lớp đấy ko ? 
  const { session, classroom } = await getAccessibleSession(user, data.session_id);

  // lấy danh sách studentId theo lớp với status = active
  const studentIds = await getActiveStudentIds(classroom._id);


  // kiểm tra xem cái lớp && session này có thể tạo request hay ko
  //1. validate xem session đã hủy chưa ? 
  //2. validate xem session đã bắt đầu chwau ? 
  //3. validate xem session có trong khoảng 12h ko ? bắt request trước 12h trước khi đến session
  //4. check xem lớp có duy nhất 1 thk học sinh ko, nếu ko thì ko cho tạo do lúc đó tutor sẽ manage lịch
  validateRequestableSession(session, studentIds);

  //validate xem start time có bé hơn hiện tại ko ?
  if (data.proposed_start_time <= new Date()) {
    throw new AppError('Proposed session time must be in the future', 422);
  }

  // tag: cần xem lại. 
  // validate xem có ScheduleChangerequest khác cũng tồn tại của session này ko nếu có thì bắn lỗi 
  // ? vkl mâu thuẫn phết này :)))
  // chcek lại trong SRS thì có đoạn này thật. 
  if (await ScheduleChangeRequest.exists({
    session_id: session._id,
    status: ENUMS.ScheduleChangeRequestsStatus.PENDING,
  })) {
    throw new AppError('A pending schedule change request already exists for this session', 409);
  }

  // người nhận id, nếu người gửi là tutor thì ng nhận là thk member đầu tiên - sai nhé :)) vì member có cả phụ huynh trong đó :))). 
  // thực ra xóa parent khỏi member thì hợp lý hơn :)) - ko bt nữa. để chat thì vẫn cần thật.
  let recipientId;
  if (user.role === ENUMS.UserRole.TUTOR) {
    recipientId = studentIds[0];
  } else {
    const tutorProfile = await TutorProfile.findById(classroom.tutor_profile_id).select('user_id').lean();
    if (!tutorProfile || !tutorProfile.user_id) {
      throw new AppError('Class tutor not found', 404);
    }
    recipientId = tutorProfile.user_id;
  }

  // tạo object đẩy xuống db
  const request = await ScheduleChangeRequest.create({
    session_id: session._id,
    requester_user_id: user.id,
    responder_user_id: null,
    request_type: ENUMS.ScheduleChangeRequestsRequestType.MOVE,
    proposed_start_time: data.proposed_start_time,
    proposed_end_time: data.proposed_end_time,
    reason: data.reason,
    status: ENUMS.ScheduleChangeRequestsStatus.PENDING,
    response_comment: null,
    responded_at: null,
  });
  const requester = await User.findById(user.id).select('full_name').lean();
  const proposedStartLabel = data.proposed_start_time.toLocaleString('vi-VN');
  await notifyScheduleChange(
    recipientId,
    'Yêu cầu đổi lịch học',
    `${requester?.full_name || 'Thành viên lớp'} đề nghị chuyển buổi “${session.title || 'Buổi học'}” sang ${proposedStartLabel}.`,
    session._id,
  );

  return {
    _id: String(request._id),
    session_id: String(request.session_id),
    request_type: request.request_type,
    proposed_start_time: request.proposed_start_time,
    proposed_end_time: request.proposed_end_time,
    reason: request.reason,
    status: request.status,
    created_at: request.created_at,
  };
};

/**
 * Accept or reject a pending request from the other party in a one-student class
 * @param {Object} user - Authenticated tutor or student { id, role }
 * @param {string} requestId - Schedule change request ID
 * @param {{ decision: string, response_comment: string }} data - Decision and optional response comment
 * @returns {Promise<Object>} Updated schedule change request
 */
export const respondScheduleChangeRequest = async (user, requestId, data) => {
  if (!mongoose.isValidObjectId(requestId)) {
    throw new AppError('Schedule change request not found', 404);
  }

  const request = await ScheduleChangeRequest.findById(requestId)
    .populate('requester_user_id', 'full_name role')
    .lean();
  if (!request) {
    throw new AppError('Schedule change request not found', 404);
  }
  if (request.status !== ENUMS.ScheduleChangeRequestsStatus.PENDING) {
    throw new AppError('Schedule change request is no longer pending', 409);
  }
  if (!request.requester_user_id || String(request.requester_user_id._id) === String(user.id)) {
    throw new AppError('Only the other party can respond to this request', 403);
  }

  const { session, classroom } = await getAccessibleSession(user, String(request.session_id));
  if (session.status === ENUMS.ClassSessionsStatus.CANCELLED) {
    throw new AppError('Cancelled sessions cannot have schedule change requests', 409);
  }
  
  const studentIds = await getActiveStudentIds(classroom._id);
  if (studentIds.length !== 1) {
    throw new AppError('Schedule change requests are only available for classes with one active student', 409);
  }

  const requesterRole = request.requester_user_id.role;
  const canRespond = (user.role === ENUMS.UserRole.TUTOR && requesterRole === ENUMS.UserRole.STUDENT)
    || (user.role === ENUMS.UserRole.STUDENT && requesterRole === ENUMS.UserRole.TUTOR);
  if (!canRespond) {
    throw new AppError('Only the other party can respond to this request', 403);
  }

  if (data.decision === 'REJECT') {
    const rejectedRequest = await ScheduleChangeRequest.findOneAndUpdate(
      { _id: request._id, status: ENUMS.ScheduleChangeRequestsStatus.PENDING },
      {
        $set: {
          status: ENUMS.ScheduleChangeRequestsStatus.REJECTED,
          responder_user_id: user.id,
          response_comment: data.response_comment,
          responded_at: new Date(),
        },
      },
      { new: true },
    ).lean();
    if (!rejectedRequest) {
      throw new AppError('Schedule change request is no longer pending', 409);
    }
    await notifyScheduleChange(
      request.requester_user_id._id,
      'Yêu cầu đổi lịch bị từ chối',
      `Yêu cầu đổi buổi “${session.title || 'Buổi học'}” đã bị từ chối. Lý do: ${data.response_comment}`,
      session._id,
    );
    return { _id: String(rejectedRequest._id), status: rejectedRequest.status, responded_at: rejectedRequest.responded_at };
  }

  if (session.start_time <= new Date() || request.proposed_start_time <= new Date()) {
    throw new AppError('Schedule changes can only be accepted before the session starts and for a future time', 422);
  }

  let tutorUser;
  if (user.role === ENUMS.UserRole.TUTOR) {
    tutorUser = user;
  } else {
    const tutorProfile = await TutorProfile.findById(classroom.tutor_profile_id).select('user_id').lean();
    if (!tutorProfile || !tutorProfile.user_id) {
      throw new AppError('Class tutor not found', 404);
    }
    tutorUser = { id: String(tutorProfile.user_id), role: ENUMS.UserRole.TUTOR };
  }

  const approvedRequest = await ScheduleChangeRequest.findOneAndUpdate(
    { _id: request._id, status: ENUMS.ScheduleChangeRequestsStatus.PENDING },
    {
      $set: {
        status: ENUMS.ScheduleChangeRequestsStatus.APPROVED,
        responder_user_id: user.id,
        response_comment: data.response_comment || null,
        responded_at: new Date(),
      },
    },
    { new: true },
  ).lean();
  if (!approvedRequest) {
    throw new AppError('Schedule change request is no longer pending', 409);
  }

  try {
    await updateClassSession(tutorUser, String(classroom._id), String(session._id), {
      start_time: request.proposed_start_time,
      end_time: request.proposed_end_time,
    });
  } catch (error) {
    await ScheduleChangeRequest.updateOne(
      { _id: request._id, status: ENUMS.ScheduleChangeRequestsStatus.APPROVED },
      { $set: { status: ENUMS.ScheduleChangeRequestsStatus.PENDING, responder_user_id: null, response_comment: null, responded_at: null } },
    );
    throw error;
  }

  if (request.requester_user_id.role === ENUMS.UserRole.TUTOR) {
    await notifyScheduleChange(
      request.requester_user_id._id,
      'Yêu cầu đổi lịch đã được chấp nhận',
      `Buổi “${session.title || 'Buổi học'}” đã được chuyển sang ${request.proposed_start_time.toLocaleString('vi-VN')}.`,
      session._id,
    );
  }
  return { _id: String(approvedRequest._id), status: approvedRequest.status, responded_at: approvedRequest.responded_at };
};

/**
 * Load a pending request created by the authenticated user, together with its accessible session
 * @param {Object} user - Authenticated tutor or student { id, role }
 * @param {string} requestId - Schedule change request ID
 * @returns {Promise<{ request: Object, session: Object, classroom: Object }>}
 */
const getOwnPendingRequest = async (user, requestId) => {
  if (!mongoose.isValidObjectId(requestId)) {
    throw new AppError('Schedule change request not found', 404);
  }
  const request = await ScheduleChangeRequest.findById(requestId).lean();
  if (!request) {
    throw new AppError('Schedule change request not found', 404);
  }
  if (String(request.requester_user_id) !== String(user.id)) {
    throw new AppError('Only the requester can change this request', 403);
  }
  if (request.status !== ENUMS.ScheduleChangeRequestsStatus.PENDING) {
    throw new AppError('Schedule change request is no longer pending', 409);
  }
  const { session, classroom } = await getAccessibleSession(user, String(request.session_id));
  return { request, session, classroom };
};

/**
 * Resolve who receives notifications about a request: the only active student when the tutor is the requester, otherwise the tutor
 * @param {Object} user - Requester { id, role }
 * @param {Object} classroom - Classroom of the session
 * @param {Array} studentIds - Active student IDs of the classroom
 * @returns {Promise<ObjectId|null>}
 */
const getOtherPartyId = async (user, classroom, studentIds) => {
  if (user.role === ENUMS.UserRole.TUTOR) {
    return studentIds[0] || null;
  }
  const tutorProfile = await TutorProfile.findById(classroom.tutor_profile_id).select('user_id').lean();
  return tutorProfile ? tutorProfile.user_id : null;
};

/**
 * Edit the proposed time and reason of the requester's own pending request (before it expires)
 * @param {Object} user - Authenticated tutor or student { id, role }
 * @param {string} requestId - Schedule change request ID
 * @param {{ proposed_start_time: Date, proposed_end_time: Date, reason: string }} data - New proposal
 * @returns {Promise<Object>} Updated schedule change request
 */
export const updateScheduleChangeRequest = async (user, requestId, data) => {
  const { request, session, classroom } = await getOwnPendingRequest(user, requestId);
  const now = new Date();
  if (request.proposed_start_time <= now) {
    throw new AppError('Schedule change request has expired', 409);
  }

  // Cùng điều kiện như lúc tạo: buổi chưa hủy, chưa bắt đầu, còn ≥ 12h, lớp có đúng 1 học sinh
  const studentIds = await getActiveStudentIds(classroom._id);
  validateRequestableSession(session, studentIds);
  if (data.proposed_start_time <= now) {
    throw new AppError('Proposed session time must be in the future', 422);
  }

  const updatedRequest = await ScheduleChangeRequest.findOneAndUpdate(
    { _id: request._id, status: ENUMS.ScheduleChangeRequestsStatus.PENDING },
    {
      $set: {
        proposed_start_time: data.proposed_start_time,
        proposed_end_time: data.proposed_end_time,
        reason: data.reason,
      },
    },
    { new: true, runValidators: true },
  ).lean();
  if (!updatedRequest) {
    throw new AppError('Schedule change request is no longer pending', 409);
  }

  const recipientId = await getOtherPartyId(user, classroom, studentIds);
  if (recipientId) {
    await notifyScheduleChange(
      recipientId,
      'Yêu cầu đổi lịch đã được cập nhật',
      `Đề nghị đổi buổi “${session.title || 'Buổi học'}” đã được sửa sang ${data.proposed_start_time.toLocaleString('vi-VN')}.`,
      session._id,
    );
  }

  return {
    _id: String(updatedRequest._id),
    session_id: String(updatedRequest.session_id),
    proposed_start_time: updatedRequest.proposed_start_time,
    proposed_end_time: updatedRequest.proposed_end_time,
    reason: updatedRequest.reason,
    status: updatedRequest.status,
  };
};

/**
 * Withdraw the requester's own pending request (kept as WITHDRAWN for history instead of being deleted)
 * @param {Object} user - Authenticated tutor or student { id, role }
 * @param {string} requestId - Schedule change request ID
 * @returns {Promise<{ _id: string, status: string }>}
 */
export const withdrawScheduleChangeRequest = async (user, requestId) => {
  const { request, session, classroom } = await getOwnPendingRequest(user, requestId);
  const now = new Date();
  if (session.start_time <= now || request.proposed_start_time <= now) {
    throw new AppError('Schedule change request has expired', 409);
  }

  const withdrawnRequest = await ScheduleChangeRequest.findOneAndUpdate(
    { _id: request._id, status: ENUMS.ScheduleChangeRequestsStatus.PENDING },
    { $set: { status: ENUMS.ScheduleChangeRequestsStatus.WITHDRAWN } },
    { new: true },
  ).lean();
  if (!withdrawnRequest) {
    throw new AppError('Schedule change request is no longer pending', 409);
  }

  const studentIds = await getActiveStudentIds(classroom._id);
  const recipientId = await getOtherPartyId(user, classroom, studentIds);
  if (recipientId) {
    await notifyScheduleChange(
      recipientId,
      'Yêu cầu đổi lịch đã được rút lại',
      `Đề nghị đổi buổi “${session.title || 'Buổi học'}” đã được người gửi rút lại.`,
      session._id,
    );
  }

  return { _id: String(withdrawnRequest._id), status: withdrawnRequest.status };
};
