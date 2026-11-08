import { test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

test('admin panels show real values, Lucide icons, zero revenue and accessible actions', async () => {
  const compiled = await build({
    stdin: { resolveDir: process.cwd(), loader: 'jsx', contents: String.raw`
      import assert from 'node:assert/strict';
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import StatsCharts from './src/components/adminStats/StatsCharts.jsx';
      import StatsOverview from './src/components/adminStats/StatsOverview.jsx';
      import ReportCard from './src/components/moderation/ReportCard.jsx';
      import ResolutionDialog from './src/components/moderation/ResolutionDialog.jsx';
      import NotificationCard from './src/components/notifications/NotificationCard.jsx';
      import { statsService } from './src/services/statsService.js';
      import api from './src/services/api.js';
      module.exports = async () => {
      const requests = [];
      api.defaults.adapter = async (config) => {
        requests.push({ url: config.url, period: config.params.period });
        return { data: { success: 1, data: { kpis: { totalUsers: 321 } } }, status: 200, headers: {}, config };
      };
      assert.equal((await statsService.getStats('90d')).kpis.totalUsers, 321);
      await statsService.exportReport('7d');
      assert.deepEqual(requests, [{ url: '/stats/v1', period: '90d' }, { url: '/stats/v1/export', period: '7d' }]);
      const chart = renderToStaticMarkup(<StatsCharts periodLabel="7 ngày gần nhất" trends={{ labels: ['09/11'], revenue: [0], userGrowth: [0], connections: [0] }} roles={[{ role: 'Quản trị viên', count: 1, percent: 100 }]} />);
      assert.match(chart, /Chưa có doanh thu trong kỳ/);
      assert.doesNotMatch(chart, /admin-stats-chart-bar/);
      assert.match(chart, /Quản trị viên/);
      const metrics = renderToStaticMarkup(<StatsOverview kpis={{ totalUsers: 321, activeParents: 3, activeTutors: 4, activeStudents: 5, totalGmv: 123456, confirmedConnections: 7, conversionRate: 12, activeClassrooms: 9, aiQuotaUtilized: 11 }} />);
      assert.match(metrics, /321/);
      assert.match(metrics, /123.456/);
      assert.doesNotMatch(metrics, /18,4%|50,7%/);
      const report = { _id: 'report1', target_type: 'POST', severity: 'CRITICAL', status: 'PENDING', reason: 'Spam', created_at: '2026-11-09T12:00:00Z' };
      const card = renderToStaticMarkup(<ReportCard report={report} onResolve={() => {}} />);
      assert.match(card, /lucide/);
      assert.match(card, /Xử lý báo cáo/);
      assert.doesNotMatch(card, /\p{Extended_Pictographic}/u);
      const dialog = renderToStaticMarkup(<ResolutionDialog report={report} onClose={() => {}} onResolved={() => {}} />);
      assert.match(dialog, /role="dialog"/);
      assert.match(dialog, /name="resolutionAction"/);
      assert.match(dialog, /id="moderation-note"/);
      const notification = renderToStaticMarkup(<NotificationCard item={{ _id: 'note1', title: 'Tin mới', body: 'Nội dung', category: 'APPLICATION', is_read: false, created_at: '2026-11-09T12:00:00Z', deepLink: '/admin/dashboard', delivery_logs: [{ channel: 'EMAIL', status: 'FAILED' }] }} onOpen={() => {}} onRead={() => {}} onDelete={() => {}} />);
      assert.match(notification, /Ứng tuyển/);
      assert.match(notification, /Gửi thất bại/);
      assert.match(notification, /aria-label="Xóa thông báo: Tin mới"/);
      assert.doesNotMatch(notification, /\p{Extended_Pictographic}/u);
      };
    ` },
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', write: false,
    define: { 'import.meta.env': '{}' },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
  await module.exports();
});
