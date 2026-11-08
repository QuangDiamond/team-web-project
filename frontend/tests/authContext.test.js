import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { build } from 'esbuild';

test('dashboard keeps the same auth context when the auth module reloads', async () => {
  const authPath = path.resolve('src/hooks/useAuth.jsx');
  const authSource = await readFile(authPath, 'utf8');
  const compiled = await build({
    stdin: { resolveDir: process.cwd(), loader: 'jsx', contents: `
      import assert from 'node:assert/strict';
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { MemoryRouter } from 'react-router-dom';
      import { AuthProvider as OriginalProvider } from 'auth-before-reload';
      import { AuthProvider as RefreshedProvider } from 'auth-after-reload';
      import DashboardSidebar from './src/components/layout/DashboardSidebar.jsx';
      import { TUTOR_MENU } from './src/constants/dashboardMenus.js';

      const sidebar = <MemoryRouter initialEntries={['/tutor/dashboard']}>
        <DashboardSidebar menu={TUTOR_MENU} isOpen={true} onClose={() => {}} />
      </MemoryRouter>;
      assert.throws(() => renderToStaticMarkup(sidebar), /useAuth must be used within an AuthProvider/);
      assert.match(renderToStaticMarkup(<RefreshedProvider>{sidebar}</RefreshedProvider>), /dashboard-sidebar/);
      const html = renderToStaticMarkup(<OriginalProvider>{sidebar}</OriginalProvider>);
      assert.match(html, /dashboard-nav-link is-active/);
      assert.match(html, /href="\\/tutor\\/dashboard"/);
    ` },
    plugins: [{ name: 'auth-module-reload', setup(builder) {
      builder.onResolve({ filter: /^auth-(before|after)-reload$/ }, (args) => ({
        path: args.path, namespace: 'auth-reload',
      }));
      builder.onResolve({ filter: /\/hooks\/useAuth(?:\.jsx)?$/ }, () => ({
        path: 'auth-after-reload', namespace: 'auth-reload',
      }));
      builder.onLoad({ filter: /.*/, namespace: 'auth-reload' }, () => ({
        contents: authSource, loader: 'jsx', resolveDir: path.dirname(authPath),
      }));
    } }],
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', write: false,
    define: { 'import.meta.env': '{}' },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
});
