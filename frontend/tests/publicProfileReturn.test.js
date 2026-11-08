import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clearPublicProfileReturn, getPublicProfileReturn, rememberPublicProfile } from '../src/utils/publicProfileReturn.js';

test('profile return supports registration round trips and rejects external redirects', (t) => {
  const values = new Map();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'sessionStorage', original);
    else delete globalThis.sessionStorage;
  });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  } });
  assert.equal(getPublicProfileReturn(), null);
  const path = '/tutors/507f1f77bcf86cd799439011';
  rememberPublicProfile(path);
  assert.equal(getPublicProfileReturn(), path);
  assert.equal(getPublicProfileReturn(), path, 'rendering a redirect must not consume its destination');
  clearPublicProfileReturn();
  assert.equal(getPublicProfileReturn(), null);
  for (const invalid of ['https://example.com', '//example.com', '/admin/users', '/tutors/invalid']) {
    rememberPublicProfile(invalid);
    assert.equal(getPublicProfileReturn(), null);
  }
});

test('profile return works safely when browser storage is unavailable', () => {
  assert.doesNotThrow(() => rememberPublicProfile('/tutors/507f1f77bcf86cd799439011'));
  assert.equal(getPublicProfileReturn(), null);
  assert.doesNotThrow(clearPublicProfileReturn);
});
