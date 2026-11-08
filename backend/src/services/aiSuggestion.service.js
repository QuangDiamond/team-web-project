import mongoose from 'mongoose';
import { AiSuggestion } from '../models/AiSuggestion.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { TutorPost } from '../models/TutorPost.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { User } from '../models/User.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import {
  DEFAULT_WEIGHTS,
  isGradeMatch,
  isModeCompatible,
  isSubjectMatch,
  scoreCandidate,
} from './tutorMatching.service.js';

// UC09 – chỉ dùng luật để xếp hạng. Chưa gọi AI provider nào nên ai_reason luôn null (luồng E1)
const SUGGESTION_LIMIT = 10;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const decimalToNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value.toString());
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return null;
};

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
 * @returns {Promise<Object[]>} danh sách đã sắp xếp theo điểm giảm dần
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

    let breakdown = null;
    if (row.weights_json && row.weights_json.breakdown) {
      breakdown = row.weights_json.breakdown;
    }
    items.push({
      _id: String(row._id),
      match_score: row.match_score,
      ai_reason: row.ai_reason,
      breakdown: breakdown,
      tutor: {
        profile_id: String(profile._id),
        full_name: tutorUser.full_name,
        avatar_url: profile.avatar_url || tutorUser.avatar_url || null,
        headline: profile.headline,
        average_rating: profile.average_rating,
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

  items.sort((first, second) => second.match_score - first.match_score);
  return items;
};

/**
 * Bước 2-3 của UC09: lọc ràng buộc cứng (môn, khối, hình thức), chấm điểm, lấy top 10 (mỗi gia sư 1 bài tốt nhất)
 * @param {Object} request - ParentRequest (lean)
 * @param {Object} weights - trọng số 0..100 đã gộp với mặc định
 * @returns {Promise<Object[]>} danh sách { post, profile, match_score, breakdown } đã sắp xếp
 */
const rankCandidates = async (request, weights) => {
  const posts = await TutorPost.find({ status: ENUMS.TutorPostsStatus.PUBLISHED }).lean();
  const matchedPosts = posts.filter((post) => {
    return (
      isSubjectMatch(request.subject_name, post.subject_name) &&
      isGradeMatch(request.grade_level, post.grade_level) &&
      isModeCompatible(request.teaching_mode, post.teaching_mode)
    );
  });
  if (matchedPosts.length === 0) {
    return [];
  }

  const profiles = await TutorProfile.find({
    _id: { $in: matchedPosts.map((post) => post.profile_id) },
    availability_status: { $ne: ENUMS.TutorProfilesAvailabilityStatus.NOT_AVAILABLE },
  }).lean();
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

  const requestForScoring = {
    teaching_mode: request.teaching_mode,
    budget: decimalToNumber(request.budget),
    schedule: request.schedule,
    location_address: request.location_address,
  };

  // Mỗi gia sư chỉ giữ bài đăng có điểm cao nhất
  const bestByProfile = new Map();
  for (const post of matchedPosts) {
    const profile = profileById.get(String(post.profile_id));
    if (!profile) {
      continue;
    }
    const scored = scoreCandidate(
      requestForScoring,
      {
        price: decimalToNumber(post.price),
        schedule: post.schedule,
        address: profile.address,
        average_rating: profile.average_rating,
      },
      weights
    );
    const current = bestByProfile.get(String(profile._id));
    if (!current || scored.match_score > current.match_score) {
      bestByProfile.set(String(profile._id), { post, profile, ...scored });
    }
  }

  const ranked = Array.from(bestByProfile.values());
  ranked.sort((first, second) => {
    if (second.match_score !== first.match_score) {
      return second.match_score - first.match_score;
    }
    return (second.profile.average_rating || 0) - (first.profile.average_rating || 0);
  });
  return ranked.slice(0, SUGGESTION_LIMIT);
};

/**
 * Tính lại gợi ý và thay cache cũ của request bằng cache mới (24 giờ)
 * @param {Object} request - ParentRequest (lean)
 * @param {Object} weights - trọng số 0..100
 * @returns {Promise<Object[]>} bản ghi AI_SUGGESTIONS vừa lưu (lean)
 */
const regenerateSuggestions = async (request, weights) => {
  const ranked = await rankCandidates(request, weights);

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
        match_score: entry.match_score,
        ai_reason: null,
        weights_json: { weights: weights, breakdown: entry.breakdown },
        cached_until: cachedUntil,
      };
    })
  );
  return created.map((document) => document.toObject());
};

const buildResponse = async (request, rows, page, limit) => {
  const items = await hydrateSuggestions(rows);
  const pageItems = items.slice((page - 1) * limit, page * limit);

  let weights = { ...DEFAULT_WEIGHTS };
  let cachedUntil = null;
  if (rows.length > 0) {
    cachedUntil = rows[0].cached_until;
    if (rows[0].weights_json && rows[0].weights_json.weights) {
      weights = rows[0].weights_json.weights;
    }
  }

  // Chưa có AI provider nên không có lời giải thích: báo FALLBACK để UI hiển thị đúng (UC09 E1)
  let aiStatus = 'FALLBACK';
  if (items.some((item) => item.ai_reason)) {
    aiStatus = 'AI';
  }

  let hint = null;
  if (items.length === 0) {
    hint = 'No matching tutor yet. Try widening the subject, grade, mode or budget of your request.';
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
    weights: weights,
    cached_until: cachedUntil,
    hint: hint,
  };
};

/**
 * Xem gợi ý gia sư cho một request: dùng cache còn hạn, hết hạn / chưa có thì tính mới
 * @param {Object} user - req.user { id, role }
 * @param {string} requestId
 * @param {Object} query - { page, limit }
 * @returns {Promise<Object>} { request, items, pagination, ai_status, weights, cached_until, hint }
 */
export const getSuggestions = async (user, requestId, { page, limit }) => {
  const request = await getOwnedOpenRequest(user, requestId);

  let rows = await AiSuggestion.find({ request_id: request._id, cached_until: { $gt: new Date() } }).lean();
  if (rows.length === 0) {
    rows = await regenerateSuggestions(request, { ...DEFAULT_WEIGHTS });
  }
  return buildResponse(request, rows, page, limit);
};

/**
 * Tính lại gợi ý với trọng số mới (UC09 A1 Refine), bỏ qua cache
 * @param {Object} user - req.user { id, role }
 * @param {string} requestId
 * @param {Object} [weights] - { budget, rating, schedule, area } mỗi giá trị 0..100; thiếu thì dùng mặc định
 * @returns {Promise<Object>} cùng dạng với getSuggestions (trang 1)
 */
export const refreshSuggestions = async (user, requestId, weights) => {
  const request = await getOwnedOpenRequest(user, requestId);
  const rows = await regenerateSuggestions(request, { ...DEFAULT_WEIGHTS, ...weights });
  return buildResponse(request, rows, 1, SUGGESTION_LIMIT);
};
