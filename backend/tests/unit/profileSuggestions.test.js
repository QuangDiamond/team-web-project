import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getSuggestions, refreshSuggestions, matchTeachingCategories } from '../../src/services/aiSuggestion.service.js';
import { ParentRequest } from '../../src/models/ParentRequest.js';
import { TutorProfile } from '../../src/models/TutorProfile.js';
import { Subject } from '../../src/models/Subject.js';
import { GradeLevel } from '../../src/models/GradeLevel.js';
import { User } from '../../src/models/User.js';
import { AiSuggestion } from '../../src/models/AiSuggestion.js';
import { TutorPost } from '../../src/models/TutorPost.js';

const requestId = '507f1f77bcf86cd799439010';
const subjectId = '507f1f77bcf86cd799439011';
const gradeId = '507f1f77bcf86cd799439012';
const parent = { id: 'parent', role: 'PARENT' };
const request = { _id: requestId, title: 'Tìm gia sư', subject_name: 'Toán', grade_level: 'Lớp 9', status: 'OPEN', created_at: new Date(), budget: 100000 };
const query = (data) => ({ select() { return this; }, lean: async () => data });

test('matching requires both typed references and treats IELTS/TOEIC as distinct levels', () => {
  const catalog = new Map([['subjects:' + subjectId, 'Tiếng Anh'], ['grades:' + gradeId, 'IELTS 6.5']]);
  const selections = [{ type: 'subjects', category_id: subjectId, name: 'Stale label' }, { type: 'grades', category_id: gradeId }];
  const requested = { subject_name: 'tieng anh', grade_level: 'IELTS 6.5' };
  assert.equal(matchTeachingCategories(requested, selections, catalog).length, 2);
  assert.equal(matchTeachingCategories({ ...requested, grade_level: 'TOEIC 6.5' }, selections, catalog).length, 0);
  assert.equal(matchTeachingCategories(requested, [selections[0]], catalog).length, 0);
  assert.equal(matchTeachingCategories(requested, selections, new Map()).length, 0);
});

test('suggestions use profile category IDs, work without posts, paginate and never read the AI cache', async (t) => {
  t.mock.method(ParentRequest, 'findOne', (filter) => {
    assert.equal(filter.parent_user_id, parent.id);
    return query(request);
  });
  t.mock.method(Subject, 'find', () => query([{ _id: subjectId, name: 'Toán', is_active: true }]));
  t.mock.method(GradeLevel, 'find', () => query([{ _id: gradeId, name: 'Lớp 9', is_active: true }]));
  t.mock.method(TutorProfile, 'find', (filter) => {
    assert.equal(filter.is_complete, true);
    assert.equal(filter.$and.length, 2);
    return query([
      { _id: 'p1', user_id: 'u1', average_rating: 4, teaching_categories: [{ type: 'subjects', category_id: subjectId }, { type: 'grades', category_id: gradeId }] },
      { _id: 'p2', user_id: 'u2', average_rating: 5, teaching_categories: [{ type: 'subjects', category_id: subjectId }, { type: 'grades', category_id: gradeId }] },
      { _id: 'p3', user_id: 'u3', teaching_categories: [{ type: 'subjects', category_id: subjectId }] },
      { _id: 'p4', user_id: 'locked', teaching_categories: [{ type: 'subjects', category_id: subjectId }, { type: 'grades', category_id: gradeId }] },
    ]);
  });
  t.mock.method(User, 'find', (filter) => {
    assert.equal(filter.role, 'TUTOR');
    assert.equal(filter.account_status, 'ACTIVE');
    return query([{ _id: 'u1', full_name: 'Tutor 1' }, { _id: 'u2', full_name: 'Tutor 2' }, { _id: 'u3', full_name: 'Tutor 3' }]);
  });
  t.mock.method(AiSuggestion, 'find', () => { throw new Error('Old cache must not be read'); });
  t.mock.method(TutorPost, 'find', () => { throw new Error('Posts must not be required'); });
  const first = await getSuggestions(parent, requestId, { page: 1, limit: 1 });
  assert.equal(first.items[0].tutor.profile_id, 'p2');
  assert.equal(first.items[0].matching_categories.length, 2);
  assert.equal(first.pagination.total, 2);
  assert.equal(first.pagination.totalPages, 2);
  const second = await getSuggestions(parent, requestId, { page: 2, limit: 1 });
  assert.equal(second.items[0].tutor.profile_id, 'p1');
  assert.equal((await refreshSuggestions(parent, requestId)).pagination.total, 2);
});

test('suggestions reject unauthorized users and expired requests before tutor lookup', async (t) => {
  await assert.rejects(getSuggestions({ role: 'TUTOR' }, requestId, { page: 1, limit: 10 }), (error) => error.status === 403);
  t.mock.method(ParentRequest, 'findOne', () => query({ ...request, created_at: new Date('2000-01-01') }));
  await assert.rejects(getSuggestions(parent, requestId, { page: 1, limit: 10 }), (error) => error.status === 409);
});

test('all matching tutors remain available beyond the first ten results', async (t) => {
  const selections = [{ type: 'subjects', category_id: subjectId }, { type: 'grades', category_id: gradeId }];
  const profiles = Array.from({ length: 12 }, (_, index) => ({ _id: 'p' + index, user_id: 'u' + index, teaching_categories: selections, average_rating: 5 }));
  t.mock.method(ParentRequest, 'findOne', () => query(request));
  t.mock.method(Subject, 'find', () => query([{ _id: subjectId, name: 'Toán' }]));
  t.mock.method(GradeLevel, 'find', () => query([{ _id: gradeId, name: 'Lớp 9' }]));
  t.mock.method(TutorProfile, 'find', () => query(profiles));
  t.mock.method(User, 'find', () => query(profiles.map((item) => ({ _id: item.user_id, full_name: item.user_id }))));
  const result = await getSuggestions(parent, requestId, { page: 2, limit: 10 });
  assert.equal(result.pagination.total, 12);
  assert.equal(result.items.length, 2);
});
