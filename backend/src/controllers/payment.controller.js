import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { AppError } from '../common/utils/AppError.js';
import * as pspClient from '../common/utils/pspClient.js';
import * as paymentService from '../services/payment.service.js';
import * as transactionService from '../services/transaction.service.js';
import { getPagination, buildPagination } from '../common/utils/pagination.js';
import { validateQuery } from '../common/validator/validator.js';
import { creditTransactionQuerySchema, orderQuerySchema } from '../common/validator/paymentSchema.js';
import { buildCsv } from '../common/utils/csv.js';
import { env } from '../config/environment.js';

// UC17 Upgrade Plan & Buy Credits (thay cho demo VNPay cũ, D11)

export const getCatalog = asyncHandler(async (req, res) => {
  const catalog = await paymentService.getCatalog(req.user.role);
  return responseCommon(res, catalog, 'Get catalog successfully!', 200, responseCode.SUCCESSED);
});

export const getMyBilling = asyncHandler(async (req, res) => {
  const billing = await paymentService.getMyBilling(req.user.id);
  return responseCommon(res, billing, 'Get current plan successfully!', 200, responseCode.SUCCESSED);
});

export const createOrder = asyncHandler(async (req, res) => {
  const order = await paymentService.createOrder(req.user, req.body, req.ip);
  return responseCommon(res, order, 'Create order successfully!', 201, responseCode.SUCCESSED);
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await paymentService.getOrder(req.user.id, req.params.orderCode);
  return responseCommon(res, order, 'Get order successfully!', 200, responseCode.SUCCESSED);
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await paymentService.cancelOrder(req.user.id, req.params.orderCode);
  return responseCommon(res, order, 'Cancel order successfully!', 200, responseCode.SUCCESSED);
});

// ----- UC18 View Credits & Transactions -----

// Xuất CSV không phân trang, giới hạn số dòng để tránh file quá lớn
const EXPORT_MAX_ROWS = 5000;

// D17: CSV dùng nhãn dễ đọc giống giao diện; giá trị lạ giữ nguyên
const CSV_LABELS = {
  MONTHLY_GRANT: 'Monthly grant',
  PURCHASE: 'Purchase',
  USED_APPLY: 'Used for application',
  USED_INVITATION: 'Used for invitation',
  EXPIRED_GRANT: 'Expired credits',
  APPLY: 'Application',
  INVITATION: 'Invitation',
  SUCCESS: 'Paid',
  PENDING: 'Pending',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  VIETQR: 'VietQR',
  ATM_CARD: 'ATM card',
  CREDIT_CARD: 'Credit card',
  PLAN_UPGRADE: 'Plan upgrade',
  CREDIT_PACK: 'Credit pack',
};
const PLAN_LABELS = { PRO: 'Pro plan', FREE_DEFAULT: 'Free plan' };

const toLabel = (value, labels) => {
  if (value === null || value === undefined) {
    return value;
  }
  return labels[value] || value;
};

const sendCsv = (res, filePrefix, content) => {
  // D16: tên file theo ngày Việt Nam (UTC+7)
  const vietnamNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const today = vietnamNow.toISOString().slice(0, 10).replaceAll('-', '');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filePrefix}-${today}.csv"`);
  return res.status(200).send(content);
};

export const getCreditTransactions = asyncHandler(async (req, res) => {
  const filters = validateQuery(creditTransactionQuerySchema, req.query);
  const { page, limit, skip } = getPagination(req.query);
  const result = await transactionService.findCreditTransactions(req.user.id, filters, skip, limit);
  const data = { items: result.items, pagination: buildPagination(page, limit, result.total) };
  return responseCommon(res, data, 'Get credit transactions successfully!', 200, responseCode.SUCCESSED);
});

export const exportCreditTransactions = asyncHandler(async (req, res) => {
  const filters = validateQuery(creditTransactionQuerySchema, req.query);
  const result = await transactionService.findCreditTransactions(req.user.id, filters, 0, EXPORT_MAX_ROWS);
  const rows = result.items.map((item) => {
    let relatedKind = null;
    let relatedTitle = null;
    if (item.related) {
      relatedKind = item.related.kind;
      relatedTitle = item.related.title;
    }
    return [item.created_at, toLabel(item.type, CSV_LABELS), item.amount, item.expires_at, toLabel(relatedKind, CSV_LABELS), relatedTitle];
  });
  const csv = buildCsv(['Date', 'Type', 'Credits', 'Expires at', 'Related to', 'Request title'], rows);
  return sendCsv(res, 'credit-transactions', csv);
});

export const getOrders = asyncHandler(async (req, res) => {
  const filters = validateQuery(orderQuerySchema, req.query);
  const { page, limit, skip } = getPagination(req.query);
  const result = await transactionService.findOrders(req.user.id, filters, skip, limit);
  const data = { items: result.items, pagination: buildPagination(page, limit, result.total) };
  return responseCommon(res, data, 'Get orders successfully!', 200, responseCode.SUCCESSED);
});

export const exportOrders = asyncHandler(async (req, res) => {
  const filters = validateQuery(orderQuerySchema, req.query);
  const result = await transactionService.findOrders(req.user.id, filters, 0, EXPORT_MAX_ROWS);
  const rows = result.items.map((item) => {
    let itemName = item.item_name;
    if (item.item_type === 'PLAN_UPGRADE') {
      itemName = toLabel(item.item_name, PLAN_LABELS);
    }
    return [
      item.order_code,
      item.created_at,
      toLabel(item.item_type, CSV_LABELS),
      itemName,
      toLabel(item.status, CSV_LABELS),
      item.amount,
      toLabel(item.payment_method, CSV_LABELS),
      item.paid_at,
    ];
  });
  const csv = buildCsv(['Order code', 'Created at', 'Item type', 'Item', 'Status', 'Amount (VND)', 'Payment method', 'Paid at'], rows);
  return sendCsv(res, 'payment-history', csv);
});

export const pspWebhook = asyncHandler(async (req, res) => {
  const event = pspClient.verifyWebhook(req);
  if (event) await paymentService.handlePspWebhook(event);
  return responseCommon(res, null, 'Webhook received', 200, responseCode.SUCCESSED);
});

// ----- Trang thanh toán giả, chỉ dùng khi dev (D5) -----

// Tắt hẳn (404) khi đã cấu hình PSP hoặc chạy production
export const requireMockCheckout = (_req, _res, next) => {
  if (!pspClient.isMockCheckoutEnabled()) {
    return next(new AppError('Route not found', 404));
  }
  return next();
};

// Escape để mã đơn trong URL không chèn được HTML vào trang
const escapeHtml = (text) => {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
};

const renderMockCheckoutPage = (order) => {
  const orderCode = escapeHtml(order.order_code);
  const amount = Number(order.amount).toLocaleString('vi-VN');

  let buttons = `<p>This order is <b>${escapeHtml(order.status)}</b> and can no longer be paid.</p>`;
  if (order.status === 'PENDING') {
    buttons = `
      <form method="post">
        <button name="result" value="SUCCESS" class="ok">Pay successfully</button>
        <button name="result" value="FAILED" class="fail">Fail payment</button>
      </form>`;
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mock checkout</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 420px; margin: 48px auto; padding: 0 16px; color: #1f2937; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
    .note { background: #fef3c7; padding: 8px 12px; border-radius: 8px; font-size: 14px; }
    button { padding: 10px 16px; border: 0; border-radius: 8px; color: #fff; cursor: pointer; margin-right: 8px; font-size: 15px; }
    .ok { background: #16a34a; }
    .fail { background: #dc2626; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Mock payment gateway</h1>
    <p class="note">Development only. No real payment is made.</p>
    <p>Order: <b>${orderCode}</b></p>
    <p>Amount: <b>${amount} ₫</b></p>
    ${buttons}
  </div>
</body>
</html>`;
};

export const showMockCheckout = asyncHandler(async (req, res) => {
  const order = await paymentService.findOrderForMockCheckout(req.user.id, req.params.orderCode);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  return res.status(200).type('html').send(renderMockCheckoutPage(order));
});

// Chạy đúng hàm webhook sẽ chạy (applyPaymentResult) rồi đưa trình duyệt về trang kết quả của frontend
export const submitMockCheckout = asyncHandler(async (req, res) => {
  // D12: chỉ chủ đơn mới hoàn tất được
  const ownOrder = await paymentService.findOrderForMockCheckout(req.user.id, req.params.orderCode);
  if (!ownOrder) {
    throw new AppError('Order not found', 404);
  }
  const order = await paymentService.applyPaymentResult(ownOrder.order_code, req.body.result);
  const resultUrl = `${env.corsOrigin}/payment/result?order=${encodeURIComponent(order.order_code)}`;
  return res.redirect(303, resultUrl);
});
