import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildActivatedSubscription,
  hasConflictingScheduledPlan,
  schedulePlanPurchase,
} from '../../src/services/subscription.service.js';

const now = new Date('2026-11-15T03:00:00.000Z');
const monthlyPro = '507f1f77bcf86cd799439011';
const yearlyPro = '507f1f77bcf86cd799439012';

const activeMonthly = {
  plan_id: monthlyPro, status: 'ACTIVE', start_date: new Date('2026-11-01T00:00:00.000Z'),
  expires_at: new Date('2026-12-01T00:00:00.000Z'), ai_quota_used: 7,
  ai_quota_reset_at: new Date('2026-12-01T00:00:00.000Z'), created_at: new Date('2026-11-01T00:00:00.000Z'),
  next_plan_id: null, next_start_date: null, next_expires_at: null,
};

test('free or expired subscription gets the new plan immediately', () => {
  const freeSubscription = { plan_id: 'free', status: 'ACTIVE', expires_at: null };
  for (const current of [null, freeSubscription, { ...activeMonthly, expires_at: new Date('2026-11-01T00:00:00.000Z') }]) {
    const purchase = schedulePlanPurchase(current, monthlyPro, 1, now);
    assert.equal(purchase.period.is_scheduled, false);
    assert.equal(purchase.subscription.plan_id, monthlyPro);
    assert.equal(purchase.subscription.start_date, now);
    assert.equal(purchase.subscription.expires_at.toISOString(), '2026-12-15T03:00:00.000Z');
    assert.equal(purchase.subscription.ai_quota_used, 0);
    assert.equal(purchase.subscription.next_plan_id, null);
  }
});

test('buying while a paid plan is active keeps the current plan and schedules the new one', () => {
  const purchase = schedulePlanPurchase(activeMonthly, yearlyPro, 12, now);
  assert.equal(purchase.period.is_scheduled, true);
  assert.equal(purchase.subscription.plan_id, monthlyPro);
  assert.equal(purchase.subscription.expires_at, activeMonthly.expires_at);
  assert.equal(purchase.subscription.ai_quota_used, 7);
  assert.equal(purchase.subscription.next_plan_id, yearlyPro);
  assert.equal(purchase.subscription.next_start_date, activeMonthly.expires_at);
  assert.equal(purchase.subscription.next_expires_at.toISOString(), '2027-12-01T00:00:00.000Z');
  assert.equal(purchase.period.start_date, activeMonthly.expires_at);
});

test('buying the scheduled plan again extends it, another plan is rejected', () => {
  const scheduled = schedulePlanPurchase(activeMonthly, yearlyPro, 12, now).subscription;
  const extended = schedulePlanPurchase(scheduled, yearlyPro, 12, now);
  assert.equal(extended.subscription.next_start_date, activeMonthly.expires_at);
  assert.equal(extended.subscription.next_expires_at.toISOString(), '2028-12-01T00:00:00.000Z');
  assert.equal(extended.period.start_date.toISOString(), '2027-12-01T00:00:00.000Z');

  assert.equal(hasConflictingScheduledPlan(scheduled, monthlyPro, now), true);
  assert.equal(hasConflictingScheduledPlan(scheduled, yearlyPro, now), false);
  assert.equal(schedulePlanPurchase(scheduled, monthlyPro, 1, now), null);
});

test('activating the scheduled plan resets AI quota and clears the queue', () => {
  const scheduled = schedulePlanPurchase(activeMonthly, yearlyPro, 12, now).subscription;
  const activated = buildActivatedSubscription(scheduled);
  assert.equal(activated.plan_id, yearlyPro);
  assert.equal(activated.start_date, activeMonthly.expires_at);
  assert.equal(activated.expires_at.toISOString(), '2027-12-01T00:00:00.000Z');
  assert.equal(activated.ai_quota_used, 0);
  assert.equal(activated.ai_quota_reset_at.toISOString(), '2027-01-01T00:00:00.000Z');
  assert.equal(activated.next_plan_id, null);
  assert.equal(activated.next_start_date, null);
});
