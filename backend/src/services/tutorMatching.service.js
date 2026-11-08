// Ghép gia sư với request chỉ dựa trên môn học và khối lớp (UC09, UC11). Toàn bộ là hàm thuần, không đụng DB hay mạng.

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
