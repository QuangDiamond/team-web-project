import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { refreshSuggestionsSchema } from '../common/validator/aiSuggestionSchema.js';
import { getSuggestions, refreshSuggestions } from '../controllers/aiSuggestion.controller.js';

// Profile/category-based suggestions; the old AI-prefixed URL remains an alias.
export const aiSuggestionRoutes = Router();

aiSuggestionRoutes.get('/requests/:requestId', authentication, authorize('PARENT'), getSuggestions);
aiSuggestionRoutes.post('/requests/:requestId/refresh', authentication, authorize('PARENT'), validator(refreshSuggestionsSchema), refreshSuggestions);
