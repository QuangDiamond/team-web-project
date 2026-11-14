import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createClassMaterialSchema,
  updateClassMaterialSchema,
} from '../../src/common/validator/classMaterialSchema.js';

test('class material PATCH accepts individual metadata fields', () => {
  assert.deepEqual(updateClassMaterialSchema.parse({ title: 'Updated title' }), {
    title: 'Updated title',
  });
  assert.deepEqual(updateClassMaterialSchema.parse({ topic_id: '' }), {
    topic_id: null,
  });
});

test('class material PATCH rejects empty or unknown fields', () => {
  assert.equal(updateClassMaterialSchema.safeParse({}).success, false);
  assert.equal(updateClassMaterialSchema.safeParse({ title: 'Title', unknown: true }).success, false);
});

test('class material create keeps requiring complete metadata', () => {
  assert.equal(createClassMaterialSchema.safeParse({ title: 'Title' }).success, false);
});