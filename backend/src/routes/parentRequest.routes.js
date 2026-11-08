import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { parentRequestBodySchema } from '../common/validator/parentRequestSchema.js';
import { listApplicationsForRequest } from '../controllers/application.controller.js';
import {
  createRequest,
  getMyRequest,
  listChildren,
  listMyRequests,
  updateRequest,
} from '../controllers/parentRequest.controller.js';

// UC10 – Manage Tutoring Requests (Parent)
export const parentRequestRoutes = Router();

// TODO: authorize('PARENT') — middleware chưa có (AGENTS.md: Planned); tạm thời service kiểm tra role và quyền sở hữu
parentRequestRoutes.get('/children', authentication, listChildren);
parentRequestRoutes.get('/', authentication, listMyRequests);
parentRequestRoutes.post('/', authentication, validator(parentRequestBodySchema), createRequest);
parentRequestRoutes.get('/:id', authentication, getMyRequest);
parentRequestRoutes.put('/:id', authentication, validator(parentRequestBodySchema), updateRequest);
// Đơn ứng tuyển của gia sư vào request này (phụ huynh duyệt)
parentRequestRoutes.get('/:id/applications', authentication, listApplicationsForRequest);
