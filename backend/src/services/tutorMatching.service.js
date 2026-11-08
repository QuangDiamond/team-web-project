import { ENUMS } from '../models/enums.js';

// Chấm điểm gợi ý gia sư bằng luật (UC09 bước 2-3). Toàn bộ là hàm thuần, không đụng DB hay mạng.

const { ParentRequestsTeachingMode } = ENUMS;

export const DEFAULT_WEIGHTS = Object.freeze({ budget: 35, rating: 25, schedule: 20, area: 20 });

// Điểm trung tính khi thiếu dữ liệu, tránh phạt hay thưởng gia sư chỉ vì chưa điền thông tin
const NEUTRAL_SCORE = 0.5;

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

// Từ quá phổ biến, không giúp phân biệt lịch / khu vực
const STOP_WORDS = new Set(['lop', 'khoi', 'thang', 'tp', 'quan', 'huyen', 'phuong', 'va', 'the', 'and', 'tu', 'den']);

const toTokens = (text) => {
  const tokens = normalizeText(text).split(' ');
  return tokens.filter((token) => token.length > 0 && !STOP_WORDS.has(token));
};

/**
 * Độ trùng của hai đoạn văn bản tự do (Jaccard trên từ khóa), 0..1; thiếu dữ liệu một bên thì trung tính
 * @param {string|null} first
 * @param {string|null} second
 * @returns {number}
 */
export const textOverlap = (first, second) => {
  const firstTokens = new Set(toTokens(first));
  const secondTokens = new Set(toTokens(second));
  if (firstTokens.size === 0 || secondTokens.size === 0) {
    return NEUTRAL_SCORE;
  }

  let shared = 0;
  for (const token of firstTokens) {
    if (secondTokens.has(token)) {
      shared += 1;
    }
  }
  const union = firstTokens.size + secondTokens.size - shared;
  return shared / union;
};

/**
 * Ràng buộc cứng về môn học: hai tên môn giống nhau hoặc cái này chứa cái kia (sau khi chuẩn hóa)
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
 * Ràng buộc cứng về khối lớp: so khớp theo số ("Lớp 9" khớp "9"), không có số thì so chuỗi
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
 * Ràng buộc cứng về hình thức học: trùng nhau, hoặc một bên là HYBRID
 * @param {string|null} requestMode
 * @param {string|null} postMode
 * @returns {boolean}
 */
export const isModeCompatible = (requestMode, postMode) => {
  if (!requestMode || !postMode) {
    return false;
  }
  if (requestMode === postMode) {
    return true;
  }
  return requestMode === ParentRequestsTeachingMode.HYBRID || postMode === ParentRequestsTeachingMode.HYBRID;
};

/**
 * Mức phù hợp học phí, 0..1: trong ngân sách = 1, vượt thì giảm tuyến tính, vượt gấp đôi = 0
 * @param {number|null} budget - ngân sách của phụ huynh
 * @param {number|null} price - học phí gia sư
 * @returns {number}
 */
export const budgetFit = (budget, price) => {
  if (!Number.isFinite(budget) || !Number.isFinite(price) || budget <= 0) {
    return NEUTRAL_SCORE;
  }
  if (price <= budget) {
    return 1;
  }
  return Math.max(0, 1 - (price - budget) / budget);
};

/**
 * Điểm đánh giá, 0..1 (thang 5 sao); chưa có đánh giá thì trung tính
 * @param {number|null} averageRating
 * @returns {number}
 */
export const ratingScore = (averageRating) => {
  if (!Number.isFinite(averageRating)) {
    return NEUTRAL_SCORE;
  }
  return Math.min(1, Math.max(0, averageRating / 5));
};

/**
 * Chuẩn hóa trọng số (thiếu thì lấy mặc định) để tổng = 1
 * @param {Object} [weights] - { budget, rating, schedule, area } mỗi giá trị 0..100
 * @returns {{ budget: number, rating: number, schedule: number, area: number }}
 */
export const normalizeWeights = (weights = {}) => {
  const merged = { ...DEFAULT_WEIGHTS, ...weights };
  const total = merged.budget + merged.rating + merged.schedule + merged.area;
  if (total <= 0) {
    return normalizeWeights(DEFAULT_WEIGHTS);
  }
  return {
    budget: merged.budget / total,
    rating: merged.rating / total,
    schedule: merged.schedule / total,
    area: merged.area / total,
  };
};

const roundTo = (value, digits) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/**
 * Tính điểm khớp 0..100 và chi tiết từng thành phần.
 * Khu vực chỉ có nghĩa khi học trực tiếp: request ONLINE thì bỏ thành phần này và chia lại trọng số.
 * @param {Object} request - { teaching_mode, budget(number), schedule, location_address }
 * @param {Object} candidate - { price(number), schedule, address, average_rating }
 * @param {Object} [weights] - trọng số do parent chỉnh
 * @returns {{ match_score: number, breakdown: Object }}
 */
export const scoreCandidate = (request, candidate, weights) => {
  const normalized = normalizeWeights(weights);
  const isOnlineRequest = request.teaching_mode === ParentRequestsTeachingMode.ONLINE;

  const components = {
    budget: budgetFit(request.budget, candidate.price),
    rating: ratingScore(candidate.average_rating),
    schedule: textOverlap(request.schedule, candidate.schedule),
  };
  const activeWeights = { budget: normalized.budget, rating: normalized.rating, schedule: normalized.schedule };
  if (!isOnlineRequest) {
    components.area = textOverlap(request.location_address, candidate.address);
    activeWeights.area = normalized.area;
  }

  let weightTotal = 0;
  let weightedSum = 0;
  for (const name of Object.keys(components)) {
    weightTotal += activeWeights[name];
    weightedSum += components[name] * activeWeights[name];
  }

  let score = 0;
  if (weightTotal > 0) {
    score = weightedSum / weightTotal;
  }

  const breakdown = {};
  for (const name of Object.keys(components)) {
    breakdown[name] = roundTo(components[name] * 100, 0);
  }
  return { match_score: roundTo(score * 100, 1), breakdown: breakdown };
};
