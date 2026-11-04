import mongoose from 'mongoose';
import { TutorPost } from '../models/TutorPost.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { buildPagination } from '../common/utils/pagination.js';
import { decimalToNumber } from '../common/utils/requestRules.js';
import { getTutorProfileOrThrow } from './tutorContext.service.js';

const { TutorPostsStatus } = ENUMS;

// Bài đăng đã bị gia sư xóa (xóa mềm) thì coi như không tồn tại
const VISIBLE_FILTER = { status: { $ne: TutorPostsStatus.DELETED } };
// Đang chờ quản trị viên kiểm duyệt thì gia sư không sửa / đổi trạng thái / xóa được
const LOCKED_STATUS = TutorPostsStatus.PENDING_MODERATION;

/**
 * Chuyển bài đăng sang dữ liệu trả về cho chính gia sư
 * @param {Object} post - TutorPost (lean hoặc document)
 * @returns {Object}
 */
export const toTutorPostDto = (post) => {
  const raw = typeof post.toObject === 'function' ? post.toObject() : post;
  return {
    _id: String(raw._id),
    title: raw.title,
    subject_name: raw.subject_name,
    grade_level: raw.grade_level,
    teaching_mode: raw.teaching_mode,
    price: decimalToNumber(raw.price),
    schedule: raw.schedule,
    description: raw.description,
    status: raw.status,
    is_locked: raw.status === LOCKED_STATUS,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
};

const getOwnedPost = async (profile, postId) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw new AppError('Post not found', 404);
  }
  const post = await TutorPost.findOne({ _id: postId, profile_id: profile._id, ...VISIBLE_FILTER });
  if (!post) {
    throw new AppError('Post not found', 404);
  }
  return post;
};

const assertNotLocked = (post) => {
  if (post.status === LOCKED_STATUS) {
    throw new AppError('This post is under moderation and cannot be changed', 409);
  }
};

/**
 * Bài đăng của chính gia sư (không gồm bài đã xóa), mới nhất trước
 * @param {Object} user - req.user { id, role }
 * @param {Object} query - { status?, page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listMyPosts = async (user, { status, page, limit }) => {
  const profile = await getTutorProfileOrThrow(user);

  if (status === TutorPostsStatus.DELETED) {
    return { items: [], pagination: buildPagination(page, limit, 0) };
  }
  const filter = { profile_id: profile._id, ...VISIBLE_FILTER };
  if (status) {
    filter.status = status;
  }
  const [posts, total] = await Promise.all([
    TutorPost.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    TutorPost.countDocuments(filter),
  ]);
  return { items: posts.map((post) => toTutorPostDto(post)), pagination: buildPagination(page, limit, total) };
};

/**
 * Chi tiết một bài đăng của chính gia sư
 * @param {Object} user - req.user { id, role }
 * @param {string} postId
 * @returns {Promise<Object>}
 */
export const getMyPost = async (user, postId) => {
  const profile = await getTutorProfileOrThrow(user);
  const post = await getOwnedPost(profile, postId);
  return toTutorPostDto(post);
};

/**
 * Tạo bài đăng (cần có hồ sơ gia sư). Lưu nháp hoặc đăng ngay tùy `status`
 * @param {Object} user - req.user { id, role }
 * @param {Object} data - body đã validate
 * @returns {Promise<Object>}
 */
export const createPost = async (user, data) => {
  const profile = await getTutorProfileOrThrow(user);
  const post = await TutorPost.create({ ...data, profile_id: profile._id, image_urls: [] });
  return toTutorPostDto(post);
};

/**
 * Sửa nội dung bài đăng (không đổi trạng thái). Bài đang chờ kiểm duyệt thì không sửa được
 * @param {Object} user - req.user { id, role }
 * @param {string} postId
 * @param {Object} data - body đã validate
 * @returns {Promise<Object>}
 */
export const updatePost = async (user, postId, data) => {
  const profile = await getTutorProfileOrThrow(user);
  const post = await getOwnedPost(profile, postId);
  assertNotLocked(post);

  post.set(data);
  await post.save();
  return toTutorPostDto(post);
};

/**
 * Đổi trạng thái bài đăng giữa DRAFT, PUBLISHED, HIDDEN
 * @param {Object} user - req.user { id, role }
 * @param {string} postId
 * @param {string} status - trạng thái mới
 * @returns {Promise<Object>}
 */
export const changePostStatus = async (user, postId, status) => {
  const profile = await getTutorProfileOrThrow(user);
  const post = await getOwnedPost(profile, postId);
  assertNotLocked(post);

  post.status = status;
  await post.save();
  return toTutorPostDto(post);
};

/**
 * Xóa bài đăng (xóa mềm: status = DELETED, dữ liệu vẫn giữ trong DB)
 * @param {Object} user - req.user { id, role }
 * @param {string} postId
 * @returns {Promise<{ deleted: boolean }>}
 */
export const deletePost = async (user, postId) => {
  const profile = await getTutorProfileOrThrow(user);
  const post = await getOwnedPost(profile, postId);
  assertNotLocked(post);

  post.status = TutorPostsStatus.DELETED;
  await post.save();
  return { deleted: true };
};
