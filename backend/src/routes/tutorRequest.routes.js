import { Router } from 'express';
import { authentication, authorize, optionalAuthentication } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { refreshSuggestionsSchema } from '../common/validator/aiSuggestionSchema.js';
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

// Browse requests and profile-category suggestions for Tutors.
export const tutorRequestRoutes = Router();

// Các route cố định phải khai báo trước /:id
// Public: khách và mọi role xem được danh sách trên trang chủ; gia sư có thêm trạng thái đã lưu / đã ứng tuyển
tutorRequestRoutes.get('/', optionalAuthentication, browseRequests);
tutorRequestRoutes.get('/filters', authentication, authorize('TUTOR'), getFilterOptions);
tutorRequestRoutes.get('/bookmarks', authentication, authorize('TUTOR'), listBookmarks);
tutorRequestRoutes.get('/suggestions', authentication, authorize('TUTOR'), getSuggestions);
// Accept an empty body for older callers; reject injected suggestion parameters.
tutorRequestRoutes.post('/suggestions/refresh', authentication, authorize('TUTOR'), validator(refreshSuggestionsSchema.default({})), refreshSuggestions);
tutorRequestRoutes.get('/:id', authentication, authorize('TUTOR'), getRequestDetail);
tutorRequestRoutes.put('/:id/bookmark', authentication, authorize('TUTOR'), addBookmark);
tutorRequestRoutes.delete('/:id/bookmark', authentication, authorize('TUTOR'), removeBookmark);
