import mongoose from 'mongoose';
import { AiSuggestion } from '../models/AiSuggestion.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { TutorPost } from '../models/TutorPost.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { User } from '../models/User.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { decimalToNumber } from '../common/utils/requestRules.js';
import { matchesSubjectAndGrade } from './tutorMatching.service.js';

// UC09 – gợi ý gia sư chỉ dựa trên môn học và khối lớp của request, không chấm điểm / trọng số.
// Chưa gọi AI provider nào nên ai_reason luôn null (luồng E1)
const SUGGESTION_LIMIT = 10;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Chỉ tài khoản PARENT được xem gợi ý gia sư
 * TODO: chuyển sang authorize('PARENT') ở route khi middleware authorize được xây dựng
 * @param {Object} user - req.user { id, role }
 * @returns {void}
 */
export const assertParent = (user) => {
  if (user.role !== ENUMS.UserRole.PARENT) {
    throw new AppError('Only parent accounts can view tutor suggestions', 403);
  }
};

/**
 * Lấy request của chính parent và bắt buộc đang OPEN (PRE-2)
 * @param {Object} user - req.user { id, role }
 * @param {string} requestId
 * @returns {Promise<Object>} request (lean)
 */
const getOwnedOpenRequest = async (user, requestId) => {
  assertParent(user);
  if (!mongoose.isValidObjectId(requestId)) {
    throw new AppError('Tutoring request not found', 404);
  }

  const request = await ParentRequest.findOne({ _id: requestId, parent_user_id: user.id }).lean();
  if (!request) {
    throw new AppError('Tutoring request not found', 404);
  }
  if (request.status !== ENUMS.ParentRequestsStatus.OPEN) {
    throw new AppError('Tutor suggestions are only available for open requests', 409);
  }
  return request;
};

/**
 * Gắn thông tin bài đăng, hồ sơ và tên gia sư vào các bản ghi gợi ý để trả về cho client.
 * Bỏ qua bản ghi mà bài đăng không còn PUBLISHED hoặc tài khoản gia sư không còn ACTIVE.
 * @param {Object[]} rows - bản ghi AI_SUGGESTIONS (lean)
 * @returns {Promise<Object[]>} danh sách đã sắp xếp theo rating giảm dần
 */
const hydrateSuggestions = async (rows) => {
  const posts = await TutorPost.find({
    _id: { $in: rows.map((row) => row.tutor_post_id) },
    status: ENUMS.TutorPostsStatus.PUBLISHED,
  }).lean();
  const profiles = await TutorProfile.find({ _id: { $in: rows.map((row) => row.tutor_profile_id) } }).lean();
  const users = await User.find({
    _id: { $in: profiles.map((profile) => profile.user_id) },
    account_status: ENUMS.UserAccountStatus.ACTIVE,
  })
    .select('full_name avatar_url')
    .lean();

  const postById = new Map(posts.map((post) => [String(post._id), post]));
  const profileById = new Map(profiles.map((profile) => [String(profile._id), profile]));
  const userById = new Map(users.map((user) => [String(user._id), user]));

  const items = [];
  for (const row of rows) {
    const post = postById.get(String(row.tutor_post_id));
    const profile = profileById.get(String(row.tutor_profile_id));
    if (!post || !profile) {
      continue;
    }
    const tutorUser = userById.get(String(profile.user_id));
    if (!tutorUser) {
      continue;
    }

    items.push({
      _id: String(row._id),
      ai_reason: row.ai_reason,
      tutor: {
        profile_id: String(profile._id),
        full_name: tutorUser.full_name,
        avatar_url: profile.avatar_url || tutorUser.avatar_url || null,
        headline: profile.headline,
        average_rating: profile.average_rating,
        availability_status: profile.availability_status || null,
      },
      post: {
        _id: String(post._id),
        title: post.title,
        subject_name: post.subject_name,
        grade_level: post.grade_level,
        teaching_mode: post.teaching_mode,
        price: decimalToNumber(post.price),
        schedule: post.schedule,
      },
    });
  }

  items.sort((first, second) => {
    const secondRating = second.tutor.average_rating || 0;
    const firstRating = first.tutor.average_rating || 0;
    if (secondRating !== firstRating) {
      return secondRating - firstRating;
    }
    return first.tutor.full_name.localeCompare(second.tutor.full_name);
  });
  return items;
};

/**
 * Chọn gia sư có bài đăng PUBLISHED cùng môn học và khối lớp với request (mỗi gia sư 1 bài mới nhất), rating cao trước, lấy top 10
 * @param {Object} request - ParentRequest (lean)
 * @returns {Promise<Object[]>} danh sách { post, profile } đã sắp xếp
 */
const rankCandidates = async (request) => {
  const posts = await TutorPost.find({ status: ENUMS.TutorPostsStatus.PUBLISHED }).sort({ created_at: -1, _id: -1 }).lean();
  const matchedPosts = posts.filter((post) => matchesSubjectAndGrade(request, post));
  if (matchedPosts.length === 0) {
    return [];
  }

  // Gia sư đặt "Not available" vẫn được gợi ý (UI có nhãn) để khớp với phía gia sư, nơi họ vẫn nhận gợi ý request
  const profiles = await TutorProfile.find({ _id: { $in: matchedPosts.map((post) => post.profile_id) } }).lean();
  const activeUsers = await User.find({
    _id: { $in: profiles.map((profile) => profile.user_id) },
    account_status: ENUMS.UserAccountStatus.ACTIVE,
  })
    .select('_id')
    .lean();
  const activeUserIds = new Set(activeUsers.map((user) => String(user._id)));
  const profileById = new Map();
  for (const profile of profiles) {
    if (activeUserIds.has(String(profile.user_id))) {
      profileById.set(String(profile._id), profile);
    }
  }

  // Bài đăng đã sắp mới nhất trước nên bài đầu tiên gặp của mỗi gia sư là bài mới nhất
  const bestByProfile = new Map();
  for (const post of matchedPosts) {
    const key = String(post.profile_id);
    if (profileById.has(key) && !bestByProfile.has(key)) {
      bestByProfile.set(key, { post, profile: profileById.get(key) });
    }
  }

  const ranked = Array.from(bestByProfile.values());
  ranked.sort((first, second) => (second.profile.average_rating || 0) - (first.profile.average_rating || 0));
  return ranked.slice(0, SUGGESTION_LIMIT);
};

/**
 * Tính lại gợi ý và thay cache cũ của request bằng cache mới (24 giờ)
 * @param {Object} request - ParentRequest (lean)
 * @returns {Promise<Object[]>} bản ghi AI_SUGGESTIONS vừa lưu (lean)
 */
const regenerateSuggestions = async (request) => {
  const ranked = await rankCandidates(request);

  // Chỉ xóa cache gợi ý của đúng request này
  await AiSuggestion.deleteMany({ request_id: request._id });
  if (ranked.length === 0) {
    return [];
  }

  const cachedUntil = new Date(Date.now() + CACHE_TTL_MS);
  const created = await AiSuggestion.insertMany(
    ranked.map((entry) => {
      return {
        request_id: request._id,
        tutor_post_id: entry.post._id,
        tutor_profile_id: entry.profile._id,
        match_score: null,
        ai_reason: null,
        weights_json: null,
        cached_until: cachedUntil,
      };
    })
  );
  return created.map((document) => document.toObject());
};

const buildResponse = async (request, rows, page, limit) => {
  const items = await hydrateSuggestions(rows);
  const pageItems = items.slice((page - 1) * limit, page * limit);

  let cachedUntil = null;
  if (rows.length > 0) {
    cachedUntil = rows[0].cached_until;
  }

  // Chưa có AI provider nên không có lời giải thích: báo FALLBACK để UI hiển thị đúng (UC09 E1)
  let aiStatus = 'FALLBACK';
  if (items.some((item) => item.ai_reason)) {
    aiStatus = 'AI';
  }

  let hint = null;
  if (items.length === 0) {
    hint = 'No tutor teaches this subject and grade level yet. Check back when more tutors publish posts.';
  }

  return {
    request: {
      _id: String(request._id),
      title: request.title,
      subject_name: request.subject_name,
      grade_level: request.grade_level,
      teaching_mode: request.teaching_mode,
      budget: decimalToNumber(request.budget),
    },
    items: pageItems,
    pagination: { page: page, limit: limit, total: items.length, totalPages: Math.ceil(items.length / limit) },
    ai_status: aiStatus,
    cached_until: cachedUntil,
    hint: hint,
  };
};

/**
 * Xem gợi ý gia sư cho một request: dùng cache còn hạn, hết hạn / chưa có / không còn dùng được thì tính mới
 * @param {Object} user - req.user { id, role }
 * @param {string} requestId
 * @param {Object} query - { page, limit }
 * @returns {Promise<Object>} { request, items, pagination, ai_status, cached_until, hint }
 */
export const getSuggestions = async (user, requestId, { page, limit }) => {
  const request = await getOwnedOpenRequest(user, requestId);

  let rows = await AiSuggestion.find({ request_id: request._id, cached_until: { $gt: new Date() } }).lean();
  if (rows.length > 0) {
    // Cache còn hạn nhưng bài đăng / gia sư trong đó không còn dùng được (bài bị ẩn, tài khoản bị khóa...): tính lại thay vì hiện rỗng
    const usableItems = await hydrateSuggestions(rows);
    if (usableItems.length === 0) {
      rows = [];
    }
  }
  if (rows.length === 0) {
    rows = await regenerateSuggestions(request);
  }
  return buildResponse(request, rows, page, limit);
};

/**
 * Tính lại gợi ý ngay, bỏ qua cache
 * @param {Object} user - req.user { id, role }
 * @param {string} requestId
 * @returns {Promise<Object>} cùng dạng với getSuggestions (trang 1)
 */
export const refreshSuggestions = async (user, requestId) => {
  const request = await getOwnedOpenRequest(user, requestId);
  const rows = await regenerateSuggestions(request);
  return buildResponse(request, rows, 1, SUGGESTION_LIMIT);
};
