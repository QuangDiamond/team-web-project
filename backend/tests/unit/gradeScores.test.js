import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateGradeScores } from '../../src/services/classroom.service.js';

const assignment = {
  total_points: 10,
  questions: [{ _id: 'q1', points: 3 }, { _id: 'q2', points: null }],
};

const expectScoreError = (data, field) => {
  assert.throws(() => validateGradeScores(assignment, data), (error) => {
    assert.equal(error.status, 422);
    assert.ok(error.errors[field], `expected error on ${field}`);
    return true;
  });
};

test('grading accepts scores within each question and the assignment total', () => {
  validateGradeScores(assignment, {
    final_score: 10,
    answers_feedback: [{ question_id: 'q1', score: 3 }, { question_id: 'q2', score: '0.5' }, { question_id: 'q1', comment: 'ok' }],
  });
  validateGradeScores({ total_points: null, questions: [] }, { final_score: 10 });
});

test('grading rejects a question score above its points or below zero', () => {
  expectScoreError({ final_score: 5, answers_feedback: [{ question_id: 'q1', score: 3.25 }] }, 'answers_feedback');
  // Câu chưa đặt điểm tính tối đa 1 điểm
  expectScoreError({ final_score: 5, answers_feedback: [{ question_id: 'q2', score: 2 }] }, 'answers_feedback');
  expectScoreError({ final_score: 5, answers_feedback: [{ question_id: 'q1', score: -1 }] }, 'answers_feedback');
});

test('grading rejects a final score outside 0..total_points', () => {
  expectScoreError({ final_score: 10.5 }, 'final_score');
  expectScoreError({ final_score: -1 }, 'final_score');
  expectScoreError({ final_score: 11 }, 'final_score');
});
