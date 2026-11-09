import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { parentRequestBodySchema } from '../common/validator/parentRequestSchema.js';
import { listApplicationsForRequest } from '../controllers/application.controller.js';
import {
  createRequest,
  deleteRequest,
  getMyRequest,
  listChildren,
  listMyRequests,
  updateRequest,
} from '../controllers/parentRequest.controller.js';

// UC10 – Manage Tutoring Requests (Parent)
export const parentRequestRoutes = Router();

parentRequestRoutes.get('/children', authentication, authorize('PARENT'), listChildren);
parentRequestRoutes.get('/', authentication, authorize('PARENT'), listMyRequests);
parentRequestRoutes.post('/', authentication, authorize('PARENT'), validator(parentRequestBodySchema), createRequest);
parentRequestRoutes.get('/:id', authentication, authorize('PARENT'), getMyRequest);
parentRequestRoutes.put('/:id', authentication, authorize('PARENT'), validator(parentRequestBodySchema), updateRequest);
// Không có body nên không cần validator. Chặn nếu request đã có hội thoại
parentRequestRoutes.delete('/:id', authentication, authorize('PARENT'), deleteRequest);
// Đơn ứng tuyển của gia sư vào request này (phụ huynh duyệt)
parentRequestRoutes.get('/:id/applications', authentication, authorize('PARENT'), listApplicationsForRequest);
