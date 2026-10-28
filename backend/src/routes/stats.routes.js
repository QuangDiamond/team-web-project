import { Router } from 'express';
import * as statsController from '../controllers/stats.controller.js';

export const statsRoutes = Router();

// Lấy số liệu thống kê hệ thống theo chu kỳ (7d, 30d, 90d, 1y) (UC42 / SC40)
statsRoutes.get('/', statsController.getDashboardStats);

// Xuất báo cáo thống kê Excel/JSON (Alternative Flow A1)
statsRoutes.get('/export', statsController.exportStatsReport);
