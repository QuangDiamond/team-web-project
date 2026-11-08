import mongoose from 'mongoose';
import { ParentRequest } from '../models/ParentRequest.js';
import { BookmarkedRequest } from '../models/BookmarkedRequest.js';
import { ApplyRequest } from '../models/ApplyRequest.js';
import { AiPostSuggestion } from '../models/AiPostSuggestion.js';
import { TutorPost } from '../models/TutorPost.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { buildPagination } from '../common/utils/pagination.js';
import { decimalToNumber, escapeRegex, getRequestCutoff, isRequestAvailable } from '../common/utils/requestRules.js';
import { countApplications } from './parentRequest.service.js';
import { getTutorProfileOrThrow } from './tutorContext.service.js';
import { isGradeMatch, isModeCompatible, isSubjectMatch, scoreCandidate } from './tutorMatching.service.js';

// UC11 – chỉ xếp hạng bằng luật, chưa gọi AI provider (ai_reason luôn null, giống UC09)
const SUGGESTION_LIMIT = 10;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// Rating là của chính gia sư nên không dùng để chọn request; chỉ xét giá, lịch, khu vực
const SUGGESTION_WEIGHTS = Object.freeze({ budget: 40, rating: 0, schedule: 30, area: 30 });

const { ParentRequestsStatus } = ENUMS;

/**
 * Chuyển request sang dữ liệu công khai cho gia sư: KHÔNG có thông tin phụ huynh / học sinh
 * @param {Object} request - ParentRequest (lean)
 * @param {Object} extra - { applicationCount, isBookmarked, hasApplied, matchScore? }
 * @returns {Object}
 */
export const toTutorRequestDto = (request, { applicationCount, isBookmarked, hasApplied, matchScore = null }) => {
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
    match_score: matchScore,
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
    filter.subject_name = new RegExp(escapeRegex(query.subject), 'i');
  }
  if (query.grade) {
    filter.grade_level = new RegExp(escapeRegex(query.grade), 'i');
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
 * Điểm phù hợp tốt nhất giữa một request và các bài đăng của gia sư; null nếu không bài nào qua ràng buộc cứng
 * @param {Object} request - ParentRequest (lean)
 * @param {Object[]} posts - TutorPost PUBLISHED của gia sư (lean)
 * @param {string|null} tutorAddress - địa chỉ trong hồ sơ gia sư
 * @returns {number|null}
 */
export const scoreRequestForTutor = (request, posts, tutorAddress) => {
  const requestForScoring = {
    teaching_mode: request.teaching_mode,
    budget: decimalToNumber(request.budget),
    schedule: request.schedule,
    location_address: request.location_address,
  };

  let bestScore = null;
  for (const post of posts) {
    const passesHardConstraints =
      isSubjectMatch(request.subject_name, post.subject_name) &&
      isGradeMatch(request.grade_level, post.grade_level) &&
      isModeCompatible(request.teaching_mode, post.teaching_mode);
    if (!passesHardConstraints) {
      continue;
    }
    const scored = scoreCandidate(
      requestForScoring,
      { price: decimalToNumber(post.price), schedule: post.schedule, address: tutorAddress, average_rating: null },
      SUGGESTION_WEIGHTS
    );
    if (bestScore === null || scored.match_score > bestScore) {
      bestScore = scored.match_score;
    }
  }
  return bestScore;
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
 * @param {Map<string, number>} [scoreByRequest]
 * @returns {Promise<Object[]>}
 */
const decorateRequests = async (requests, profile, scoreByRequest = new Map()) => {
  const requestIds = requests.map((request) => request._id);
  const counts = await countApplications(requestIds);
  const bookmarks = await BookmarkedRequest.find({ tutor_profile_id: profile._id, request_id: { $in: requestIds } })
    .select('request_id')
    .lean();
  const applications = await ApplyRequest.find({ tutor_profile_id: profile._id, request_id: { $in: requestIds } })
    .select('request_id')
    .lean();

  const bookmarkedIds = new Set(bookmarks.map((bookmark) => String(bookmark.request_id)));
  const appliedIds = new Set(applications.map((application) => String(application.request_id)));

  return requests.map((request) => {
    const key = String(request._id);
    let matchScore = null;
    if (scoreByRequest.has(key)) {
      matchScore = scoreByRequest.get(key);
    }
    return toTutorRequestDto(request, {
      applicationCount: counts.get(key) || 0,
      isBookmarked: bookmarkedIds.has(key),
      hasApplied: appliedIds.has(key),
      matchScore: matchScore,
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
 * Tính lại "Suggested for you" và thay cache cũ của gia sư này (24 giờ)
 * @param {Object} profile - TutorProfile (lean)
 * @returns {Promise<{ rows: Object[], hint: string|null }>} rows: bản ghi AI_POST_SUGGESTIONS vừa lưu
 */
const regenerateSuggestions = async (profile) => {
  const posts = await TutorPost.find({ profile_id: profile._id, status: ENUMS.TutorPostsStatus.PUBLISHED }).lean();
  // Chỉ xóa cache gợi ý của đúng gia sư này
  await AiPostSuggestion.deleteMany({ tutor_profile_id: profile._id });

  if (posts.length === 0) {
    return { rows: [], hint: 'Publish a tutoring post to get suggestions that fit your profile.' };
  }

  const appliedRequestIds = await ApplyRequest.distinct('request_id', { tutor_profile_id: profile._id });
  const requests = await ParentRequest.find({
    status: ParentRequestsStatus.OPEN,
    created_at: { $gte: getRequestCutoff() },
    _id: { $nin: appliedRequestIds },
  }).lean();

  const ranked = [];
  for (const request of requests) {
    const score = scoreRequestForTutor(request, posts, profile.address);
    if (score !== null) {
      ranked.push({ request_id: request._id, match_score: score });
    }
  }
  ranked.sort((first, second) => second.match_score - first.match_score);
  const top = ranked.slice(0, SUGGESTION_LIMIT);

  if (top.length === 0) {
    return { rows: [], hint: 'No open request fits your published posts yet. Check back later.' };
  }

  const cachedUntil = new Date(Date.now() + CACHE_TTL_MS);
  const created = await AiPostSuggestion.insertMany(
    top.map((entry) => ({
      tutor_profile_id: profile._id,
      request_id: entry.request_id,
      match_score: entry.match_score,
      ai_reason: null,
      cached_until: cachedUntil,
    }))
  );
  return { rows: created.map((document) => document.toObject()), hint: null };
};

/**
 * Gắn thông tin request vào các dòng gợi ý; bỏ request đã đóng / hết hạn / đã ứng tuyển
 * @param {Object[]} rows - AI_POST_SUGGESTIONS (lean)
 * @param {Object} profile
 * @returns {Promise<Object[]>} sắp xếp theo điểm giảm dần
 */
const hydrateSuggestions = async (rows, profile) => {
  const requests = await ParentRequest.find({ _id: { $in: rows.map((row) => row.request_id) } }).lean();
  const appliedRequestIds = await ApplyRequest.distinct('request_id', {
    tutor_profile_id: profile._id,
    request_id: { $in: rows.map((row) => row.request_id) },
  });
  const appliedSet = new Set(appliedRequestIds.map((id) => String(id)));

  const usableRequests = requests.filter((request) => isRequestAvailable(request) && !appliedSet.has(String(request._id)));
  const scoreByRequest = new Map(rows.map((row) => [String(row.request_id), row.match_score]));
  const items = await decorateRequests(usableRequests, profile, scoreByRequest);
  items.sort((first, second) => second.match_score - first.match_score);
  return items;
};

const buildSuggestionResponse = (items, rows, hint, page, limit) => {
  let cachedUntil = null;
  if (rows.length > 0) {
    cachedUntil = rows[0].cached_until;
  }
  return {
    items: items.slice((page - 1) * limit, page * limit),
    pagination: buildPagination(page, limit, items.length),
    // Chưa có AI provider nên không có lời giải thích (giống UC09 E1)
    ai_status: 'FALLBACK',
    cached_until: cachedUntil,
    hint: hint,
  };
};

/**
 * "Suggested for you": dùng cache còn hạn, hết hạn / rỗng thì tính lại
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { page, limit }
 * @returns {Promise<Object>} { items, pagination, ai_status, cached_until, hint }
 */
export const getSuggestions = async (user, { page, limit }) => {
  const profile = await getTutorProfileOrThrow(user);

  let rows = await AiPostSuggestion.find({ tutor_profile_id: profile._id, cached_until: { $gt: new Date() } }).lean();
  let items = [];
  if (rows.length > 0) {
    items = await hydrateSuggestions(rows, profile);
  }

  let hint = null;
  if (items.length === 0) {
    const regenerated = await regenerateSuggestions(profile);
    rows = regenerated.rows;
    hint = regenerated.hint;
    if (rows.length > 0) {
      items = await hydrateSuggestions(rows, profile);
    }
  }
  return buildSuggestionResponse(items, rows, hint, page, limit);
};

/**
 * Bỏ cache và tính lại "Suggested for you"
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<Object>} cùng dạng getSuggestions (trang 1)
 */
export const refreshSuggestions = async (user) => {
  const profile = await getTutorProfileOrThrow(user);
  const regenerated = await regenerateSuggestions(profile);

  let items = [];
  if (regenerated.rows.length > 0) {
    items = await hydrateSuggestions(regenerated.rows, profile);
  }
  return buildSuggestionResponse(items, regenerated.rows, regenerated.hint, 1, SUGGESTION_LIMIT);
};
