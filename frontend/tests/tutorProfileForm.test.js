import { test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

test('profile form marks required inputs and validates item completeness and 50-word bio', async () => {
  const compiled = await build({
    stdin: { resolveDir: process.cwd(), loader: 'jsx', contents: `
      import assert from 'node:assert/strict';
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import TutorProfileForm, { EMPTY_PROFILE_VALUES, countProfileWords, validateProfileForm, toProfileFormValues } from './src/components/tutor/TutorProfileForm.jsx';
      const values = { ...EMPTY_PROFILE_VALUES, headline: 'Tutor', bio: 'About me', address: 'Hanoi',
        experiences: [{ title: 'Teacher', company: 'School', start_date: '2020-01-01', end_date: '2024-01-01' }],
        educations: [{ school: 'University', degree: 'Bachelor', graduation_year: '2024', description: '' }],
        achievements: [{ title: 'Award', description: '' }] };
      const clean = validateProfileForm(values);
      assert.deepEqual(clean.top, {});
      for (const section of ['experiences', 'educations', 'achievements']) {
        assert.deepEqual(clean[section], [{}]);
        for (const field of Object.keys(values[section][0]).filter((field) => field !== 'description')) {
          const invalid = { ...values, [section]: [{ ...values[section][0], [field]: '' }] };
          assert.ok(validateProfileForm(invalid)[section][0][field], section + '.' + field);
        }
      }
      assert.equal(countProfileWords('  '), 0);
      const fifty = Array(50).fill('dạy').join(' \\n\\t ');
      assert.equal(countProfileWords(fifty), 50);
      assert.equal(validateProfileForm({ ...values, bio: fifty }).top.bio, undefined);
      assert.match(validateProfileForm({ ...values, bio: fifty + ' thêm' }).top.bio, /50 words/);
      const html = renderToStaticMarkup(<TutorProfileForm initialValues={values} submitLabel="Save" onSubmit={async () => {}} />);
      assert.equal((html.match(/class="form-required"/g) || []).length, 12);
      assert.equal((html.match(/ required=""/g) || []).length, 12);
      assert.equal((html.match(/\\(optional\\)/g) || []).length, 2);
      assert.match(html, /2\\/50 words/);
      const current = { ...values, experiences: [{ ...values.experiences[0], end_date: 'NOW' }] };
      assert.deepEqual(validateProfileForm(current).experiences, [{}]);
      assert.equal(toProfileFormValues({ ...values, experiences: [{ ...values.experiences[0], end_date: null }] }).experiences[0].end_date, 'NOW');
      const currentHtml = renderToStaticMarkup(<TutorProfileForm initialValues={current} submitLabel="Save" onSubmit={async () => {}} />);
      assert.match(currentHtml, /id="experiences-0-end_date"[^>]*disabled=""/);
      assert.match(currentHtml, /type="checkbox"[^>]*checked=""/);
      assert.match(currentHtml, />Now<\\/span>/);
    ` },
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', write: false,
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
});
