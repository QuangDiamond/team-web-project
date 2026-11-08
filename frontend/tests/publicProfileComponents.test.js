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
        import ProfileSections from './src/components/publicProfile/ProfileSections.jsx';
        import ProfileRates from './src/components/publicProfile/ProfileRates.jsx';
        const profile = { full_name: 'Test tutor', experiences: [], educations: [], achievements: [], average_rating: null };
        const empty = { items: [], pagination: { page: 1, totalPages: 0 } };
        const tutor = renderToStaticMarkup(<MemoryRouter><ProfileIdentity profile={profile} role="TUTOR" />
          <ProfileBackground profile={profile} /><ProfilePosts list={empty} role="TUTOR" appliedIds={[]} />
          <ProfileReviews list={empty} /></MemoryRouter>);
        assert.match(tutor, /Test tutor/);
        assert.match(tutor, /Chưa có đánh giá/);
        assert.match(tutor, /Chưa có bài đăng đã xuất bản/);
        assert.match(tutor, /Chưa có đánh giá được duyệt/);
        const selected = renderToStaticMarkup(<ProfileSections activeSection="reviews" onSectionChange={() => {}} reviewCount={12}>
          <ProfileReviews list={{ ...empty, items: [{ _id: 'review1', rating: 4, comment: 'Useful lessons' }] }} />
        </ProfileSections>);
        assert.match(selected, /id="profile-section-reviews"[^>]*aria-pressed="true"/);
        assert.match(selected, /aria-labelledby="profile-section-reviews"/);
        assert.match(selected, /4 trên 5 sao/);
        assert.match(selected, /Useful lessons/);
        const rateCard = renderToStaticMarkup(<ProfileRates posts={[{ _id: 'post1', subject_name: 'Toán', grade_level: 'Lớp 9', price: 250000 }]} onViewSchedule={() => {}} />);
        assert.match(rateCard, /250.000/);
        assert.match(rateCard, /Toán/);
        assert.equal(renderToStaticMarkup(<ProfileRates posts={[]} />), '');
        const request = { _id: 'request1', title: 'Math lessons', subject_name: 'Math', grade_level: '10', budget: 200000 };
        const parent = renderToStaticMarkup(<MemoryRouter><ProfileIdentity profile={{ full_name: 'Test parent' }} role="PARENT" />
          <ProfilePosts list={{ ...empty, items: [request] }} role="PARENT" onApply={() => {}} appliedIds={['request1']} />
          </MemoryRouter>);
        assert.match(parent, /Test parent/);
        assert.match(parent, /Math lessons/);
        assert.match(parent, /href="\\/tutor\\/requests\\/request1"/);
        assert.match(parent, /disabled=""[^>]*>Đã ứng tuyển/);
      `,
    },
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', write: false,
  });
  const module = { exports: {} };
  const run = new Function('require', 'module', 'exports', compiled.outputFiles[0].text);
  run(createRequire(import.meta.url), module, module.exports);
});
