import test from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

test('material create and replace preserve multipart files while ordinary requests stay JSON', async () => {
  const compiled = await build({
    stdin: { resolveDir: process.cwd(), loader: 'js', contents: `
      import assert from 'node:assert/strict';
      import api from './src/services/api.js';
      import { createClassMaterial, updateClassMaterial } from './src/services/classroomService.js';
      export async function check() {
        const originalAdapter = api.defaults.adapter;
        const requests = [];
        api.defaults.adapter = async (config) => {
          requests.push(config);
          return { data: { success: 1, data: {} }, status: 200, statusText: 'OK', headers: {}, config };
        };
        try {
          const form = new FormData();
          form.append('title', 'Bài học');
          form.append('material_type', 'DOCUMENT');
          form.append('visibility', 'ALL_MEMBERS');
          form.append('file', new Blob(['%PDF-test'], { type: 'application/pdf' }), 'lesson.pdf');
          await createClassMaterial('class-id', form);
          await updateClassMaterial('class-id', 'material-id', form);
          assert.deepEqual(requests.map(item => item.method), ['post', 'patch']);
          for (const config of requests) {
            assert.equal(config.data, form);
            assert.notEqual(config.headers.get('Content-Type'), 'application/json');
            const request = new Request('http://localhost/upload', { method: config.method.toUpperCase(), body: config.data });
            assert.ok(request.headers.get('Content-Type').startsWith('multipart/form-data; boundary='));
            const received = await request.formData();
            assert.equal(received.get('title'), 'Bài học');
            assert.equal(received.get('file').name, 'lesson.pdf');
            assert.equal(await received.get('file').text(), '%PDF-test');
          }
          const link = new FormData();
          link.append('material_type', 'LINK');
          link.append('file_url', 'https://example.com/lesson');
          await createClassMaterial('class-id', link);
          assert.equal(requests[2].data, link);
          await api.post('/json-check', { title: 'Ordinary JSON request' });
          assert.equal(requests[3].headers.get('Content-Type'), 'application/json');
          assert.deepEqual(JSON.parse(requests[3].data), { title: 'Ordinary JSON request' });
        } finally {
          api.defaults.adapter = originalAdapter;
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
