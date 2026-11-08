import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import * as classroomService from '../services/classroom.service.js';

/**
 * UC21: POST /api/classroom/v1
 * Tạo lớp học mới
 */
export const createClassroom = asyncHandler(async (req, res) => {
  const origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
  const result = await classroomService.createClassroom({
    tutorProfile: req.tutorProfile,
    user: req.user,
    data: req.body,
    origin,
  });

  return responseCommon(
    res,
    result,
    'Khởi tạo lớp học trực tuyến thành công!',
    201,
    responseCode.SUCCESSED
  );
});

/**
 * GET /api/classroom/v1
 * Lấy danh sách lớp học của gia sư
 */
export const getMyClassrooms = asyncHandler(async (req, res) => {
  const classrooms = await classroomService.getUserClassrooms({
    user: req.user,
    tutorProfile: req.tutorProfile,
    query: req.query,
  });

  return responseCommon(
    res,
    classrooms,
    'Lấy danh sách lớp học thành công',
    200,
    responseCode.SUCCESSED
  );
});

/**
 * GET /api/classroom/v1/agreements
 * Lấy các thỏa thuận kết nối đã xác nhận để chọn tạo lớp (UC21.A1)
 */
export const getConfirmedAgreements = asyncHandler(async (req, res) => {
  const agreements = await classroomService.getConfirmedAgreementsForTutor(req.user);

  return responseCommon(
    res,
    agreements,
    'Lấy danh sách thỏa thuận xác nhận thành công',
    200,
    responseCode.SUCCESSED
  );
});

/**
 * GET /api/classroom/v1/:id
 * Lấy chi tiết lớp học
 */
export const getClassroomDetail = asyncHandler(async (req, res) => {
  const classroom = await classroomService.getClassroomDetail({
    classroomId: req.params.id,
    tutorProfile: req.tutorProfile,
    user: req.user,
  });

  return responseCommon(
    res,
    classroom,
    'Lấy chi tiết lớp học thành công',
    200,
    responseCode.SUCCESSED
  );
});

/**
 * ===================================================
 * UC22: Quản lý lớp học (Cập nhật, Lưu trữ, Xóa & Bảng tin)
 * ===================================================
 */

export const updateClassroom = asyncHandler(async (req, res) => {
  const updated = await classroomService.updateClassroom({
    classroomId: req.params.id,
    tutorProfile: req.tutorProfile,
    data: req.body,
  });

  return responseCommon(res, updated, 'Cập nhật thông tin lớp học thành công', 200, responseCode.SUCCESSED);
});

export const updateClassroomStatus = asyncHandler(async (req, res) => {
  const updated = await classroomService.updateClassroomStatus({
    classroomId: req.params.id,
    tutorProfile: req.tutorProfile,
    user: req.user,
    status: req.body.status,
  });

  return responseCommon(
    res,
    updated,
    `Lớp học đã được chuyển sang trạng thái ${updated.status}`,
    200,
    responseCode.SUCCESSED
  );
});

export const regenerateJoinCode = asyncHandler(async (req, res) => {
  const origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
  const result = await classroomService.regenerateJoinCode({
    classroomId: req.params.id,
    tutorProfile: req.tutorProfile,
    origin,
  });

  return responseCommon(res, result, 'Tạo mã tham gia lớp học mới thành công', 200, responseCode.SUCCESSED);
});

export const deleteClassroom = asyncHandler(async (req, res) => {
  const result = await classroomService.deleteClassroom({
    classroomId: req.params.id,
    tutorProfile: req.tutorProfile,
  });

  return responseCommon(res, result, result.message, 200, responseCode.SUCCESSED);
});

export const getClassAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await classroomService.getClassAnnouncements({
    classroomId: req.params.id,
  });

  return responseCommon(res, announcements, 'Lấy danh sách thông báo thành công', 200, responseCode.SUCCESSED);
});

export const createClassAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await classroomService.createClassAnnouncement({
    classroomId: req.params.id,
    tutorProfile: req.tutorProfile,
    data: req.body,
  });

  return responseCommon(res, announcement, 'Đăng thông báo lên bảng tin thành công', 201, responseCode.SUCCESSED);
});

export const updateClassAnnouncement = asyncHandler(async (req, res) => {
  const updated = await classroomService.updateClassAnnouncement({
    announcementId: req.params.announcementId,
    classroomId: req.params.id,
    tutorProfile: req.tutorProfile,
    data: req.body,
  });

  return responseCommon(res, updated, 'Chỉnh sửa thông báo thành công', 200, responseCode.SUCCESSED);
});

export const deleteClassAnnouncement = asyncHandler(async (req, res) => {
  const result = await classroomService.deleteClassAnnouncement({
    announcementId: req.params.announcementId,
    classroomId: req.params.id,
    tutorProfile: req.tutorProfile,
  });

  return responseCommon(res, result, result.message, 200, responseCode.SUCCESSED);
});

export const togglePinAnnouncement = asyncHandler(async (req, res) => {
  const updated = await classroomService.togglePinAnnouncement({
    announcementId: req.params.announcementId,
    classroomId: req.params.id,
    tutorProfile: req.tutorProfile,
  });

  return responseCommon(
    res,
    updated,
    updated.is_pinned ? 'Đã ghim thông báo lên đầu trang' : 'Đã bỏ ghim thông báo',
    200,
    responseCode.SUCCESSED
  );
});

/**
 * ===================================================
 * UC23: Quản lý thành viên lớp học (Members)
 * ===================================================
 */

export const getClassMembers = asyncHandler(async (req, res) => {
  const members = await classroomService.getClassMembers({
    classroomId: req.params.id,
  });

  return responseCommon(res, members, 'Lấy danh sách thành viên lớp thành công', 200, responseCode.SUCCESSED);
});

export const addMemberToClass = asyncHandler(async (req, res) => {
  const member = await classroomService.addMemberToClass({
    classroomId: req.params.id,
    tutorProfile: req.tutorProfile,
    data: req.body,
  });

  return responseCommon(res, member, 'Thêm học viên vào lớp thành công', 201, responseCode.SUCCESSED);
});

export const removeMemberFromClass = asyncHandler(async (req, res) => {
  const result = await classroomService.removeMemberFromClass({
    classroomId: req.params.id,
    memberId: req.params.memberId,
    tutorProfile: req.tutorProfile,
    reason: req.body.reason,
  });

  return responseCommon(res, result, 'Đã xóa thành viên khỏi lớp', 200, responseCode.SUCCESSED);
});

/**
 * ===================================================
 * UC24: Tham gia lớp học (Join Classroom)
 * ===================================================
 */

export const previewClassroomByCode = asyncHandler(async (req, res) => {
  const info = await classroomService.getClassroomByJoinCode({
    joinCode: req.params.joinCode,
  });

  return responseCommon(res, info, 'Thông tin lớp học', 200, responseCode.SUCCESSED);
});

export const joinClassroom = asyncHandler(async (req, res) => {
  const result = await classroomService.joinClassroomByCode({
    joinCode: req.body.join_code,
    user: req.user,
    child_user_id: req.body.child_user_id,
  });

  return responseCommon(res, result, 'Tham gia lớp học thành công!', 200, responseCode.SUCCESSED);
});

/**
 * ===================================================
 * UC33: Nhóm Chat lớp học (Group Chat)
 * ===================================================
 */

export const createClassGroupChat = asyncHandler(async (req, res) => {
  const conversation = await classroomService.createClassGroupChat({
    classroomId: req.params.id,
    tutorProfile: req.tutorProfile,
  });

  return responseCommon(res, conversation, 'Khởi tạo nhóm chat lớp học thành công', 201, responseCode.SUCCESSED);
});

export const getClassGroupChat = asyncHandler(async (req, res) => {
  const chat = await classroomService.getClassGroupChat({
    classroomId: req.params.id,
    user: req.user,
  });

  return responseCommon(res, chat, 'Tải lịch sử chat thành công', 200, responseCode.SUCCESSED);
});

export const sendClassChatMessage = asyncHandler(async (req, res) => {
  const msg = await classroomService.sendClassChatMessage({
    classroomId: req.params.id,
    user: req.user,
    content: req.body.content,
  });

  return responseCommon(res, msg, 'Gửi tin nhắn thành công', 201, responseCode.SUCCESSED);
});

/**
 * ===================================================
 * UC26 & UC27: Bài tập & Chấm điểm (Assignments & Grading)
 * ===================================================
 */

export const getClassAssignments = asyncHandler(async (req, res) => {
  const assignments = await classroomService.getClassAssignments({
    classroomId: req.params.id,
    user: req.user,
  });

  return responseCommon(res, assignments, 'Lấy danh sách bài tập thành công', 200, responseCode.SUCCESSED);
});

export const createAssignment = asyncHandler(async (req, res) => {
  const assignment = await classroomService.createAssignment({
    classroomId: req.params.id,
    tutorProfile: req.tutorProfile,
    data: req.body,
  });

  return responseCommon(res, assignment, 'Tạo bài tập thành công', 201, responseCode.SUCCESSED);
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await classroomService.updateAssignment({
    assignmentId: req.params.assignmentId,
    tutorProfile: req.tutorProfile,
    data: req.body,
  });

  return responseCommon(res, assignment, 'Cập nhật bài tập thành công', 200, responseCode.SUCCESSED);
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const result = await classroomService.deleteAssignment({
    assignmentId: req.params.assignmentId,
    tutorProfile: req.tutorProfile,
  });

  return responseCommon(res, result, result.message, 200, responseCode.SUCCESSED);
});

export const getAssignmentDetail = asyncHandler(async (req, res) => {
  const assignment = await classroomService.getAssignmentDetail({
    assignmentId: req.params.assignmentId,
    user: req.user,
  });

  return responseCommon(res, assignment, 'Chi tiết bài tập', 200, responseCode.SUCCESSED);
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const submission = await classroomService.submitAssignment({
    assignmentId: req.params.assignmentId,
    user: req.user,
    answers: req.body.answers,
  });

  return responseCommon(res, submission, 'Nộp bài tập thành công!', 201, responseCode.SUCCESSED);
});

export const getSubmissionsForAssignment = asyncHandler(async (req, res) => {
  const submissions = await classroomService.getSubmissionsForAssignment({
    assignmentId: req.params.assignmentId,
    tutorProfile: req.tutorProfile,
  });

  return responseCommon(res, submissions, 'Danh sách bài nộp', 200, responseCode.SUCCESSED);
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await classroomService.gradeSubmission({
    submissionId: req.params.submissionId,
    tutorProfile: req.tutorProfile,
    data: req.body,
  });

  return responseCommon(res, submission, 'Chấm điểm bài nộp thành công', 200, responseCode.SUCCESSED);
});

export const getPendingParentLinks = asyncHandler(async (req, res) => {
  const links = await classroomService.getPendingParentLinks({
    studentUserId: req.user._id,
  });

  return responseCommon(res, links, 'Lấy danh sách yêu cầu liên kết thành công', 200, responseCode.SUCCESSED);
});

export const respondParentChildLink = asyncHandler(async (req, res) => {
  const link = await classroomService.respondParentChildLink({
    studentUserId: req.user._id,
    linkId: req.params.linkId,
    action: req.body.action,
  });

  return responseCommon(res, link, 'Xử lý yêu cầu liên kết thành công', 200, responseCode.SUCCESSED);
});

