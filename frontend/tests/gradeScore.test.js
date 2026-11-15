import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getQuestionMaxPoints, limitScoreInput } from '../src/utils/gradeScore.js';

test('score input keeps values within 0..max and rejects the rest', () => {
  assert.equal(limitScoreInput('2.5', 3, '1'), '2.5');
  assert.equal(limitScoreInput('3', 3, '1'), '3');
  assert.equal(limitScoreInput('3.25', 3, '1'), '1');
  assert.equal(limitScoreInput('15', 10, '9'), '9');
  assert.equal(limitScoreInput('-1', 3, '0'), '0');
  assert.equal(limitScoreInput('', 3, '2'), '');
  assert.equal(getQuestionMaxPoints({ points: 4 }), 4);
  assert.equal(getQuestionMaxPoints({ points: null }), 1);
  assert.equal(getQuestionMaxPoints(undefined), 1);
});
