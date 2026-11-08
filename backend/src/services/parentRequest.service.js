import mongoose from 'mongoose';
import { ParentRequest } from '../models/ParentRequest.js';
import { ParentChildLink } from '../models/ParentChildLink.js';
import { ApplyRequest } from '../models/ApplyRequest.js';
import { User } from '../models/User.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { assertRole } from '../common/utils/assertRole.js';
import { buildPagination } from '../common/utils/pagination.js';
import { decimalToNumber, getRequestCutoff } from '../common/utils/requestRules.js';

const { ParentRequestsStatus } = ENUMS;

// Chỉ sửa nội dung khi request chưa bước vào giai đoạn thương lượng / kết thúc
export const EDITABLE_STATUSES = Object.freeze([ParentRequestsStatus.DRAFT, ParentRequestsStatus.OPEN]);

const STUDENT_FIELDS = 'full_name email avatar_url';

const toStudentDto = (student) => {
  if (!student || typeof student !== 'object' || student.full_name === undefined) {
    return null;
  }
  return {
    _id: String(student._id),
    full_name: student.full_name,
    email: student.email,
    avatar_url: student.avatar_url || null,
  };
};

/**
 * Chuyển request sang dữ liệu trả về cho phụ huynh
 * @param {Object} request - ParentRequest (lean, student_id có thể đã populate)
 * @param {number} applicationCount - số đơn ứng tuyển (không tính đơn đã rút)
 * @param {Date} now
 * @returns {Object}
 */
export const toParentRequestDto = (request, applicationCount, now = new Date()) => {
  let studentId = null;
  if (request.student_id) {
    studentId = String(request.student_id._id || request.student_id);
  }

  const isOpen = request.status === ParentRequestsStatus.OPEN;
  const isExpired = isOpen && new Date(request.created_at).getTime() < getRequestCutoff(now).getTime();

  return {
    _id: String(request._id),
    title: request.title,
    subject_name: request.subject_name,
    grade_level: request.grade_level,
    teaching_mode: request.teaching_mode,
    budget: decimalToNumber(request.budget),
    schedule: request.schedule,
    description: request.description,
    location_address: request.location_address,
    tutor_requirements: request.tutor_requirements,
    status: request.status,
    student_id: studentId,
    student: toStudentDto(request.student_id),
    application_count: applicationCount,
    is_expired: isExpired,
    can_edit: EDITABLE_STATUSES.includes(request.status),
    created_at: request.created_at,
    updated_at: request.updated_at,
  };
};

/**
 * Đếm số đơn ứng tuyển (không tính đơn đã rút) theo từng request
 * @param {Array} requestIds
 * @returns {Promise<Map<string, number>>} request_id -> số đơn
 */
export const countApplications = async (requestIds) => {
  const counts = new Map();
  if (requestIds.length === 0) {
    return counts;
  }

  const rows = await ApplyRequest.aggregate([
    {
      $match: {
        request_id: { $in: requestIds.map((id) => new mongoose.Types.ObjectId(String(id))) },
        status: { $ne: ENUMS.ApplyRequestsStatus.WITHDRAWN },
      },
    },
    { $group: { _id: '$request_id', count: { $sum: 1 } } },
  ]);
  for (const row of rows) {
    counts.set(String(row._id), row.count);
  }
  return counts;
};

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Tutoring request not found', 404);
  }
};

const assertStudentBelongsToParent = async (parentId, studentId) => {
  if (!studentId) {
    return;
  }
  const link = await ParentChildLink.exists({
    parent_user_id: parentId,
    student_user_id: studentId,
    status: ENUMS.ParentChildLinksStatus.ACCEPTED,
  });
  if (!link) {
    throw new AppError('Selected student is not linked to your account', 422, {
      student_id: ['Selected student is not linked to your account'],
    });
  }
};

/**
 * Danh sách con đã liên kết (ACCEPTED) để chọn khi tạo request
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<Object[]>}
 */
export const listChildren = async (user) => {
  assertRole(user, ENUMS.UserRole.PARENT);

  const links = await ParentChildLink.find({
    parent_user_id: user.id,
    status: ENUMS.ParentChildLinksStatus.ACCEPTED,
  }).lean();
  const students = await User.find({ _id: { $in: links.map((link) => link.student_user_id) } })
    .select(STUDENT_FIELDS)
    .lean();
  return students.map((student) => toStudentDto(student));
};

/**
 * Request của chính phụ huynh, mới nhất trước, kèm số đơn ứng tuyển
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { status?, page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listMyRequests = async (user, { status, page, limit }) => {
  assertRole(user, ENUMS.UserRole.PARENT);

  const filter = { parent_user_id: user.id };
  if (status) {
    filter.status = status;
  }
  const [requests, total] = await Promise.all([
    ParentRequest.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student_id', STUDENT_FIELDS)
      .lean(),
    ParentRequest.countDocuments(filter),
  ]);

  const counts = await countApplications(requests.map((request) => request._id));
  const now = new Date();
  const items = requests.map((request) => toParentRequestDto(request, counts.get(String(request._id)) || 0, now));
  return { items: items, pagination: buildPagination(page, limit, total) };
};

/**
 * Chi tiết một request của chính phụ huynh
 * @param {Object} user - req.user { id, role }
 * @param {string} requestId
 * @returns {Promise<Object>}
 */
export const getMyRequest = async (user, requestId) => {
  assertRole(user, ENUMS.UserRole.PARENT);
  assertValidId(requestId);

  const request = await ParentRequest.findOne({ _id: requestId, parent_user_id: user.id })
    .populate('student_id', STUDENT_FIELDS)
    .lean();
  if (!request) {
    throw new AppError('Tutoring request not found', 404);
  }
  const counts = await countApplications([request._id]);
  return toParentRequestDto(request, counts.get(String(request._id)) || 0);
};

/**
 * Tạo và đăng request (Figma chỉ có nút Publish nên status = OPEN)
 * @param {Object} user - req.user { id, role }
 * @param {Object} data - body đã validate
 * @returns {Promise<Object>}
 */
export const createRequest = async (user, data) => {
  assertRole(user, ENUMS.UserRole.PARENT);
  await assertStudentBelongsToParent(user.id, data.student_id);

  const created = await ParentRequest.create({
    ...data,
    parent_user_id: user.id,
    status: ParentRequestsStatus.OPEN,
    image_urls: [],
  });
  return getMyRequest(user, String(created._id));
};

/**
 * Sửa nội dung request khi còn DRAFT hoặc OPEN. Không đổi được parent_user_id, status
 * @param {Object} user - req.user { id, role }
 * @param {string} requestId
 * @param {Object} data - body đã validate
 * @returns {Promise<Object>}
 */
export const updateRequest = async (user, requestId, data) => {
  assertRole(user, ENUMS.UserRole.PARENT);
  assertValidId(requestId);

  const request = await ParentRequest.findOne({ _id: requestId, parent_user_id: user.id });
  if (!request) {
    throw new AppError('Tutoring request not found', 404);
  }
  if (!EDITABLE_STATUSES.includes(request.status)) {
    throw new AppError(`This request can no longer be edited (status: ${request.status})`, 409);
  }
  await assertStudentBelongsToParent(user.id, data.student_id);

  request.set(data);
  await request.save();
  return getMyRequest(user, requestId);
};
