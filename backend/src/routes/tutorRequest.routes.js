import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import {
  addBookmark,
  browseRequests,
  getFilterOptions,
  getRequestDetail,
  getSuggestions,
  listBookmarks,
  refreshSuggestions,
  removeBookmark,
} from '../controllers/tutorRequest.controller.js';

// UC11 – Browse Requests & AI Post Suggestions (Tutor)
export const tutorRequestRoutes = Router();

// TODO: authorize('TUTOR') — middleware chưa có (AGENTS.md: Planned); tạm thời service kiểm tra role và hồ sơ gia sư
// Các route cố định phải khai báo trước /:id
tutorRequestRoutes.get('/', authentication, browseRequests);
tutorRequestRoutes.get('/filters', authentication, getFilterOptions);
tutorRequestRoutes.get('/bookmarks', authentication, listBookmarks);
tutorRequestRoutes.get('/suggestions', authentication, getSuggestions);
// Không có body nên không cần validator (POST/PUT không nhận dữ liệu từ client)
tutorRequestRoutes.post('/suggestions/refresh', authentication, refreshSuggestions);
tutorRequestRoutes.get('/:id', authentication, getRequestDetail);
tutorRequestRoutes.put('/:id/bookmark', authentication, addBookmark);
tutorRequestRoutes.delete('/:id/bookmark', authentication, removeBookmark);
