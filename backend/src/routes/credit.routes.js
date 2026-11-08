import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { balance } from '../controllers/credit.controller.js';

// Số dư credit của chính người dùng đang đăng nhập (dùng để hiện chi phí trước khi ứng tuyển / mời)
export const creditRoutes = Router();

creditRoutes.get('/balance', authentication, balance);
