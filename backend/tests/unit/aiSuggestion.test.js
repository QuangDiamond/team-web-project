import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refreshSuggestionsSchema } from '../../src/common/validator/aiSuggestionSchema.js';
import { assertParent } from '../../src/services/aiSuggestion.service.js';
import {
  budgetFit,
  isGradeMatch,
  isModeCompatible,
  isSubjectMatch,
  normalizeText,
  normalizeWeights,
  ratingScore,
  scoreCandidate,
  textOverlap,
} from '../../src/services/tutorMatching.service.js';

test('normalizeText removes Vietnamese accents and punctuation', () => {
  assert.equal(normalizeText('  Toán, Lớp 9! '), 'toan lop 9');
  assert.equal(normalizeText('Đại số'), 'dai so');
  assert.equal(normalizeText(null), '');
});

test('isSubjectMatch is accent-insensitive and tolerant of extra words', () => {
  assert.equal(isSubjectMatch('Toán', 'toan'), true);
  assert.equal(isSubjectMatch('Vật lý', 'Vật lý nâng cao'), true);
  assert.equal(isSubjectMatch('Toán', 'Tiếng Anh'), false);
  assert.equal(isSubjectMatch('', 'Toán'), false);
});

test('isGradeMatch compares grade numbers', () => {
  assert.equal(isGradeMatch('Lớp 9', '9'), true);
  assert.equal(isGradeMatch('Lớp 9', 'Lớp 9 - 10'), true);
  assert.equal(isGradeMatch('Lớp 9', 'Lớp 11'), false);
  assert.equal(isGradeMatch('Đại học', 'đại học'), true);
  assert.equal(isGradeMatch(null, 'Lớp 9'), false);
});

test('isModeCompatible treats HYBRID as compatible with everything', () => {
  assert.equal(isModeCompatible('ONLINE', 'ONLINE'), true);
  assert.equal(isModeCompatible('ONLINE', 'HYBRID'), true);
  assert.equal(isModeCompatible('HYBRID', 'OFFLINE'), true);
  assert.equal(isModeCompatible('ONLINE', 'OFFLINE'), false);
  assert.equal(isModeCompatible(null, 'ONLINE'), false);
});

test('budgetFit is 1 within budget, decreases above it and never below 0', () => {
  assert.equal(budgetFit(200000, 150000), 1);
  assert.equal(budgetFit(200000, 300000), 0.5);
  assert.equal(budgetFit(200000, 500000), 0);
  assert.equal(budgetFit(null, 150000), 0.5);
});

test('ratingScore is neutral without rating and capped at 1', () => {
  assert.equal(ratingScore(null), 0.5);
  assert.equal(ratingScore(4.5), 0.9);
  assert.equal(ratingScore(9), 1);
});

test('textOverlap is neutral when one side is empty, 1 for identical text', () => {
  assert.equal(textOverlap('', 'Tối thứ 3'), 0.5);
  assert.equal(textOverlap('Tối thứ 3, thứ 5', 'tối thứ 3 thứ 5'), 1);
  assert.equal(textOverlap('sáng chủ nhật', 'tối thứ 3'), 0);
});

test('normalizeWeights falls back to defaults and sums to 1', () => {
  const weights = normalizeWeights({ budget: 50, rating: 50, schedule: 0, area: 0 });
  assert.deepEqual(weights, { budget: 0.5, rating: 0.5, schedule: 0, area: 0 });
  const defaults = normalizeWeights();
  assert.ok(Math.abs(defaults.budget + defaults.rating + defaults.schedule + defaults.area - 1) < 1e-9);
});

const baseRequest = { teaching_mode: 'OFFLINE', budget: 200000, schedule: 'Tối thứ 3', location_address: 'Cầu Giấy Hà Nội' };
const goodCandidate = { price: 150000, schedule: 'tối thứ 3', address: 'Cầu Giấy Hà Nội', average_rating: 5 };

test('scoreCandidate gives 100 for a perfect match and includes area for offline requests', () => {
  const result = scoreCandidate(baseRequest, goodCandidate);
  assert.equal(result.match_score, 100);
  assert.deepEqual(Object.keys(result.breakdown).sort(), ['area', 'budget', 'rating', 'schedule']);
});

test('scoreCandidate drops the area component for online requests', () => {
  const result = scoreCandidate({ ...baseRequest, teaching_mode: 'ONLINE' }, goodCandidate);
  assert.equal(result.match_score, 100);
  assert.equal('area' in result.breakdown, false);
});

test('scoreCandidate ranks a cheaper, better rated tutor higher', () => {
  const better = scoreCandidate(baseRequest, goodCandidate);
  const worse = scoreCandidate(baseRequest, { price: 400000, schedule: 'sáng chủ nhật', address: 'Quận 1', average_rating: 2 });
  assert.ok(better.match_score > worse.match_score);
});

test('scoreCandidate respects custom weights (price only vs rating only)', () => {
  const cheapLowRating = { price: 100000, schedule: 'x', address: 'y', average_rating: 1 };
  const priceOnly = scoreCandidate(baseRequest, cheapLowRating, { budget: 100, rating: 0, schedule: 0, area: 0 });
  const ratingOnly = scoreCandidate(baseRequest, cheapLowRating, { budget: 0, rating: 100, schedule: 0, area: 0 });
  assert.equal(priceOnly.match_score, 100);
  assert.equal(ratingOnly.match_score, 20);
});

test('refresh schema accepts empty body and valid weights', () => {
  assert.equal(refreshSuggestionsSchema.safeParse({}).success, true);
  assert.equal(refreshSuggestionsSchema.safeParse({ weights: { budget: 60, rating: 40 } }).success, true);
});

test('refresh schema rejects bad weights and system fields', () => {
  assert.equal(refreshSuggestionsSchema.safeParse({ weights: { budget: -1 } }).success, false);
  assert.equal(refreshSuggestionsSchema.safeParse({ weights: { budget: 101 } }).success, false);
  assert.equal(refreshSuggestionsSchema.safeParse({ weights: { budget: 0, rating: 0, schedule: 0, area: 0 } }).success, false);
  assert.equal(refreshSuggestionsSchema.safeParse({ weights: { response_rate: 10 } }).success, false);
  assert.equal(refreshSuggestionsSchema.safeParse({ weights: { budget: 10 }, tutor_id: 'x' }).success, false);
});

test('assertParent only allows PARENT', () => {
  assert.doesNotThrow(() => assertParent({ id: 'x', role: 'PARENT' }));
  for (const role of ['STUDENT', 'TUTOR', 'ADMIN', undefined]) {
    assert.throws(() => assertParent({ id: 'x', role: role }), (error) => error.status === 403);
  }
});
