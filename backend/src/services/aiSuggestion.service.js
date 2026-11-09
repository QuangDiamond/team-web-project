import mongoose from 'mongoose';
import { ParentRequest } from '../models/ParentRequest.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { User } from '../models/User.js';
import { AppError } from '../common/utils/AppError.js';
import { decimalToNumber, isRequestAvailable } from '../common/utils/requestRules.js';
import { buildPagination } from '../common/utils/pagination.js';
import { maskContact } from '../common/utils/contactMask.js';
import { normalizeText, matchTeachingCategories } from './tutorMatching.service.js';
import { loadActiveTeachingCatalog } from './category.service.js';
export { matchTeachingCategories };

/**
 * Restrict tutor suggestions to Parent accounts.
 * @param {Object} user - Authenticated account.
 * @returns {void}
 */
export const assertParent = (user) => {
  if (user.role !== 'PARENT') throw new AppError('Only parent accounts can view tutor suggestions', 403);
};

/**
 * Load profile-based tutor suggestions for a current request owned by the Parent.
 * @param {Object} user - Authenticated Parent account.
 * @param {string} requestId - Parent request ID.
 * @param {Object} query - Page and limit.
 * @returns {Promise<Object>} Request, matching tutors, pagination and empty-state hint.
 */
export const getSuggestions = async (user, requestId, { page, limit }) => {
  assertParent(user);
  if (!mongoose.isValidObjectId(requestId)) throw new AppError('Tutoring request not found', 404);
  const request = await ParentRequest.findOne({ _id: requestId, parent_user_id: user.id }).lean();
  if (!request) throw new AppError('Tutoring request not found', 404);
  if (!isRequestAvailable(request)) throw new AppError('Tutor suggestions are only available for open requests', 409);

  const { subjects, grades, catalog } = await loadActiveTeachingCatalog();
  const subjectIds = subjects.filter((item) => normalizeText(item.name) === normalizeText(request.subject_name)).map((item) => item._id);
  const gradeIds = grades.filter((item) => normalizeText(item.name) === normalizeText(request.grade_level)).map((item) => item._id);
  let items = [];
  if (subjectIds.length > 0 && gradeIds.length > 0) {
    const profiles = await TutorProfile.find({
      is_complete: true,
      $and: [
        { teaching_categories: { $elemMatch: { type: 'subjects', category_id: { $in: subjectIds } } } },
        { teaching_categories: { $elemMatch: { type: 'grades', category_id: { $in: gradeIds } } } },
      ],
    }).select('_id user_id avatar_url headline average_rating availability_status teaching_categories').lean();
    const users = await User.find({
      _id: { $in: profiles.map((profile) => profile.user_id) }, role: 'TUTOR', account_status: 'ACTIVE',
    }).select('_id full_name avatar_url').lean();
    const usersById = new Map(users.map((account) => [String(account._id), account]));
    for (const profile of profiles) {
      const account = usersById.get(String(profile.user_id));
      const matches = matchTeachingCategories(request, profile.teaching_categories || [], catalog);
      if (!account || matches.length !== 2) continue;
      items.push({
        _id: String(profile._id),
        tutor: {
          profile_id: String(profile._id), full_name: maskContact(account.full_name) || 'Gia sư',
          avatar_url: account.avatar_url || profile.avatar_url || null,
          headline: maskContact(profile.headline), average_rating: profile.average_rating ?? null,
          availability_status: profile.availability_status || null,
        },
        matching_categories: matches,
        reason: 'Phù hợp môn ' + maskContact(request.subject_name) + ' và trình độ ' + maskContact(request.grade_level) + '.',
      });
    }
    items.sort((first, second) => {
      const difference = (second.tutor.average_rating || 0) - (first.tutor.average_rating || 0);
      if (difference !== 0) return difference;
      const nameOrder = first.tutor.full_name.localeCompare(second.tutor.full_name, 'vi');
      if (nameOrder !== 0) return nameOrder;
      return first._id.localeCompare(second._id);
    });
  }
  const total = items.length;
  return {
    request: {
      _id: String(request._id), title: maskContact(request.title),
      subject_name: maskContact(request.subject_name), grade_level: maskContact(request.grade_level),
      teaching_mode: request.teaching_mode, budget: decimalToNumber(request.budget),
    },
    items: items.slice((page - 1) * limit, page * limit),
    pagination: buildPagination(page, limit, total),
    hint: total === 0 ? 'Chưa có gia sư đăng ký giảng dạy cả môn học và trình độ này trong hồ sơ.' : null,
  };
};

/**
 * Recompute current suggestions without a cache, AI provider, quota or credit charge.
 * @param {Object} user - Authenticated Parent account.
 * @param {string} requestId - Owned request ID.
 * @returns {Promise<Object>} First page of profile-based suggestions.
 */
export const refreshSuggestions = (user, requestId) => getSuggestions(user, requestId, { page: 1, limit: 10 });
