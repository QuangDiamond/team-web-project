import { Router } from 'express';
import * as agreementController from '../controllers/agreement.controller.js';

export const agreementRoutes = Router();

// Lấy danh sách kết nối & thỏa thuận dạy học (UC18 / SC22 My Connections)
agreementRoutes.get('/', agreementController.getConnections);

// Đề xuất thỏa thuận mới giữa 2 bên (Mark as agreed)
agreementRoutes.post('/propose', agreementController.proposeAgreement);

// Xác nhận thỏa thuận kết nối (Confirm) hoặc Từ chối (Reject)
agreementRoutes.post('/:agreementId/confirm', agreementController.confirmAgreement);
