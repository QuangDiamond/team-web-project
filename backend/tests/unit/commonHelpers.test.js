import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import { responseCommon } from '../../src/common/response.js';
import { escapeHtml } from '../../src/common/utils/html.js';
import { parseQuery } from '../../src/common/utils/pagination.js';
import { toPlanResponse, toCreditPackResponse } from '../../src/services/plan.service.js';

test('response helper preserves defaults, status codes and falsy data/success values', () => {
  const res = {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  assert.equal(responseCommon(res), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: 1, message: '', data: null });
  for (const status of [200, 201, 422, 500]) {
    for (const data of [false, 0, '', null, [], { _id: 'example' }]) {
      responseCommon(res, data, 'Result', status, 0);
      assert.equal(res.statusCode, status);
      assert.deepEqual(res.body, { success: 0, message: 'Result', data });
    }
  }
});

test('shared HTML escaping protects text and double-quoted attributes without escaping twice', () => {
  assert.equal(escapeHtml('<a href="x&y">'), '&lt;a href=&quot;x&amp;y&quot;&gt;');
  assert.equal(escapeHtml(123), '123');
  assert.equal(escapeHtml('Tutor name'), 'Tutor name');
});

test('shared query parsing retains transformed values and 422 field errors', () => {
  const schema = z.object({ page: z.coerce.number().int().min(1).default(1) });
  assert.deepEqual(parseQuery(schema, {}), { page: 1 });
  assert.deepEqual(parseQuery(schema, { page: '2' }), { page: 2 });
  assert.throws(() => parseQuery(schema, { page: 0 }), (error) => {
    assert.equal(error.status, 422);
    assert.ok(error.errors.page.length > 0);
    return true;
  });
});

test('billing DTOs use the shared numeric conversion and serialize invalid prices as null', () => {
  assert.equal(toPlanResponse({ monthly_price: '199000' }).monthly_price, 199000);
  assert.equal(toCreditPackResponse({ price: '59000' }).price, 59000);
  for (const price of [null, undefined, 'invalid', 'Infinity']) {
    assert.equal(toPlanResponse({ monthly_price: price }).monthly_price, null);
    assert.equal(toCreditPackResponse({ price }).price, null);
  }
});
