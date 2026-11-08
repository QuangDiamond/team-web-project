import mongoose from 'mongoose';
import { ParentRequest } from '../models/ParentRequest.js';
import { BookmarkedRequest } from '../models/BookmarkedRequest.js';
import { ApplyRequest } from '../models/ApplyRequest.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { buildPagination } from '../common/utils/pagination.js';
import { decimalToNumber, escapeRegex, getRequestCutoff, isRequestAvailable } from '../common/utils/requestRules.js';
import { countApplications } from './parentRequest.service.js';
import { getTutorProfileOrThrow } from './tutorContext.service.js';
import { matchesSubjectAndGrade, matchTeachingCategories } from './tutorMatching.service.js';
import { loadActiveTeachingCatalog } from './category.service.js';


const { ParentRequestsStatus } = ENUMS;

/**
 * Chuyển request sang dữ liệu công khai cho gia sư: KHÔNG có thông tin phụ huynh / học sinh
 * @param {Object} request - ParentRequest (lean)
 * @param {Object} extra - { applicationCount, isBookmarked, hasApplied }
 * @returns {Object}
 */
export const toTutorRequestDto = (request, { applicationCount, isBookmarked, hasApplied }) => {
  return {
    _id: String(request._id),
    parent_user_id: request.parent_user_id ? String(request.parent_user_id) : null,
    available: true,
    title: request.title,
    subject_name: request.subject_name,
    grade_level: request.grade_level,
    teaching_mode: request.teaching_mode,
    budget: decimalToNumber(request.budget),
    schedule: request.schedule,
    description: request.description,
    location_address: request.location_address,
    tutor_requirements: request.tutor_requirements,
    image_urls: request.image_urls || [],
    application_count: applicationCount,
    is_bookmarked: isBookmarked,
    has_applied: hasApplied,
    created_at: request.created_at,
  };
};

/**
 * Điều kiện Mongo cho danh sách duyệt request: chỉ OPEN, chưa quá 30 ngày, cộng các bộ lọc
 * @param {Object} query - { q, subject, grade, area, mode, minBudget, maxBudget }
 * @param {Date} [now]
 * @returns {Object}
 */
export const buildBrowseFilter = (query, now = new Date()) => {
  const filter = {
    status: ParentRequestsStatus.OPEN,
    created_at: { $gte: getRequestCutoff(now) },
  };

  if (query.q) {
    const keyword = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ title: keyword }, { subject_name: keyword }, { description: keyword }];
  }
  if (query.subject) {
    filter.subject_name = new RegExp(`^${escapeRegex(query.subject)}$`, 'i');
  }
  if (query.grade) {
    filter.grade_level = new RegExp(`^${escapeRegex(query.grade)}$`, 'i');
  }
  if (query.area) {
    filter.location_address = new RegExp(escapeRegex(query.area), 'i');
  }
  if (query.mode) {
    filter.teaching_mode = query.mode;
  }

  const budgetRange = {};
  if (query.minBudget !== undefined) {
    budgetRange.$gte = query.minBudget;
  }
  if (query.maxBudget !== undefined) {
    budgetRange.$lte = query.maxBudget;
  }
  if (Object.keys(budgetRange).length > 0) {
    filter.budget = budgetRange;
  }
  return filter;
};

/**
 * Request phù hợp với gia sư khi có ít nhất một bài đăng PUBLISHED cùng môn học và khối lớp
 * @param {Object} request - ParentRequest (lean)
 * @param {Object[]} posts - TutorPost PUBLISHED của gia sư (lean)
 * @returns {boolean}
 */
export const matchesAnyPost = (request, posts) => {
  return posts.some((post) => matchesSubjectAndGrade(request, post));
};

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Tutoring request not found', 404);
  }
};

/**
 * Gắn số đơn, trạng thái đã lưu / đã ứng tuyển vào danh sách request
 * @param {Object[]} requests - ParentRequest (lean)
 * @param {Object} profile - TutorProfile của gia sư
 * @returns {Promise<Object[]>}
 */
const decorateRequests = async (requests, profile) => {
  const requestIds = requests.map((request) => request._id);
  const counts = await countApplications(requestIds);
  const bookmarks = await BookmarkedRequest.find({ tutor_profile_id: profile._id, request_id: { $in: requestIds } })
    .select('request_id')
    .lean();
  const applications = await ApplyRequest.find({
    tutor_profile_id: profile._id,
    request_id: { $in: requestIds },
    status: { $ne: ENUMS.ApplyRequestsStatus.WITHDRAWN },
  })
    .select('request_id')
    .lean();

  const bookmarkedIds = new Set(bookmarks.map((bookmark) => String(bookmark.request_id)));
  const appliedIds = new Set(applications.map((application) => String(application.request_id)));

  return requests.map((request) => {
    const key = String(request._id);
    return toTutorRequestDto(request, {
      applicationCount: counts.get(key) || 0,
      isBookmarked: bookmarkedIds.has(key),
      hasApplied: appliedIds.has(key),
    });
  });
};

/**
 * Duyệt request đang mở với bộ lọc và phân trang, mới nhất trước
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { q, subject, grade, area, mode, minBudget, maxBudget, page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const browseRequests = async (user, query) => {
  const profile = await getTutorProfileOrThrow(user);
  const filter = buildBrowseFilter(query);

  const [requests, total] = await Promise.all([
    ParentRequest.find(filter)
      .sort({ created_at: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    ParentRequest.countDocuments(filter),
  ]);

  const items = await decorateRequests(requests, profile);
  return { items: items, pagination: buildPagination(query.page, query.limit, total) };
};

/**
 * Giá trị có sẵn để đổ vào dropdown lọc (môn, khối) từ các request đang mở
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<{ subjects: string[], grades: string[] }>}
 */
export const getFilterOptions = async (user) => {
  await getTutorProfileOrThrow(user);

  const openFilter = buildBrowseFilter({});
  const [subjects, grades] = await Promise.all([
    ParentRequest.distinct('subject_name', openFilter),
    ParentRequest.distinct('grade_level', openFilter),
  ]);
  const clean = (values) => values.filter((value) => value).sort((first, second) => first.localeCompare(second, 'vi'));
  return { subjects: clean(subjects), grades: clean(grades) };
};

/**
 * Chi tiết một request đang mở
 * @param {Object} user - req.user { id, role }
 * @param {string} requestId
 * @returns {Promise<Object>}
 */
export const getRequestDetail = async (user, requestId) => {
  const profile = await getTutorProfileOrThrow(user);
  assertValidId(requestId);

  const request = await ParentRequest.findById(requestId).lean();
  if (!request || !isRequestAvailable(request)) {
    throw new AppError('Tutoring request not found', 404);
  }
  const [item] = await decorateRequests([request], profile);
  return item;
};

/**
 * Lưu request để xem sau. Gọi lại nhiều lần vẫn chỉ có một bookmark
 * @param {Object} user - req.user { id, role }
 * @param {string} requestId
 * @returns {Promise<{ is_bookmarked: boolean }>}
 */
export const addBookmark = async (user, requestId) => {
  const profile = await getTutorProfileOrThrow(user);
  assertValidId(requestId);

  const request = await ParentRequest.findById(requestId).select('status created_at').lean();
  if (!request || !isRequestAvailable(request)) {
    throw new AppError('Tutoring request not found', 404);
  }

  try {
    await BookmarkedRequest.findOneAndUpdate(
      { tutor_profile_id: profile._id, request_id: request._id },
      { $setOnInsert: { tutor_profile_id: profile._id, request_id: request._id } },
      { upsert: true }
    );
  } catch (error) {
    // Hai lần bấm gần như đồng thời: bản ghi đã có thì coi là thành công
    if (error.code !== 11000) {
      throw error;
    }
  }
  return { is_bookmarked: true };
};

/**
 * Bỏ lưu request (chỉ xóa đúng bookmark của gia sư này)
 * @param {Object} user - req.user { id, role }
 * @param {string} requestId
 * @returns {Promise<{ is_bookmarked: boolean }>}
 */
export const removeBookmark = async (user, requestId) => {
  const profile = await getTutorProfileOrThrow(user);
  assertValidId(requestId);

  await BookmarkedRequest.deleteOne({ tutor_profile_id: profile._id, request_id: requestId });
  return { is_bookmarked: false };
};

/**
 * Danh sách request đã lưu. Request đã đóng / hết hạn vẫn hiện nhưng đánh dấu available = false
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listBookmarks = async (user, { page, limit }) => {
  const profile = await getTutorProfileOrThrow(user);

  const filter = { tutor_profile_id: profile._id };
  const [bookmarks, total] = await Promise.all([
    BookmarkedRequest.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    BookmarkedRequest.countDocuments(filter),
  ]);

  const requests = await ParentRequest.find({ _id: { $in: bookmarks.map((bookmark) => bookmark.request_id) } }).lean();
  const requestById = new Map(requests.map((request) => [String(request._id), request]));
  const availableRequests = requests.filter((request) => isRequestAvailable(request));
  const decorated = await decorateRequests(availableRequests, profile);
  const decoratedById = new Map(decorated.map((item) => [item._id, item]));

  const items = bookmarks.map((bookmark) => {
    const key = String(bookmark.request_id);
    if (decoratedById.has(key)) {
      return { ...decoratedById.get(key), saved_at: bookmark.created_at };
    }
    const request = requestById.get(key);
    return {
      _id: key,
      available: false,
      title: request ? request.title : null,
      subject_name: request ? request.subject_name : null,
      saved_at: bookmark.created_at,
    };
  });
  return { items: items, pagination: buildPagination(page, limit, total) };
};

/**
 * Suggest current requests using the tutor's active teaching-category selections.
 * @param {Object} user - Authenticated Tutor account.
 * @param {Object} query - Page and limit.
 * @returns {Promise<Object>} Decorated matching requests, pagination and optional profile hint.
 */
export const getSuggestions = async (user, { page, limit }) => {
  const profile = await getTutorProfileOrThrow(user);
  const selections = profile.teaching_categories || [];
  const profileHint = 'Chọn môn học và cấp học / trình độ giảng dạy trong hồ sơ để nhận gợi ý.';
  const empty = { items: [], pagination: buildPagination(page, limit, 0), hint: profileHint };
  if (profile.is_complete !== true || !selections.some((item) => item.type === 'subjects') ||
      !selections.some((item) => item.type === 'grades')) return empty;

  const { catalog } = await loadActiveTeachingCatalog();
  const activeSelections = selections.filter((item) => catalog.has(item.type + ':' + item.category_id));
  if (!activeSelections.some((item) => item.type === 'subjects') ||
      !activeSelections.some((item) => item.type === 'grades')) return empty;

  const appliedRequestIds = await ApplyRequest.distinct('request_id', {
    tutor_profile_id: profile._id,
    status: { $ne: ENUMS.ApplyRequestsStatus.WITHDRAWN },
  });
  const requests = await ParentRequest.find({
    ...buildBrowseFilter({}),
    _id: { $nin: appliedRequestIds },
  }).sort({ created_at: -1, _id: -1 }).lean();
  const matches = requests.filter((request) =>
    isRequestAvailable(request) && matchTeachingCategories(request, activeSelections, catalog).length === 2);
  matches.sort((first, second) => {
    const dateOrder = new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
    if (dateOrder !== 0) return dateOrder;
    return String(second._id).localeCompare(String(first._id));
  });
  const items = await decorateRequests(matches.slice((page - 1) * limit, page * limit), profile);
  return {
    items,
    pagination: buildPagination(page, limit, matches.length),
    hint: matches.length === 0 ? 'Chưa có yêu cầu đang mở phù hợp với môn học và trình độ trong hồ sơ của bạn.' : null,
  };
};

/**
 * Reload profile-based suggestions without reading or writing any AI cache.
 * @param {Object} user - Authenticated Tutor account.
 * @returns {Promise<Object>} First page of current matching requests.
 */
export const refreshSuggestions = (user) => getSuggestions(user, { page: 1, limit: 10 });
