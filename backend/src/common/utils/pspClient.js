import { isIP } from 'node:net';
import { URL } from 'node:url';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { env } from '../../config/environment.js';
import { AppError } from './AppError.js';

export const isMockCheckoutEnabled = () => env.nodeEnv !== 'production' && env.pspBaseUrl === '';

// Sign the exact path, query and body that are sent over the wire.
const request = async (method, path, body, idempotencyKey) => {
  if (!env.pspBaseUrl || !env.pspClientId || !env.pspClientSecret) {
    throw new AppError('Payment gateway configuration is incomplete', 503);
  }
  const base = env.pspBaseUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
  const url = new URL(`${base}/api/v1${path}`);
  const rawBody = body === undefined ? '' : JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', env.pspClientSecret)
    .update(`${method}${url.pathname}${url.search}${timestamp}${rawBody}`).digest('hex');
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-Id': env.pspClientId,
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  let response;
  try {
    response = await globalThis.fetch(url, {
      method, headers, body: rawBody || undefined,
      signal: globalThis.AbortSignal.timeout(30000), redirect: 'error',
    });
  } catch {
    throw new AppError('Payment gateway is temporarily unavailable', 502);
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new AppError('Invalid payment gateway response', 502);
  }
  if (!response.ok) {
    const error = new AppError('Payment gateway request failed', 502);
    error.pspCode = data.error?.code;
    throw error;
  }
  return data;
};

const findPayment = async (order) => {
  const response = await request('GET', `/payments?order_id=${encodeURIComponent(order.order_code)}`);
  if (!Array.isArray(response.data)) throw new AppError('Invalid payment gateway response', 502);
  const payments = response.data.filter((payment) => payment.order_id === order.order_code);
  if (payments.length === 0) return null;
  if (payments.length !== 1) throw new AppError('Ambiguous payment gateway response', 502);
  const payment = payments[0];
  if (!payment.payment_id || payment.amount !== Number(order.amount) || payment.currency !== 'VND') {
    throw new AppError('Payment gateway order mismatch', 502);
  }
  return payment;
};

/**
 * Create an idempotent PSP checkout for a local order.
 * @param {Object} order - Local PaymentOrder
 * @param {string} payerIp - IPv4 or IPv6 address of the payer
 * @returns {Promise<Object>} PSP checkout response
 */
export const createPayment = async (order, payerIp) => {
  if (typeof payerIp !== 'string' || isIP(payerIp) === 0) {
    throw new AppError('A valid payer IP address is required', 400);
  }
  if (isMockCheckoutEnabled()) {
    return { checkout_url: `${env.apiUrl}/payment/v1/mock-checkout/${order.order_code}` };
  }
  const payment = await request('POST', '/payments', {
    order_id: order.order_code, amount: Number(order.amount), currency: 'VND', provider: 'vnpay',
    payer_ip: payerIp,
    description: `TuConnector ${order.order_code}`,
    return_url: `${env.corsOrigin}/payment/result?order=${encodeURIComponent(order.order_code)}`,
    expires_in: 900,
    metadata: { user_id: String(order.user_id), item_type: order.item_type },
  }, order.order_code);
  if (!payment.payment_id || typeof payment.checkout_url !== 'string' || !URL.canParse(payment.checkout_url)) {
    throw new AppError('Invalid payment gateway response', 502);
  }
  if (new URL(payment.checkout_url).protocol !== 'https:') throw new AppError('Invalid checkout URL', 502);
  return payment;
};

/**
 * Query a pending order through PSP, checking its amount and currency.
 * @param {Object} order - Local PaymentOrder
 * @returns {Promise<Object|null>} Final result or null while pending/unavailable
 */
export const getPayment = async (order) => {
  if (isMockCheckoutEnabled()) return null;
  try {
    const payment = await findPayment(order);
    if (!payment) return null;
    if (payment.status === 'SUCCEEDED' && !payment.needs_review) return { result: 'SUCCESS' };
    if (['FAILED', 'EXPIRED', 'CANCELLED'].includes(payment.status)) return { result: 'FAILED' };
    return null;
  } catch {
    return null;
  }
};

/**
 * Cancel a pending PSP payment before cancelling the local order.
 * @param {Object} order - Local PaymentOrder
 * @returns {Promise<void>}
 */
export const cancelPayment = async (order) => {
  if (isMockCheckoutEnabled()) return;
  const payment = await findPayment(order);
  if (!payment) throw new AppError('Payment not found at gateway', 502);
  if (payment.status === 'CANCELLED') return;
  if (payment.status !== 'PENDING') throw new AppError('Payment can no longer be cancelled', 409);
  try {
    await request('POST', `/payments/${encodeURIComponent(payment.payment_id)}/cancel`, {}, `cancel-${order.order_code}`);
  } catch (error) {
    if (error.pspCode === 'INVALID_STATE') throw new AppError('Payment can no longer be cancelled', 409);
    throw error;
  }
};

/**
 * Verify PSP webhook HMAC and freshness before reading the event.
 * @param {Object} req - Express request with rawBody
 * @returns {Object|null} Verified payment result or null for unrelated events
 */
export const verifyWebhook = (req) => {
  const timestamp = req.get('X-PGS-Timestamp') || '';
  const signature = req.get('X-PGS-Signature') || '';
  if (!env.pspClientSecret || !/^\d{1,12}$/.test(timestamp) || !/^[a-fA-F0-9]{64}$/.test(signature)
    || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 || !Buffer.isBuffer(req.rawBody)) {
    throw new AppError('Invalid webhook signature', 401);
  }
  const expected = createHmac('sha256', env.pspClientSecret).update(`${timestamp}.`).update(req.rawBody).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) throw new AppError('Invalid webhook signature', 401);
  const event = req.body;
  if (!event || !event.event_id || req.get('X-PGS-Event-Id') !== event.event_id) {
    throw new AppError('Invalid webhook event', 422);
  }
  const results = { 'payment.succeeded': 'SUCCESS', 'payment.failed': 'FAILED', 'payment.expired': 'FAILED', 'payment.cancelled': 'FAILED' };
  if (!Object.hasOwn(results, event.type)) return null;
  if (!event.payment || typeof event.payment.order_id !== 'string') throw new AppError('Invalid webhook event', 422);
  // The service re-queries PSP to confirm the local order amount before applying benefits.
  return { order_code: event.payment.order_id, result: results[event.type] };
};
