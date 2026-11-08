import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { env } from '../src/config/environment.js';
import * as psp from '../src/common/utils/pspClient.js';

test('PSP signs exact requests, reconciles amounts, cancels, and verifies webhooks', async () => {
  const previous = { ...env };
  const originalFetch = globalThis.fetch;
  Object.assign(env, { pspBaseUrl: 'https://psp.example/api/v1', pspClientId: 'test-client', pspClientSecret: 'test-secret' });
  const order = { order_code: 'ORDER 1', amount: 10000, user_id: 'user1', item_type: 'CREDIT_PACK' };
  let status = 'SUCCEEDED';
  let amount = 10000;
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls += 1;
    const path = url.pathname + url.search;
    const raw = options.body || '';
    const expected = createHmac('sha256', env.pspClientSecret)
      .update(options.method + path + options.headers['X-Timestamp'] + raw).digest('hex');
    assert.equal(options.headers['X-Signature'], expected);
    assert.equal(options.headers['X-Client-Id'], 'test-client');
    let data;
    if (options.method === 'GET') {
      assert.equal(url.searchParams.get('order_id'), order.order_code);
      data = { data: [{ payment_id: 'pay1', order_id: order.order_code, amount, currency: 'VND', status }] };
    } else if (path.endsWith('/cancel')) {
      assert.equal(options.headers['Idempotency-Key'], 'cancel-ORDER 1');
      data = { status: 'CANCELLED' };
    } else {
      assert.equal(options.headers['Idempotency-Key'], order.order_code);
      assert.equal(JSON.parse(raw).amount, 10000);
      assert.equal(JSON.parse(raw).payer_ip, '203.0.113.25');
      data = { payment_id: 'pay1', checkout_url: 'https://sandbox.vnpayment.vn/payment' };
    }
    return { ok: true, json: async () => data };
  };
  try {
    await assert.rejects(psp.createPayment(order), /valid payer IP/);
    await assert.rejects(psp.createPayment(order, 'invalid'), /valid payer IP/);
    assert.match((await psp.createPayment(order, '203.0.113.25')).checkout_url, /^https:/);
    assert.deepEqual(await psp.getPayment(order), { result: 'SUCCESS' });
    amount = 999;
    assert.equal(await psp.getPayment(order), null);
    amount = 10000;
    await assert.rejects(psp.cancelPayment(order), /no longer/);
    status = 'PENDING';
    await psp.cancelPayment(order);
    const body = { event_id: 'evt1', type: 'payment.succeeded', payment: { order_id: order.order_code } };
    const rawBody = Buffer.from(JSON.stringify(body));
    const ts = String(Math.floor(Date.now() / 1000));
    const headers = { 'X-PGS-Timestamp': ts, 'X-PGS-Event-Id': 'evt1', 'X-PGS-Signature': createHmac('sha256', env.pspClientSecret).update(`${ts}.`).update(rawBody).digest('hex') };
    const req = { body, rawBody, get: (name) => headers[name] };
    assert.deepEqual(psp.verifyWebhook(req), { order_code: order.order_code, result: 'SUCCESS' });
    req.rawBody = Buffer.from('{}');
    assert.throws(() => psp.verifyWebhook(req), /signature/);
    req.rawBody = rawBody;
    headers['X-PGS-Timestamp'] = '1';
    assert.throws(() => psp.verifyWebhook(req), /signature/);
    assert.ok(calls >= 5);
    globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: { code: 'INVALID_STATE' } }) });
    await assert.rejects(psp.cancelPayment(order), /request failed/);
    globalThis.fetch = async () => { throw new Error('network unavailable'); };
    await assert.rejects(psp.createPayment(order, '203.0.113.25'), /temporarily unavailable/);
    assert.equal(await psp.getPayment(order), null);
    env.pspClientSecret = '';
    await assert.rejects(psp.createPayment(order, '203.0.113.25'), /configuration is incomplete/);
  } finally {
    globalThis.fetch = originalFetch;
    Object.assign(env, previous);
  }
});
