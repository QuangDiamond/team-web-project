import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { getDashboardStats, exportStatsReport } from '../../src/services/stats.service.js';
import { User } from '../../src/models/User.js';
import { ParentRequest } from '../../src/models/ParentRequest.js';
import { ApplyRequest } from '../../src/models/ApplyRequest.js';
import { TutorInvitation } from '../../src/models/TutorInvitation.js';
import { Conversation } from '../../src/models/Conversation.js';
import { TutoringAgreement } from '../../src/models/TutoringAgreement.js';
import { PaymentOrder } from '../../src/models/PaymentOrder.js';
import { Classroom } from '../../src/models/Classroom.js';
import { AiSuggestion } from '../../src/models/AiSuggestion.js';
import { ContentReport } from '../../src/models/ContentReport.js';
import { AdminAuditLog } from '../../src/models/AdminAuditLog.js';
import { parseQuery } from '../../src/common/utils/pagination.js';
import { statsQuerySchema } from '../../src/common/validator/statsSchema.js';
import { statsRoutes } from '../../src/routes/stats.routes.js';

const admin = { id: 'admin1', role: 'ADMIN' };
const now = new Date('2026-11-09T12:00:00Z');
const day = 86400000;
const decimal = (value) => mongoose.Types.Decimal128.fromString(String(value));

function mockDatabase(t, { orders = [], users = [], agreements = [] } = {}) {
  const find = (data) => ({ select() { return this; }, async lean() { return data; } });
  t.mock.method(User, 'find', () => find(users));
  t.mock.method(User, 'countDocuments', async (filter) => users.filter((user) =>
    Object.entries(filter).every(([key, value]) => user[key] === value)).length);
  t.mock.method(PaymentOrder, 'find', (filter) => {
    assert.equal(filter.status, 'SUCCESS');
    return find(orders.filter((order) => order.status === filter.status));
  });
  t.mock.method(TutoringAgreement, 'find', () => find(agreements));
  for (const model of [ParentRequest, ApplyRequest, TutorInvitation, Conversation, TutoringAgreement, Classroom, AiSuggestion, ContentReport, AdminAuditLog]) {
    t.mock.method(model, 'countDocuments', async () => 0);
  }
}

test('statistics never fabricate current-period revenue or growth from historical totals', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now });
  mockDatabase(t, {
    orders: [
      { status: 'SUCCESS', amount: decimal(199000), item_type: 'PLAN_UPGRADE', paid_at: new Date('2020-01-01') },
      { status: 'FAILED', amount: decimal(50000), item_type: 'CREDIT_PACK', paid_at: now },
    ],
    users: [
      { role: 'PARENT', account_status: 'SUSPENDED', created_at: new Date('2020-01-01') },
      { role: 'ADMIN', account_status: 'ACTIVE', created_at: new Date('2020-01-01') },
    ],
  });
  const stats = await getDashboardStats(admin, '30d');
  assert.equal(stats.kpis.totalGmv, 199000);
  assert.equal(stats.kpis.creditPackRevenue, 0);
  assert.equal(stats.kpis.activeParents, 0);
  assert.ok(stats.trends.revenue.every((value) => value === 0));
  assert.ok(stats.trends.userGrowth.every((value) => value === 0));
  assert.equal(stats.roleDistribution.reduce((sum, item) => sum + item.count, 0), 2);
  assert.equal(stats.roleDistribution.reduce((sum, item) => sum + item.percent, 0), 100);
  const report = await exportStatsReport(admin, '30d');
  assert.equal(report.data.kpis.totalGmv, 199000);
  assert.ok(report.filename.endsWith('.json'));
});

test('every supported period covers the complete window and counts payment boundaries once', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now });
  for (const [period, days] of Object.entries({ '7d': 7, '30d': 30, '90d': 90, '1y': 365 })) {
    await t.test(period, async (context) => {
      const start = new Date(now.getTime() - days * day);
      mockDatabase(context, { orders: [
        { status: 'SUCCESS', amount: decimal(100), item_type: 'CREDIT_PACK', paid_at: start },
        { status: 'SUCCESS', amount: decimal(200), item_type: 'CREDIT_PACK', paid_at: now },
        { status: 'SUCCESS', amount: decimal(400), item_type: 'CREDIT_PACK', paid_at: new Date(start.getTime() - 1) },
        { status: 'SUCCESS', amount: decimal(800), item_type: 'CREDIT_PACK', paid_at: new Date(now.getTime() + 1) },
        { status: 'SUCCESS', amount: decimal(1600), item_type: 'CREDIT_PACK', created_at: now, paid_at: null },
      ] });
      const stats = await getDashboardStats(admin, period);
      assert.equal(stats.trends.revenue.reduce((sum, amount) => sum + amount, 0), 300);
      assert.equal(stats.kpis.totalGmv, 3100);
    });
  }
});

test('admin statistics reject other roles before querying the database', async () => {
  await assert.rejects(getDashboardStats({ role: 'TUTOR' }), { status: 403 });
});

test('stats query validates supported periods and protected routes enforce admin access', () => {
  assert.deepEqual(parseQuery(statsQuerySchema, {}), { period: '30d' });
  assert.throws(() => parseQuery(statsQuerySchema, { period: 'invalid' }), { status: 422 });
  for (const path of ['/', '/export']) {
    const route = statsRoutes.stack.find((layer) => layer.route?.path === path).route;
    assert.equal(route.stack[0].handle.name, 'authentication');
    let rejected;
    route.stack[1].handle({ user: { role: 'TUTOR' } }, {}, (error) => { rejected = error; });
    assert.equal(rejected.status, 403);
  }
});
