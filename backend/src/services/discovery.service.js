import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { TutorPost } from '../models/TutorPost.js';
import { Review } from '../models/Review.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { AppError } from '../common/utils/AppError.js';
import { getPagination, buildPagination } from '../common/utils/pagination.js';
import { decimalToNumber, escapeRegex, getRequestCutoff } from '../common/utils/requestRules.js';
import { maskContact } from '../common/utils/contactMask.js';

const UNAVAILABLE = 'This profile is not available';
const POST_FIELDS = '_id title subject_name grade_level teaching_mode price schedule description';
const REVIEW_FIELDS = '_id rating comment tutor_reply created_at';
const REQUEST_FIELDS = '_id title subject_name grade_level teaching_mode budget schedule description location_address';

/**
 * Load an active account of the requested public profile type.
 * @param {string|Object} userId - User ObjectId
 * @param {string} role - Expected account role
 * @returns {Promise<Object>} Basic user data for the public DTO
 */
const getActiveUser = async (userId, role) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError(UNAVAILABLE, 404);
  }
  const user = await User.findById(userId).select('_id full_name avatar_url role account_status').lean();
  if (!user || user.account_status !== 'ACTIVE' || user.role !== role) {
    throw new AppError(UNAVAILABLE, 404);
  }
  return user;
};

/**
 * Read a complete tutor profile with paginated public posts and approved reviews.
 * @param {string} profileId - TutorProfile ObjectId
 * @param {Object} query - { page?, limit? }, shared by both lists
 * @returns {Promise<{profile: Object, posts: Object, reviews: Object}>}
 */
export const getTutorPublicProfile = async (profileId, query = {}) => {
  if (!mongoose.isValidObjectId(profileId)) {
    throw new AppError(UNAVAILABLE, 404);
  }
  const profile = await TutorProfile.findById(profileId)
    .select('_id user_id avatar_url cover_url headline bio address is_address_hidden is_complete availability_status average_rating experiences educations achievements teaching_categories')
    .lean();
  if (!profile || profile.is_complete !== true) {
    throw new AppError(UNAVAILABLE, 404);
  }
  const user = await getActiveUser(profile.user_id, 'TUTOR');
  const { page, limit, skip } = getPagination(query);
  const postFilter = { profile_id: profile._id, status: 'PUBLISHED' };
  const reviewFilter = { tutor_profile_id: profile._id, status: 'APPROVED' };
  const [posts, postTotal, reviews, reviewTotal] = await Promise.all([
    TutorPost.find(postFilter).select(POST_FIELDS).sort({ created_at: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    TutorPost.countDocuments(postFilter),
    Review.find(reviewFilter).select(REVIEW_FIELDS).sort({ created_at: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments(reviewFilter),
  ]);

  return {
    profile: {
      _id: String(profile._id),
      user_id: String(profile.user_id),
      full_name: maskContact(user.full_name),
      avatar_url: user.avatar_url || profile.avatar_url || null,
      teaching_categories: (profile.teaching_categories || []).map((item) => ({ type: item.type, category_id: String(item.category_id), name: maskContact(item.name) })),
      cover_url: profile.cover_url ?? null,
      headline: maskContact(profile.headline),
      bio: maskContact(profile.bio),
      address: profile.is_address_hidden ? null : maskContact(profile.address),
      availability_status: profile.availability_status ?? null,
      average_rating: profile.average_rating ?? null,
      experiences: (profile.experiences || []).map((item) => ({
        title: maskContact(item.title),
        company: maskContact(item.company),
        start_date: item.start_date ?? null,
        end_date: item.end_date ?? null,
      })),
      educations: (profile.educations || []).map((item) => ({
        school: maskContact(item.school),
        degree: maskContact(item.degree),
        graduation_year: item.graduation_year ?? null,
        description: maskContact(item.description),
      })),
      achievements: (profile.achievements || []).map((item) => ({
        title: maskContact(item.title),
        description: maskContact(item.description),
      })),
    },
    posts: {
      items: posts.map((post) => ({
        _id: String(post._id),
        title: maskContact(post.title),
        subject_name: maskContact(post.subject_name),
        grade_level: maskContact(post.grade_level),
        teaching_mode: post.teaching_mode,
        price: decimalToNumber(post.price),
        schedule: maskContact(post.schedule),
        description: maskContact(post.description),
      })),
      pagination: buildPagination(page, limit, postTotal),
    },
    reviews: {
      items: reviews.map((review) => ({
        _id: String(review._id),
        rating: review.rating,
        comment: maskContact(review.comment),
        tutor_reply: maskContact(review.tutor_reply),
        created_at: review.created_at,
      })),
      pagination: buildPagination(page, limit, reviewTotal),
    },
  };
};

/**
 * Read basic parent information and unexpired OPEN requests without child data.
 * @param {string} userId - Parent User ObjectId
 * @param {Object} query - { page?, limit? }
 * @returns {Promise<{profile: Object, requests: Object}>}
 */
export const getParentPublicProfile = async (userId, query = {}) => {
  const user = await getActiveUser(userId, 'PARENT');
  const { page, limit, skip } = getPagination(query);
  const filter = {
    parent_user_id: user._id,
    status: 'OPEN',
    created_at: { $gte: getRequestCutoff() },
  };
  const [requests, total] = await Promise.all([
    ParentRequest.find(filter).select(REQUEST_FIELDS).sort({ created_at: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    ParentRequest.countDocuments(filter),
  ]);
  return {
    profile: {
      user_id: String(user._id),
      full_name: maskContact(user.full_name),
      avatar_url: user.avatar_url ?? null,
    },
    requests: {
      items: requests.map((request) => ({
        _id: String(request._id),
        title: maskContact(request.title),
        subject_name: maskContact(request.subject_name),
        grade_level: maskContact(request.grade_level),
        teaching_mode: request.teaching_mode,
        budget: decimalToNumber(request.budget),
        schedule: maskContact(request.schedule),
        description: maskContact(request.description),
        location_address: maskContact(request.location_address),
      })),
      pagination: buildPagination(page, limit, total),
    },
  };
};

/**
 * Public PUBLISHED tutor posts for the /tutors "Bài đăng" tab, newest first.
 * Only posts of complete profiles whose tutor account is ACTIVE are listed (same rule as the public profile).
 * @param {Object} query - { q?, subject?, grade?, mode?, min_price?, max_price?, page, limit }
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listPublicPosts = async ({ q, subject, grade, mode, min_price, max_price, page, limit }) => {
  // shortcut: loads every active tutor id per request; switch to an aggregation $lookup if tutors grow to many thousands
  const tutorUsers = await User.find({ role: 'TUTOR', account_status: 'ACTIVE' }).select('_id full_name avatar_url').lean();
  const userById = new Map(tutorUsers.map((tutorUser) => [String(tutorUser._id), tutorUser]));
  const profiles = await TutorProfile.find({ user_id: { $in: tutorUsers.map((tutorUser) => tutorUser._id) }, is_complete: true })
    .select('_id user_id avatar_url average_rating')
    .lean();
  const profileById = new Map(profiles.map((profile) => [String(profile._id), profile]));

  const postFilter = { status: 'PUBLISHED', profile_id: { $in: profiles.map((profile) => profile._id) } };
  if (subject) {
    postFilter.subject_name = new RegExp(`^${escapeRegex(subject)}$`, 'i');
  }
  if (grade) {
    postFilter.grade_level = new RegExp(`^${escapeRegex(grade)}$`, 'i');
  }
  if (mode) {
    postFilter.teaching_mode = mode;
  }
  if (min_price !== undefined || max_price !== undefined) {
    postFilter.price = {};
    if (min_price !== undefined) {
      postFilter.price.$gte = min_price;
    }
    if (max_price !== undefined) {
      postFilter.price.$lte = max_price;
    }
  }
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    postFilter.$or = [{ title: pattern }, { subject_name: pattern }, { description: pattern }];
  }

  const [posts, total] = await Promise.all([
    TutorPost.find(postFilter)
      .select(`${POST_FIELDS} profile_id created_at`)
      .sort({ created_at: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    TutorPost.countDocuments(postFilter),
  ]);

  return {
    items: posts.map((post) => {
      const profile = profileById.get(String(post.profile_id));
      const tutorUser = userById.get(String(profile.user_id));
      let avatarUrl = null;
      if (tutorUser.avatar_url) {
        avatarUrl = tutorUser.avatar_url;
      } else if (profile.avatar_url) {
        avatarUrl = profile.avatar_url;
      }
      return {
        _id: String(post._id),
        title: maskContact(post.title),
        subject_name: maskContact(post.subject_name),
        grade_level: maskContact(post.grade_level),
        teaching_mode: post.teaching_mode,
        price: decimalToNumber(post.price),
        schedule: maskContact(post.schedule),
        description: maskContact(post.description),
        created_at: post.created_at,
        tutor: {
          profile_id: String(profile._id),
          full_name: maskContact(tutorUser.full_name),
          avatar_url: avatarUrl,
          average_rating: profile.average_rating ?? null,
        },
      };
    }),
    pagination: buildPagination(page, limit, total),
  };
};
