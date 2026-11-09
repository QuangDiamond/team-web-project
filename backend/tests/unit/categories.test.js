import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categoryBodySchema } from '../../src/common/validator/categorySchema.js';
import { GradeLevel } from '../../src/models/GradeLevel.js';
import { Subject } from '../../src/models/Subject.js';
import { AdminAuditLog } from '../../src/models/AdminAuditLog.js';
import { TutorPost } from '../../src/models/TutorPost.js';
import { ParentRequest } from '../../src/models/ParentRequest.js';
import { TutorProfile } from '../../src/models/TutorProfile.js';
import { getCategoryModel, saveCategory, deleteCategory } from '../../src/services/category.service.js';

const admin = { id: '507f1f77bcf86cd799439011', ip: '127.0.0.1' };
const data = { name: 'IELTS', sort_order: 13, is_active: true, reason: 'Thêm trình độ' };

test('catalog validates settings and never resolves arbitrary collections', () => {
  assert.equal(getCategoryModel('subjects'), Subject);
  assert.equal(getCategoryModel('grades'), GradeLevel);
  assert.throws(() => getCategoryModel('users'), /Category type not found/);
  for (const invalid of [{ name: '' }, { sort_order: -1 }, { is_active: 'true' }, { reason: '' }]) {
    assert.equal(categoryBodySchema.safeParse({ ...data, ...invalid }).success, false);
  }
});

test('admin can add IELTS and TOEIC levels and records the audit reason', async (t) => {
  const audits = [];
  t.mock.method(GradeLevel, 'findOne', () => ({ collation: async () => null }));
  t.mock.method(GradeLevel.prototype, 'save', async function () {
    assert.equal(this.validateSync(), undefined);
    return this;
  });
  t.mock.method(AdminAuditLog, 'create', async (entry) => audits.push(entry));
  for (const name of ['IELTS', 'TOEIC', 'Lớp 1']) {
    const result = await saveCategory('grades', null, { ...data, name }, admin);
    assert.equal(result.name, name);
  }
  assert.equal(audits.length, 3);
  assert.equal(audits[0].reason, data.reason);
  assert.equal(audits[0].details_json.operation, 'CREATE');
  await assert.rejects(saveCategory('grades', null, { ...data, name: 'x'.repeat(51) }, admin), /50/);
});

test('used category cannot be deleted, while unused category is deleted with audit', async (t) => {
  t.mock.method(TutorProfile, 'exists', async () => null);
  const item = { _id: '507f1f77bcf86cd799439012', name: 'IELTS' };
  t.mock.method(GradeLevel, 'findById', () => ({ lean: async () => item }));
  const post = t.mock.method(TutorPost, 'exists', async (filter) => {
    assert.deepEqual(filter, { grade_level: 'IELTS' });
    return { _id: 'post' };
  });
  t.mock.method(ParentRequest, 'exists', async () => null);
  const remove = t.mock.method(GradeLevel, 'deleteOne', async () => ({ deletedCount: 1 }));
  const audit = t.mock.method(AdminAuditLog, 'create', async () => ({}));
  await assert.rejects(deleteCategory('grades', item._id, 'Remove', admin), /đang được sử dụng/);
  assert.equal(remove.mock.callCount(), 0);
  post.mock.mockImplementation(async () => null);
  assert.deepEqual(await deleteCategory('grades', item._id, 'Unused', admin), { deleted: true });
  assert.equal(remove.mock.callCount(), 1);
  assert.equal(audit.mock.calls[0].arguments[0].details_json.operation, 'DELETE');
});

test('used names cannot be changed; availability and ordering can still be edited', async (t) => {
  t.mock.method(TutorProfile, 'exists', async () => null);
  const item = new GradeLevel({ name: data.name, sort_order: data.sort_order, is_active: data.is_active, _id: '507f1f77bcf86cd799439012' });
  t.mock.method(GradeLevel, 'findById', async () => item);
  t.mock.method(GradeLevel, 'findOne', () => ({ collation: async () => null }));
  t.mock.method(TutorPost, 'exists', async () => ({ _id: 'post' }));
  t.mock.method(ParentRequest, 'exists', async () => null);
  const save = t.mock.method(GradeLevel.prototype, 'save', async function () { return this; });
  t.mock.method(AdminAuditLog, 'create', async () => ({}));
  await assert.rejects(saveCategory('grades', String(item._id), { ...data, name: 'TOEIC' }, admin), /đang được sử dụng/);
  assert.equal(save.mock.callCount(), 0);
  const result = await saveCategory('grades', String(item._id), { ...data, is_active: false, sort_order: 20 }, admin);
  assert.equal(result.is_active, false);
  assert.equal(result.sort_order, 20);
});
