import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
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

// Các route cố định phải khai báo trước /:id
tutorRequestRoutes.get('/', authentication, authorize('TUTOR'), browseRequests);
tutorRequestRoutes.get('/filters', authentication, authorize('TUTOR'), getFilterOptions);
tutorRequestRoutes.get('/bookmarks', authentication, authorize('TUTOR'), listBookmarks);
tutorRequestRoutes.get('/suggestions', authentication, authorize('TUTOR'), getSuggestions);
// Không có body nên không cần validator (POST/PUT không nhận dữ liệu từ client)
tutorRequestRoutes.post('/suggestions/refresh', authentication, authorize('TUTOR'), refreshSuggestions);
tutorRequestRoutes.get('/:id', authentication, authorize('TUTOR'), getRequestDetail);
tutorRequestRoutes.put('/:id/bookmark', authentication, authorize('TUTOR'), addBookmark);
tutorRequestRoutes.delete('/:id/bookmark', authentication, authorize('TUTOR'), removeBookmark);
