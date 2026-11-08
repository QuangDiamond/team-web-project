import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPlanSchema, updatePlanSchema } from '../../src/common/validator/planSchema.js';
import { createOrderSchema } from '../../src/common/validator/paymentSchema.js';
import { Plan } from '../../src/models/Plan.js';
import { AdminAuditLog } from '../../src/models/AdminAuditLog.js';
import { calculatePlanCharge, createPlan, updatePlan } from '../../src/services/plan.service.js';

const fields = {
  target_role: 'TUTOR', name: 'Premium', monthly_price: 299000, monthly_credits: 50,
  ai_quota: 100, max_classrooms: null, sms_reminders_enabled: true,
  is_active: false, reason: 'Introduce a new plan',
};
const admin = { adminUserId: '507f1f77bcf86cd799439011', ipAddress: '127.0.0.1' };

test('create plan validates names, roles, availability and Free pricing', () => {
  const parsed = createPlanSchema.parse({ ...fields, name: ' Premium ' });
  assert.equal(parsed.name, 'Premium');
  assert.equal(parsed.billing_period, 'MONTHLY');
  assert.equal(parsed.annual_discount_percent, 0);
  const withoutStatus = { ...fields };
  delete withoutStatus.is_active;
  assert.equal(createPlanSchema.parse(withoutStatus).is_active, true);
  for (const invalid of [
    { name: ' ' }, { name: 'x'.repeat(101) }, { target_role: 'ADMIN' },
    { is_active: 'false' }, { monthly_credits: 0 }, { reason: '' },
    { name: 'FREE_DEFAULT', monthly_price: 1 },
  ]) {
    assert.equal(createPlanSchema.safeParse({ ...fields, ...invalid }).success, false);
  }
  assert.equal(createPlanSchema.safeParse({ ...fields, name: 'FREE_DEFAULT', monthly_price: 0 }).success, true);
  assert.equal(createPlanSchema.safeParse({ ...fields, billing_period: 'YEARLY', annual_discount_percent: 15 }).success, true);
  assert.equal(createPlanSchema.safeParse({ ...fields, billing_period: 'MONTHLY', annual_discount_percent: 15 }).success, false);
  assert.equal(createPlanSchema.safeParse({ ...fields, billing_period: 'YEARLY', annual_discount_percent: 100 }).success, false);
  assert.equal(createPlanSchema.safeParse({ ...fields, name: 'FREE_DEFAULT', monthly_price: 0, billing_period: 'YEARLY' }).success, false);
  assert.equal(updatePlanSchema.safeParse({ ...fields, is_active: 'false' }).success, false);
});

test('plan cycle determines one-time charge and annual discount', () => {
  assert.deepEqual(calculatePlanCharge({ monthly_price: '99000', billing_period: 'MONTHLY' }), {
    duration_months: 1,
    amount: 99000,
  });
  assert.deepEqual(calculatePlanCharge({ monthly_price: '99000', billing_period: 'YEARLY', annual_discount_percent: 20 }), {
    duration_months: 12,
    amount: 950400,
  });
  assert.deepEqual(calculatePlanCharge({ monthly_price: '99000', billing_period: 'YEARLY', annual_discount_percent: 0 }), {
    duration_months: 12,
    amount: 1188000,
  });
});

test('plan checkout derives its cycle from the plan instead of requiring duration_months', () => {
  const result = createOrderSchema.safeParse({
    item_type: 'PLAN_UPGRADE',
    plan_id: '507f1f77bcf86cd799439011',
    payment_method: 'VIETQR',
  });
  assert.equal(result.success, true);
});

test('create and edit availability use existing schema and write audit snapshots', async (t) => {
  const audits = [];
  let document;
  t.mock.method(AdminAuditLog, 'create', async (entry) => audits.push(entry));
  t.mock.method(Plan, 'create', async (data) => {
    assert.equal('reason' in data, false);
    document = new Plan(data);
    assert.equal(document.validateSync(), undefined);
    return document;
  });
  const created = await createPlan(createPlanSchema.parse(fields), admin);
  assert.equal(created.name, 'Premium');
  assert.equal(created.monthly_price, 299000);
  assert.equal(created.is_active, false);
  assert.equal(created.billing_period, 'MONTHLY');
  assert.equal(created.annual_discount_percent, 0);
  assert.equal(audits[0].details_json.operation, 'CREATE');
  assert.equal(audits[0].details_json.before, null);
  assert.equal(audits[0].reason, fields.reason);
  assert.equal(audits[0].action, 'UPDATE_PLAN');

  t.mock.method(Plan, 'findById', async () => document);
  t.mock.method(document, 'save', async () => document);
  for (const active of [true, false]) {
    const updated = await updatePlan(String(document._id), updatePlanSchema.parse({ ...fields, is_active: active }), admin);
    assert.equal(updated.is_active, active);
    assert.equal(audits.at(-1).details_json.before.is_active, !active);
    assert.equal(audits.at(-1).details_json.after.is_active, active);
  }
  const yearlyPlan = await updatePlan(String(document._id), updatePlanSchema.parse({
    ...fields,
    name: 'Premium Annual',
    billing_period: 'YEARLY',
    annual_discount_percent: 20,
  }), admin);
  assert.equal(yearlyPlan.billing_period, 'YEARLY');
  assert.equal(yearlyPlan.annual_discount_percent, 20);
  assert.equal(yearlyPlan.name, 'Premium Annual');
  const legacyUpdate = { ...fields };
  delete legacyUpdate.is_active;
  await updatePlan(String(document._id), updatePlanSchema.parse(legacyUpdate), admin);
  assert.equal(document.is_active, false, 'older callers preserve availability');
  assert.equal(document.billing_period, 'YEARLY', 'older callers preserve billing period');
  assert.equal(document.annual_discount_percent, 20, 'older callers preserve annual discount');

  document.name = 'FREE_DEFAULT';
  const count = audits.length;
  await assert.rejects(updatePlan(String(document._id), fields, admin), /Free plan price must be 0/);
  assert.equal(audits.length, count);
});
