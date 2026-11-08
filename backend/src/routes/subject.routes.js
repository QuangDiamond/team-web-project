import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { listSubjects } from '../controllers/subject.controller.js';

// Danh mục môn học cho ô chọn môn. Mọi role đăng nhập đều xem được nên chỉ cần authentication
export const subjectRoutes = Router();

subjectRoutes.get('/', authentication, listSubjects);
