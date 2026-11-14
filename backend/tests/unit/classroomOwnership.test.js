import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getUserClassrooms } from '../../src/services/classroom.service.js';
import { Classroom } from '../../src/models/Classroom.js';
import { TutorProfile } from '../../src/models/TutorProfile.js';
import { env } from '../../src/config/environment.js';

test('a tutor without classrooms never falls back to listing all classrooms in development', async (t) => {
  const previous = env.nodeEnv;
  env.nodeEnv = 'development';
  try {
    t.mock.method(Classroom, 'countDocuments', async () => 0);
    t.mock.method(Classroom, 'find', (filter) => {
      assert.deepEqual(filter.$or, [{ tutor_profile_id: 'profile1' }, { tutor_profile_id: 'user1' }]);
      return { populate() { return this; }, sort() { return this; }, async lean() { return []; } };
    });
    assert.deepEqual(await getUserClassrooms({ user: { _id: 'user1', role: 'TUTOR' }, tutorProfile: { _id: 'profile1' } }), []);
  } finally { env.nodeEnv = previous; }
});

test('classroom search and status filters preserve tutor ownership', async (t) => {
  t.mock.method(Classroom, 'countDocuments', async () => 0);
  t.mock.method(Classroom, 'find', (filter) => {
    assert.equal(filter.status, 'ACTIVE');
    assert.deepEqual(filter.$and[0], { $or: [{ tutor_profile_id: 'profile1' }, { tutor_profile_id: 'user1' }] });
    assert.ok(filter.$and[1].$or[0].name.test('Toán'));
    return { populate() { return this; }, sort() { return this; }, async lean() { return []; } };
  });
  await getUserClassrooms({ user: { _id: 'user1', role: 'TUTOR' }, tutorProfile: { _id: 'profile1' }, query: { search: 'Toán', status: 'ACTIVE' } });
});

test('missing user identity returns an empty list without querying classrooms', async (t) => {
  t.mock.method(Classroom, 'countDocuments', () => { throw new Error('Missing identity'); });
  const lookup = t.mock.method(Classroom, 'find', () => { throw new Error('Must not list classrooms'); });
  assert.deepEqual(await getUserClassrooms({ user: { role: 'TUTOR' } }), []);
  assert.equal(lookup.mock.callCount(), 0);
});

test('tutor lookup also accepts the canonical API user id', async (t) => {
  t.mock.method(TutorProfile, 'findOne', async (filter) => {
    assert.deepEqual(filter, { user_id: 'user1' });
    return { _id: 'profile1' };
  });
  t.mock.method(Classroom, 'countDocuments', async () => 0);
  t.mock.method(Classroom, 'find', (filter) => {
    assert.deepEqual(filter.$or, [{ tutor_profile_id: 'profile1' }, { tutor_profile_id: 'user1' }]);
    return { populate() { return this; }, sort() { return this; }, async lean() { return []; } };
  });
  assert.deepEqual(await getUserClassrooms({ user: { id: 'user1', role: 'TUTOR' } }), []);
});
