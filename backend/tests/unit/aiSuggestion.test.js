import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refreshSuggestionsSchema } from '../../src/common/validator/aiSuggestionSchema.js';
import { assertParent } from '../../src/services/aiSuggestion.service.js';
import {
  isGradeMatch,
  isSubjectMatch,
  matchesSubjectAndGrade,
  normalizeText,
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

test('matchesSubjectAndGrade needs the same subject and grade, and ignores mode, price and schedule', () => {
  const request = { subject_name: 'Toán', grade_level: 'Lớp 9', teaching_mode: 'ONLINE', budget: 100000, schedule: 'Mon' };
  const post = { subject_name: 'Toán', grade_level: 'Lớp 9', teaching_mode: 'OFFLINE', price: 900000, schedule: 'Sun' };
  assert.equal(matchesSubjectAndGrade(request, post), true);
  assert.equal(matchesSubjectAndGrade(request, { ...post, subject_name: 'Tiếng Anh' }), false);
  assert.equal(matchesSubjectAndGrade(request, { ...post, grade_level: 'Lớp 12' }), false);
});

test('refresh schema accepts an empty body only', () => {
  assert.equal(refreshSuggestionsSchema.safeParse({}).success, true);
  assert.equal(refreshSuggestionsSchema.safeParse({ weights: { budget: 60 } }).success, false);
  assert.equal(refreshSuggestionsSchema.safeParse({ tutor_id: 'x' }).success, false);
});

test('assertParent only allows PARENT', () => {
  assert.doesNotThrow(() => assertParent({ id: 'x', role: 'PARENT' }));
  for (const role of ['STUDENT', 'TUTOR', 'ADMIN', undefined]) {
    assert.throws(() => assertParent({ id: 'x', role: role }), (error) => error.status === 403);
  }
});
