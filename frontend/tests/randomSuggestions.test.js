import test from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

test('random suggestions sample all matching pages without duplicates and handle small or failed lists', async () => {
  const compiled = await build({
    stdin: { resolveDir: process.cwd(), loader: 'js', contents: `
      import assert from 'node:assert/strict';
      import api from './src/services/api.js';
      import { getRandomSuggestedRequests } from './src/services/tutorRequestService.js';
      export async function check() {
        const originalGet = api.get;
        const originalRandom = Math.random;
        try {
          const calls = [];
          api.get = async (url, { params }) => {
            assert.equal(url, '/tutor-requests/v1/suggestions');
            assert.equal(params.limit, 100);
            calls.push(params.page);
            const ids = params.page === 1 ? ['a', 'b', 'c', 'd'] : ['d', 'e', 'f', 'g'];
            return { data: { items: ids.map(_id => ({ _id })), pagination: { totalPages: 2 } } };
          };
          Math.random = () => 0.999;
          const result = await getRandomSuggestedRequests();
          assert.deepEqual(calls, [1, 2]);
          assert.equal(result.data.items.length, 3);
          assert.equal(new Set(result.data.items.map(item => item._id)).size, 3);
          assert.equal(result.data.items[0]._id, 'g');
          Math.random = () => 0;
          const nextVisit = await getRandomSuggestedRequests();
          assert.notDeepEqual(nextVisit.data.items, result.data.items);
          api.get = async () => ({ data: { items: [], hint: 'Update profile', pagination: { totalPages: 0 } } });
          const empty = await getRandomSuggestedRequests();
          assert.deepEqual(empty.data.items, []);
          assert.equal(empty.data.hint, 'Update profile');
          api.get = async () => ({ data: { items: [{ _id: 'only' }], pagination: { totalPages: 1 } } });
          assert.equal((await getRandomSuggestedRequests()).data.items.length, 1);
          api.get = async () => { throw new Error('Network error'); };
          await assert.rejects(getRandomSuggestedRequests(), /Network error/);
        } finally {
          api.get = originalGet;
          Math.random = originalRandom;
        }
      }
    ` },
    define: { 'import.meta.env': '{}' },
    bundle: true, platform: 'node', format: 'cjs', write: false,
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
  await module.exports.check();
});
