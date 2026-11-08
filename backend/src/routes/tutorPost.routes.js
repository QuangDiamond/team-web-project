import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
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

// TODO: authorize('TUTOR') — middleware chưa có (AGENTS.md: Planned); tạm thời service kiểm tra role, hồ sơ và quyền sở hữu
tutorPostRoutes.get('/mine', authentication, listMyPosts);
tutorPostRoutes.post('/', authentication, validator(createTutorPostSchema), createPost);
tutorPostRoutes.get('/:id', authentication, getMyPost);
tutorPostRoutes.put('/:id', authentication, validator(updateTutorPostSchema), updatePost);
tutorPostRoutes.patch('/:id/status', authentication, validator(tutorPostStatusSchema), changePostStatus);
// Không có body nên không cần validator; xóa mềm (status = DELETED)
tutorPostRoutes.delete('/:id', authentication, deletePost);
