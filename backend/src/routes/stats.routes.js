import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import * as statsController from '../controllers/stats.controller.js';

export const statsRoutes = Router();

// Public API cho trang chủ (SC01 Home Page): lấy danh sách gia sư nổi bật và số liệu tổng quan nền tảng
statsRoutes.get('/public', statsController.getPublicHomeStats);

// UC40 / UC42 – View System Statistics (role ADMIN)
// TODO: authorize('ADMIN') — middleware chưa có (AGENTS.md: Planned); service kiểm tra bằng assertRole
statsRoutes.get('/', authentication, statsController.getDashboardStats);
statsRoutes.get('/export', authentication, statsController.exportStatsReport);
