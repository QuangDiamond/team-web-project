import { test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

test('public profile components render tutor and parent API shapes without a browser', async () => {
  const compiled = await build({
    stdin: {
      resolveDir: process.cwd(), loader: 'jsx', contents: `
        import assert from 'node:assert/strict';
        import React from 'react';
        import { renderToStaticMarkup } from 'react-dom/server';
        import { MemoryRouter } from 'react-router-dom';
        import ProfileBackground from './src/components/publicProfile/ProfileBackground.jsx';
        import ProfileIdentity from './src/components/publicProfile/ProfileIdentity.jsx';
        import ProfilePosts from './src/components/publicProfile/ProfilePosts.jsx';
        import ProfileReviews from './src/components/publicProfile/ProfileReviews.jsx';
        const profile = { full_name: 'Test tutor', experiences: [], educations: [], achievements: [], average_rating: null };
        const empty = { items: [], pagination: { page: 1, totalPages: 0 } };
        const tutor = renderToStaticMarkup(<MemoryRouter><ProfileIdentity profile={profile} role="TUTOR" />
          <ProfileBackground profile={profile} /><ProfilePosts list={empty} role="TUTOR" appliedIds={[]} />
          <ProfileReviews list={empty} /></MemoryRouter>);
        assert.match(tutor, /Test tutor/);
        assert.match(tutor, /No ratings yet/);
        assert.match(tutor, /No published posts yet/);
        assert.match(tutor, /No approved reviews yet/);
        const request = { _id: 'request1', title: 'Math lessons', subject_name: 'Math', grade_level: '10', budget: 200000 };
        const parent = renderToStaticMarkup(<MemoryRouter><ProfileIdentity profile={{ full_name: 'Test parent' }} role="PARENT" />
          <ProfilePosts list={{ ...empty, items: [request] }} role="PARENT" onApply={() => {}} appliedIds={['request1']} />
          </MemoryRouter>);
        assert.match(parent, /Test parent/);
        assert.match(parent, /Math lessons/);
        assert.match(parent, /href="\\/tutor\\/requests\\/request1"/);
        assert.match(parent, /disabled=""[^>]*>Applied/);
      `,
    },
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', write: false,
  });
  const module = { exports: {} };
  const run = new Function('require', 'module', 'exports', compiled.outputFiles[0].text);
  run(createRequire(import.meta.url), module, module.exports);
});
