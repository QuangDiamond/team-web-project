import { test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

test('password forms validate BR-01 and render recovery, regular and Google-only states', async () => {
  const compiled = await build({
    stdin: { resolveDir: process.cwd(), loader: 'jsx', contents: `
      import assert from 'node:assert/strict';
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { MemoryRouter } from 'react-router-dom';
      import { validateNewPassword } from './src/utils/passwordValidators.js';
      import ChangePassword from './src/pages/dashboard/ChangePassword.jsx';
      import ForgotPassword from './src/pages/auth/ForgotPassword.jsx';
      import ResetPassword from './src/pages/auth/ResetPassword.jsx';
      import { ADMIN_MENU, STUDENT_MENU, PARENT_MENU, TUTOR_MENU } from './src/constants/dashboardMenus.js';
      const good = { new_password: 'NewPassword123', confirm_password: 'NewPassword123' };
      assert.deepEqual(validateNewPassword(good), { new_password: '', confirm_password: '' });
      for (const password of ['', 'short', 'ALLUPPER123', 'alllower123', 'NoDigitsHere', 'x'.repeat(65)]) {
        assert.ok(validateNewPassword({ ...good, new_password: password }).new_password);
      }
      assert.ok(validateNewPassword({ ...good, confirm_password: 'different' }).confirm_password);
      const render = (component, path = '/') => renderToStaticMarkup(<MemoryRouter initialEntries={[path]}>{component}</MemoryRouter>);
      globalThis.__passwordTestUser = { id: 'user1', role: 'TUTOR', has_password: true };
      const regular = render(<ChangePassword />);
      assert.match(regular, /id="current_password"/);
      assert.match(regular, /autoComplete="current-password"/i);
      globalThis.__passwordTestUser = { id: 'user1', role: 'TUTOR', has_password: false };
      const google = render(<ChangePassword />);
      assert.doesNotMatch(google, /id="current_password"/);
      assert.match(google, /Đặt mật khẩu/);
      const missing = render(<ResetPassword />, '/reset-password');
      assert.match(missing, /không hợp lệ hoặc đã hết hạn/);
      assert.doesNotMatch(missing, /id="new_password"/);
      const reset = render(<ResetPassword />, '/reset-password?token=' + 'a'.repeat(64));
      assert.match(reset, /id="new_password"/);
      assert.match(reset, /id="confirm_password"/);
      const forgot = render(<ForgotPassword />);
      assert.match(forgot, /id="email"/);
      assert.match(forgot, /Gửi liên kết đặt lại mật khẩu/);
      for (const [role, menu] of Object.entries({ admin: ADMIN_MENU, student: STUDENT_MENU, parent: PARENT_MENU, tutor: TUTOR_MENU })) {
        assert.ok(menu.groups.some((group) => group.items.some((item) => item.to === '/' + role + '/change-password')));
      }
      delete globalThis.__passwordTestUser;
    ` },
    plugins: [{ name: 'password-page-services', setup(build) {
      build.onResolve({ filter: /\/hooks\/useAuth$|\/services\/authService$/ }, (args) => ({ path: args.path, namespace: 'password-mock' }));
      build.onLoad({ filter: /.*/, namespace: 'password-mock' }, () => ({ contents: `
        export const useAuth = () => ({ user: globalThis.__passwordTestUser, changePassword: async () => {}, resetPassword: async () => {} });
        export const forgotPassword = async () => ({});
      ` }));
    } }],
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', write: false,
    loader: { '.css': 'empty' },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
});
