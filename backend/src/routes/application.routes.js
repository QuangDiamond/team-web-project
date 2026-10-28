import { Router } from 'express';
import * as applicationController from '../controllers/application.controller.js';

export const applicationRoutes = Router();

// Lấy danh sách gia sư ứng tuyển theo mã bài đăng tìm gia sư (UC15 / SC17)
applicationRoutes.get('/requests/:requestId', applicationController.getApplications);
applicationRoutes.get('/requests', applicationController.getApplications);

// Phụ huynh phản hồi ứng tuyển: Tiếp tục trao đổi (Continue) hoặc Bỏ qua (Skip)
applicationRoutes.post('/:applicationId/respond', applicationController.respondApplication);
