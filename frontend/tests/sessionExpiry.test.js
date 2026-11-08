import { test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

test('401 from protected APIs clears the session; public auth errors keep their own UI handling', async () => {
  const compiled = await build({
    stdin: { resolveDir: process.cwd(), contents: `
      import assert from 'node:assert/strict';
      import api, { setAccountLockedHandler, setSessionExpiredHandler } from './src/services/api.js';
      module.exports = async () => {
        let expired = 0;
        let locked = 0;
        setSessionExpiredHandler(() => expired++);
        setAccountLockedHandler(() => locked++);
        const reject = api.interceptors.response.handlers[0].rejected;
        for (const url of ['/auth/v1/login', '/auth/v1/google/complete', '/auth/v1/reset-password']) {
          await assert.rejects(reject({ config: { url }, response: { status: 401, data: { message: 'Invalid' } } }));
        }
        assert.equal(expired, 0);
        for (const url of ['/auth/v1/me', '/auth/v1/change-password', '/payment/v1/orders']) {
          await assert.rejects(reject({ config: { url }, response: { status: 401, data: {} } }));
        }
        assert.equal(expired, 3);
        await assert.rejects(reject({ config: { url: '/admin/v1/users' }, response: { status: 403, data: { message: 'Forbidden' } } }));
        assert.equal(locked, 0);
        await assert.rejects(reject({ config: { url: '/auth/v1/me' }, response: { status: 403, data: { message: 'Your account has been suspended or banned' } } }));
        assert.equal(locked, 1);
        assert.equal(expired, 3);
        await assert.rejects(reject({ config: { url: '/auth/v1/login' }, response: { status: 403, data: {
          message: 'Account not verified', errors: { email: ['Email is required'] },
        } } }), (error) => {
          assert.equal(error.rawMessage, 'Account not verified');
          assert.equal(error.message, 'Tài khoản chưa xác thực email.');
          assert.deepEqual(error.errors, { email: ['Vui lòng nhập email.'] });
          return true;
        });
        const payload = { message: 'Get users successfully!', data: { full_name: 'English Name', role: 'TUTOR' } };
        const localized = api.interceptors.response.handlers[0].fulfilled({ data: payload });
        assert.equal(localized.message, 'Thao tác thành công.');
        assert.deepEqual(localized.data, { full_name: 'English Name', role: 'TUTOR' });
        setSessionExpiredHandler(null);
        setAccountLockedHandler(null);
      };
    ` },
    bundle: true, platform: 'node', format: 'cjs', write: false,
    define: { 'import.meta.env': '{}' },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
  await module.exports();
});
