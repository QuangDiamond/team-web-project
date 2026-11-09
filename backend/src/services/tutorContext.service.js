import { TutorProfile } from '../models/TutorProfile.js';
import { User } from '../models/User.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { assertRole } from '../common/utils/assertRole.js';

/**
 * Lấy hồ sơ gia sư của tài khoản đang đăng nhập. Không tự tạo hồ sơ (việc của UC hồ sơ gia sư)
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<Object>} TutorProfile (lean)
 */
export const getTutorProfileOrThrow = async (user) => {
  assertRole(user, ENUMS.UserRole.TUTOR);

  const profile = await TutorProfile.findOne({ user_id: user.id }).lean();
  if (!profile) {
    throw new AppError('Complete your tutor profile first', 409);
  }
  return profile;
};

/**
 * Thông tin ngắn của nhiều gia sư (cho phụ huynh xem), kèm trạng thái tài khoản
 * @param {Array} tutorProfileIds
 * @returns {Promise<Map<string, Object>>} tutor_profile_id -> { profile_id, full_name, headline, average_rating, avatar_url, is_active }
 */
export const loadTutorSummaries = async (tutorProfileIds) => {
  const summaries = new Map();
  if (tutorProfileIds.length === 0) {
    return summaries;
  }

  const profiles = await TutorProfile.find({ _id: { $in: tutorProfileIds } }).lean();
  const users = await User.find({ _id: { $in: profiles.map((profile) => profile.user_id) } })
    .select('full_name avatar_url account_status')
    .lean();
  const userById = new Map(users.map((user) => [String(user._id), user]));

  for (const profile of profiles) {
    const user = userById.get(String(profile.user_id));
    if (!user) {
      continue;
    }
    let avatarUrl = null;
    if (user.avatar_url) {
      avatarUrl = user.avatar_url;
    } else if (profile.avatar_url) {
      avatarUrl = profile.avatar_url;
    }
    summaries.set(String(profile._id), {
      profile_id: String(profile._id),
      full_name: user.full_name,
      headline: profile.headline || null,
      average_rating: profile.average_rating ?? null,
      avatar_url: avatarUrl,
      is_active: user.account_status === ENUMS.UserAccountStatus.ACTIVE,
    });
  }
  return summaries;
};
