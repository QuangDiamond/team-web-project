import { Router } from 'express';
import { listPublicCategories } from '../controllers/category.controller.js';

export const categoryRoutes = Router();
// Public catalog choices support SC05 guest search; mutations are Admin-only.
categoryRoutes.get('/:type', listPublicCategories);
