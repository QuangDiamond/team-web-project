import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  buildAttendanceSummary,
  splitAnswerScores,
  toResultDto,
  toScorePercent,
} from '../../src/services/childProgress.service.js';

const newId = () => new mongoose.Types.ObjectId();

test('attendance rate counts present and late as attended and is null without any record', () => {
  assert.deepEqual(buildAttendanceSummary({}), { present: 0, late: 0, absent: 0, total: 0, attended: 0, rate: null });
  const summary = buildAttendanceSummary({ present: 6, late: 2, absent: 2 });
  assert.equal(summary.total, 10);
  assert.equal(summary.attended, 8);
  assert.equal(summary.rate, 80);
  assert.equal(buildAttendanceSummary({ present: 1, late: 0, absent: 2 }).rate, 33.3);
  assert.equal(buildAttendanceSummary({ absent: 3 }).rate, 0);
  assert.equal(buildAttendanceSummary({ present: 4 }).rate, 100);
});

test('score percent has one decimal, stays within 0-100 and is null when it cannot be computed', () => {
  assert.equal(toScorePercent(8, 10), 80);
  assert.equal(toScorePercent(7, 9), 77.8);
  assert.equal(toScorePercent(0, 10), 0);
  assert.equal(toScorePercent(12, 10), 100);
  assert.equal(toScorePercent(-1, 10), 0);
  assert.equal(toScorePercent(null, 10), null);
  assert.equal(toScorePercent(undefined, 10), null);
  assert.equal(toScorePercent(5, 0), null);
  assert.equal(toScorePercent(5, null), null);
});

test('answer scores are split into auto-graded multiple choice points and manual points', () => {
  const answers = [
    { score: 2, is_auto_graded: true },
    { score: 1, is_auto_graded: true },
    { score: 3.5, is_auto_graded: false },
    { score: null, is_auto_graded: false },
    { is_auto_graded: true },
  ];
  assert.deepEqual(splitAnswerScores(answers), { auto_graded_points: 3, manual_points: 3.5, has_auto_graded: true });
  assert.deepEqual(splitAnswerScores([{ score: 4, is_auto_graded: false }]), { auto_graded_points: 0, manual_points: 4, has_auto_graded: false });
  assert.deepEqual(splitAnswerScores(undefined), { auto_graded_points: 0, manual_points: 0, has_auto_graded: false });
});

test('result DTO exposes score, percent, auto-graded part and tutor feedback but not other students or raw answers', () => {
  const submission = {
    _id: newId(), assignment_id: newId(), student_user_id: newId(), final_score: 8, overall_feedback: 'Làm tốt',
    timeliness: 'ON_TIME', graded_at: new Date('2026-10-25T00:00:00Z'),
    answers: [{ question_id: newId(), text_response: 'secret answer', score: 2, is_auto_graded: true }, { score: 6, is_auto_graded: false }],
  };
  const dto = toResultDto(submission, { title: 'Bài 1', total_points: 10 }, { _id: 'c1', name: 'Toán 9', subject: 'Toán', tutor_name: 'GS A' });
  assert.equal(dto.final_score, 8);
  assert.equal(dto.score_percent, 80);
  assert.equal(dto.auto_graded_points, 2);
  assert.equal(dto.manual_points, 6);
  assert.equal(dto.has_auto_graded, true);
  assert.equal(dto.overall_feedback, 'Làm tốt');
  assert.equal(dto.class.name, 'Toán 9');
  assert.equal('answers' in dto, false);
  assert.equal('student_user_id' in dto, false);
  assert.equal(JSON.stringify(dto).includes('secret answer'), false);
});
