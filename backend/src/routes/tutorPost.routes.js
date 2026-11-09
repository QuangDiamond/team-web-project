import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import {
  createTutorPostSchema,
  tutorPostStatusSchema,
  updateTutorPostSchema,
} from '../common/validator/tutorPostSchema.js';
import {
  changePostStatus,
  createPost,
  deletePost,
  getMyPost,
  listMyPosts,
  updatePost,
} from '../controllers/tutorPost.controller.js';

// Bài đăng quảng cáo dịch vụ dạy học của chính gia sư
export const tutorPostRoutes = Router();

tutorPostRoutes.get('/mine', authentication, authorize('TUTOR'), listMyPosts);
tutorPostRoutes.post('/', authentication, authorize('TUTOR'), validator(createTutorPostSchema), createPost);
tutorPostRoutes.get('/:id', authentication, authorize('TUTOR'), getMyPost);
tutorPostRoutes.put('/:id', authentication, authorize('TUTOR'), validator(updateTutorPostSchema), updatePost);
tutorPostRoutes.patch('/:id/status', authentication, authorize('TUTOR'), validator(tutorPostStatusSchema), changePostStatus);
// Không có body nên không cần validator; xóa mềm (status = DELETED)
tutorPostRoutes.delete('/:id', authentication, authorize('TUTOR'), deletePost);
