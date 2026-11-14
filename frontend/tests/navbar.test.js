import { test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

test('navbar highlights only the selected section and links to the parent public profile', async () => {
  const compiled = await build({
    stdin: { resolveDir: process.cwd(), loader: 'jsx', contents: `
      import assert from 'node:assert/strict';
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { MemoryRouter } from 'react-router-dom';
      import Layout from './src/layouts/Layout.jsx';
      const render = (path) => renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><Layout /></MemoryRouter>);
      for (const path of ['/', '/#features', '/#how-it-works', '/tutors', '/requests', '/profile']) {
        const nav = render(path).match(/<div class="nav-links">([\\s\\S]*?)<\\/div>/)[1];
        const active = [...nav.matchAll(/<a[^>]*class="nav-link active"[^>]*href="([^"]+)"/g)];
        assert.equal(active.length, path === '/profile' ? 0 : 1, path);
        if (active.length) assert.equal(active[0][1], path);
      }
      const page = render('/');
      assert.match(page, /href="\\/parents\\/parent1"/);
      assert.match(page, /title="Test parent"/);
      globalThis.__navbarUser = { _id: 'tutor1', role: 'TUTOR', full_name: 'Test tutor' };
      const tutor = render('/');
      assert.match(tutor, /href="\\/tutor\\/profile"/);
      assert.doesNotMatch(tutor, /tutors\\/undefined/);
      globalThis.__navbarUser = { _id: 'parent2', role: 'PARENT', full_name: 'Second parent' };
      assert.match(render('/'), /href="\\/parents\\/parent2"/);
      delete globalThis.__navbarUser;
    ` },
    plugins: [{ name: 'navbar-services', setup(build) {
      build.onResolve({ filter: /\/hooks\/useAuth$|\/services\/(notificationService|tutorProfileService)$/ },
        (args) => ({ path: args.path, namespace: 'navbar-mock' }));
      build.onLoad({ filter: /.*/, namespace: 'navbar-mock' }, () => ({ contents: `
        export const useAuth = () => ({ user: globalThis.__navbarUser || { id: 'parent1', role: 'PARENT', full_name: 'Test parent' }, logout: async () => {} });
        export const getUnreadCount = async () => ({ data: { unreadCount: 0 } });
        export const notificationService = { getNotifications: async () => ({ data: { items: [] } }), markAsRead: async () => {}, markAllAsRead: async () => {} };
        export const getMyProfile = async () => ({ data: { profile: null } });
      ` }));
    } }],
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', write: false,
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
});
