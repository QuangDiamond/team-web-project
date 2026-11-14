// Shared pure matching rules for both Parent and Tutor suggestions.
import { maskContact } from '../common/utils/contactMask.js';

/**
 * Chuẩn hóa chuỗi để so khớp: bỏ dấu tiếng Việt, chữ thường, bỏ ký tự đặc biệt
 * @param {string|null|undefined} text
 * @returns {string}
 */
export const normalizeText = (text) => {
  if (!text) {
    return '';
  }
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Môn học khớp: hai tên môn giống nhau hoặc cái này chứa cái kia (sau khi chuẩn hóa)
 * @param {string|null} requestSubject
 * @param {string|null} postSubject
 * @returns {boolean}
 */
export const isSubjectMatch = (requestSubject, postSubject) => {
  const requested = normalizeText(requestSubject);
  const offered = normalizeText(postSubject);
  if (!requested || !offered) {
    return false;
  }
  return requested === offered || offered.includes(requested) || requested.includes(offered);
};

/**
 * Khối lớp khớp: so khớp theo số ("Lớp 9" khớp "9"), không có số thì so chuỗi
 * @param {string|null} requestGrade
 * @param {string|null} postGrade
 * @returns {boolean}
 */
export const isGradeMatch = (requestGrade, postGrade) => {
  const requested = normalizeText(requestGrade);
  const offered = normalizeText(postGrade);
  if (!requested || !offered) {
    return false;
  }

  const requestedNumbers = requested.match(/\d+/g);
  const offeredNumbers = offered.match(/\d+/g);
  if (requestedNumbers && offeredNumbers) {
    return requestedNumbers.some((number) => offeredNumbers.includes(number));
  }
  return requested === offered || offered.includes(requested) || requested.includes(offered);
};

/**
 * Một request và một bài đăng của gia sư khớp nhau khi cùng môn học và cùng khối lớp
 * @param {Object} request - { subject_name, grade_level }
 * @param {Object} post - { subject_name, grade_level }
 * @returns {boolean}
 */
export const matchesSubjectAndGrade = (request, post) => {
  return isSubjectMatch(request.subject_name, post.subject_name) && isGradeMatch(request.grade_level, post.grade_level);
};

/**
 * Match at least one active subject or education level selected in a tutor profile.
 * @param {Object} request - Request subject and education level.
 * @param {Object[]} selections - Tutor profile category references.
 * @param {Map} catalog - Active names keyed by category type and ID.
 * @returns {boolean} Whether any category matches.
 */
export const matchesAnyTeachingCategory = (request, selections, catalog) => {
  return selections.some((item) => {
    let requestedName;
    if (item.type === 'subjects') requestedName = request.subject_name;
    else if (item.type === 'grades') requestedName = request.grade_level;
    else return false;
    const offeredName = catalog.get(item.type + ':' + item.category_id);
    const requested = normalizeText(requestedName);
    return Boolean(requested && offeredName) && requested === normalizeText(offeredName);
  });
};

/**
 * Match both catalog types using their authoritative active names and IDs.
 * @param {Object} request - Request subject and education level.
 * @param {Object[]} selections - Tutor profile category references.
 * @param {Map} catalog - Active category names keyed by type and ID.
 * @returns {Object[]} Matching subject and level, or an empty list.
 */
export const matchTeachingCategories = (request, selections, catalog) => {
  const subject = selections.find((item) => item.type === 'subjects' &&
    normalizeText(catalog.get('subjects:' + item.category_id)) === normalizeText(request.subject_name));
  const grade = selections.find((item) => item.type === 'grades' &&
    normalizeText(catalog.get('grades:' + item.category_id)) === normalizeText(request.grade_level));
  if (!subject || !grade || !request.subject_name || !request.grade_level) return [];
  return [subject, grade].map((item) => ({
    type: item.type,
    category_id: String(item.category_id),
    name: maskContact(catalog.get(item.type + ':' + item.category_id)),
  }));
};

/**
 * Một request phù hợp với gia sư khi cùng môn học VÀ cùng khối lớp, theo một trong hai nguồn:
 * hồ sơ gia sư (cặp môn + khối trong teaching_categories) hoặc bài đăng PUBLISHED của gia sư.
 * Dùng chung cho gợi ý gia sư cho phụ huynh và gợi ý yêu cầu cho gia sư.
 * @param {Object} request - { subject_name, grade_level }
 * @param {Object[]} selections - teaching_categories của hồ sơ gia sư
 * @param {Map} catalog - tên danh mục đang bật, khóa dạng "type:id"
 * @param {Object[]} posts - bài đăng PUBLISHED của gia sư ({ subject_name, grade_level })
 * @returns {{ matched: boolean, profileCategories: Object[], postMatched: boolean }}
 */
export const matchTutorToRequest = (request, selections, catalog, posts) => {
  const profileCategories = matchTeachingCategories(request, selections, catalog);
  const postMatched = posts.some((post) => matchesSubjectAndGrade(request, post));
  return {
    matched: profileCategories.length === 2 || postMatched,
    profileCategories: profileCategories,
    postMatched: postMatched,
  };
};
