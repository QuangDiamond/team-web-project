import { Router } from 'express';
import helmet from 'helmet';
import { env } from '../config/environment.js';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { createOrderSchema, mockCheckoutSchema } from '../common/validator/paymentSchema.js';
import {
    getCatalog,
    getMyBilling,
    createOrder,
    getOrder,
    cancelOrder,
    pspWebhook,
    getCreditTransactions,
    exportCreditTransactions,
    getOrders,
    exportOrders,
    requireMockCheckout,
    showMockCheckout,
    submitMockCheckout,
} from '../controllers/payment.controller.js';

export const paymentRoutes = Router();

// UC17 Upgrade Plan & Buy Credits: chỉ TUTOR, PARENT
paymentRoutes.get('/catalog', authentication, authorize('TUTOR', 'PARENT'), getCatalog)
paymentRoutes.get('/me', authentication, authorize('TUTOR', 'PARENT'), getMyBilling)
paymentRoutes.post('/orders', authentication, authorize('TUTOR', 'PARENT'), validator(createOrderSchema), createOrder)
// UC18 View Credits & Transactions. /orders/export phải khai báo trước /orders/:orderCode
paymentRoutes.get('/credit-transactions', authentication, authorize('TUTOR', 'PARENT'), getCreditTransactions)
paymentRoutes.get('/credit-transactions/export', authentication, authorize('TUTOR', 'PARENT'), exportCreditTransactions)
paymentRoutes.get('/orders', authentication, authorize('TUTOR', 'PARENT'), getOrders)
paymentRoutes.get('/orders/export', authentication, authorize('TUTOR', 'PARENT'), exportOrders)
paymentRoutes.get('/orders/:orderCode', authentication, authorize('TUTOR', 'PARENT'), getOrder)
// Không có body nên không cần validator
paymentRoutes.post('/orders/:orderCode/cancel', authentication, authorize('TUTOR', 'PARENT'), cancelOrder)

// PSP (server-to-server) gọi nên không có cookie / JWT; xác thực bằng chữ ký HMAC trong pspClient.verifyWebhook
paymentRoutes.post('/psp/webhook', pspWebhook)

// Trang thanh toán giả (dev only, 404 khi có PSP_BASE_URL hoặc production). D12: phải đăng nhập và là chủ đơn
// form-action cũng áp cho redirect 303 sau khi submit, nên cho phép thêm origin của frontend (chỉ trang này)
const mockCheckoutCsp = helmet.contentSecurityPolicy({ directives: { formAction: ["'self'", env.corsOrigin] } })
paymentRoutes.get('/mock-checkout/:orderCode', requireMockCheckout, authentication, mockCheckoutCsp, showMockCheckout)
paymentRoutes.post('/mock-checkout/:orderCode', requireMockCheckout, authentication, validator(mockCheckoutSchema), submitMockCheckout)
