import { TutorProfile } from '../models/TutorProfile.js';
import { User } from '../models/User.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { assertRole } from '../common/utils/assertRole.js';
import { Subject } from '../models/Subject.js';
import { GradeLevel } from '../models/GradeLevel.js';

/**
 * Resolve catalog selections and reject missing or newly selected inactive entries.
 * @param {Object[]} selections - Category type and ID pairs.
 * @param {Object[]} previous - Previously saved selections, including inactive ones.
 * @returns {Promise<Object[]>} Validated selections with server-owned display names.
 */
export const resolveTeachingCategories = async (selections, previous = []) => {
  const resolved = new Map();
  const retained = new Set(previous.map((item) => `${item.type}:${item.category_id}`));
  for (const [type, Model] of [['subjects', Subject], ['grades', GradeLevel]]) {
    const ids = selections.filter((item) => item.type === type).map((item) => item.category_id);
    if (ids.length === 0) continue;
    const categories = await Model.find({ _id: { $in: ids } }).select('_id name is_active').lean();
    for (const item of categories) {
      const key = `${type}:${item._id}`;
      if (item.is_active || retained.has(key)) resolved.set(key, item);
    }
  }
  return selections.map((item) => {
    const key = `${item.type}:${item.category_id.toLowerCase()}`;
    const category = resolved.get(key);
    if (!category) throw new AppError('Danh mục không còn khả dụng. Vui lòng bỏ mục đó và chọn lại.', 422, { teaching_categories: ['Danh mục không còn khả dụng.'] });
    return { type: item.type, category_id: category._id, name: category.name };
  });
};

const toDateOnly = (value) => {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString().slice(0, 10);
};

/**
 * Chuyển hồ sơ sang dữ liệu trả về cho chính gia sư
 * @param {Object} profile - TutorProfile (lean hoặc document)
 * @returns {Object}
 */
export const toTutorProfileDto = (profile) => {
  const raw = typeof profile.toObject === 'function' ? profile.toObject() : profile;
  return {
    _id: String(raw._id),
    avatar_url: raw.avatar_url || null,
    teaching_categories: (raw.teaching_categories || []).map((item) => ({ type: item.type, category_id: String(item.category_id), name: item.name })),
    headline: raw.headline,
    bio: raw.bio,
    address: raw.address,
    is_address_hidden: raw.is_address_hidden === true,
    is_complete: raw.is_complete === true,
    availability_status: raw.availability_status,
    average_rating: raw.average_rating ?? null,
    experiences: (raw.experiences || []).map((item) => ({
      title: item.title,
      company: item.company ?? null,
      start_date: toDateOnly(item.start_date),
      end_date: toDateOnly(item.end_date),
    })),
    educations: (raw.educations || []).map((item) => ({
      school: item.school,
      degree: item.degree ?? null,
      graduation_year: item.graduation_year ?? null,
      description: item.description ?? null,
    })),
    achievements: (raw.achievements || []).map((item) => ({
      title: item.title,
      description: item.description ?? null,
    })),
  };
};

/**
 * Hồ sơ của chính gia sư đang đăng nhập. Chưa có hồ sơ thì profile = null (không phải lỗi)
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<{ profile: Object|null, full_name: string }>}
 */
export const getMyProfile = async (user) => {
  assertRole(user, ENUMS.UserRole.TUTOR);

  const [profile, account] = await Promise.all([
    TutorProfile.findOne({ user_id: user.id }),
    User.findById(user.id).select('full_name avatar_url').lean(),
  ]);

  let profileDto = null;
  if (profile) {
    profileDto = toTutorProfileDto(profile);
    profileDto.avatar_url = account?.avatar_url || profile.avatar_url || null;
  }
  let fullName = '';
  if (account) {
    fullName = account.full_name;
  }
  return { profile: profileDto, full_name: fullName };
};

/**
 * Tạo hoặc cập nhật hồ sơ của chính gia sư. Các trường bắt buộc (headline, bio, address) được kiểm tra ở validator
 * nên sau khi lưu hồ sơ luôn đầy đủ (is_complete = true). Không đổi được user_id, average_rating
 * @param {Object} user - req.user { id, role }
 * @param {Object} data - body đã validate
 * @returns {Promise<{ profile: Object, created: boolean }>}
 */
export const saveMyProfile = async (user, data) => {
  assertRole(user, ENUMS.UserRole.TUTOR);

  const fields = { ...data, is_complete: true };
  let profile = await TutorProfile.findOne({ user_id: user.id });
  if (data.teaching_categories !== undefined) {
    fields.teaching_categories = await resolveTeachingCategories(data.teaching_categories, profile?.teaching_categories || []);
  }
  let created = false;

  if (profile) {
    profile.set(fields);
    await profile.save();
  } else {
    try {
      profile = await TutorProfile.create({ user_id: user.id, ...fields });
      created = true;
    } catch (error) {
      // Hai lần lưu đầu tiên đồng thời: unique index user_id chặn bản thứ hai
      if (error.code === 11000) {
        throw new AppError('Your profile was just created, please reload and try again', 409);
      }
      throw error;
    }
  }
  return { profile: toTutorProfileDto(profile), created: created };
};
