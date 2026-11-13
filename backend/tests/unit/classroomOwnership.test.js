import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getUserClassrooms } from '../../src/services/classroom.service.js';
import { Classroom } from '../../src/models/Classroom.js';
import { env } from '../../src/config/environment.js';

test('a tutor without classrooms never falls back to listing all classrooms in development', async (t) => {
  const previous = env.nodeEnv;
  env.nodeEnv = 'development';
  try {
    t.mock.method(Classroom, 'countDocuments', async () => 0);
    t.mock.method(Classroom, 'find', (filter) => {
      assert.deepEqual(filter.$or, [{ tutor_profile_id: 'profile1' }, { tutor_profile_id: 'user1' }]);
      return {
        populate() {
          return this;
        },
        sort() {
          return this;
        },
        async lean() {
          return [];
        },
      };
    });
    assert.deepEqual(
      await getUserClassrooms({
        user: { _id: 'user1', role: 'TUTOR' },
        tutorProfile: { _id: 'profile1' },
      }),
      []
    );
  } finally {
    env.nodeEnv = previous;
  }
});
