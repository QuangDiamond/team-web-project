import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { refreshSuggestionsSchema } from '../common/validator/aiSuggestionSchema.js';
import { getSuggestions, refreshSuggestions } from '../controllers/aiSuggestion.controller.js';

// UC09 – View AI Tutor Suggestions
export const aiSuggestionRoutes = Router();

// TODO: authorize('PARENT') — middleware chưa có (AGENTS.md: Planned); tạm thời service tự kiểm tra role và quyền sở hữu request
aiSuggestionRoutes.get('/requests/:requestId', authentication, getSuggestions);
aiSuggestionRoutes.post('/requests/:requestId/refresh', authentication, validator(refreshSuggestionsSchema), refreshSuggestions);
