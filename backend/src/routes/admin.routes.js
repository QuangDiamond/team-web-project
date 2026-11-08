import { Router } from 'express';
import { categoryBodySchema, deleteCategorySchema } from '../common/validator/categorySchema.js';
import { listAdminCategories, createCategory, updateCategory, removeCategory } from '../controllers/category.controller.js';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import {
    updatePlanSchema,
    createPlanSchema,
    createCreditPackSchema,
    updateCreditPackSchema,
    updateCreditPackStatusSchema,
} from '../common/validator/planSchema.js';
import {
    getPlans,
    updatePlan,
    createPlan,
    getCreditPacks,
    createCreditPack,
    updateCreditPack,
    updateCreditPackStatus,
} from '../controllers/plan.controller.js';
import { updateUserStatusSchema, createAdminSchema } from '../common/validator/adminUserSchema.js';
import { getUsers, getUserDetail, updateUserStatus, createAdmin } from '../controllers/adminUser.controller.js';
export const adminRoutes = Router();
adminRoutes.get('/categories/:type', authentication, authorize('ADMIN'), listAdminCategories);
adminRoutes.post('/categories/:type', authentication, authorize('ADMIN'), validator(categoryBodySchema), createCategory);
adminRoutes.put('/categories/:type/:id', authentication, authorize('ADMIN'), validator(categoryBodySchema), updateCategory);
adminRoutes.delete('/categories/:type/:id', authentication, authorize('ADMIN'), validator(deleteCategorySchema), removeCategory);

// UC39 Manage Plans & Pricing: chỉ ADMIN
adminRoutes.get('/plans', authentication, authorize('ADMIN'), getPlans)
adminRoutes.post('/plans', authentication, authorize('ADMIN'), validator(createPlanSchema), createPlan)
adminRoutes.put('/plans/:id', authentication, authorize('ADMIN'), validator(updatePlanSchema), updatePlan)
adminRoutes.get('/credit-packs', authentication, authorize('ADMIN'), getCreditPacks)
adminRoutes.post('/credit-packs', authentication, authorize('ADMIN'), validator(createCreditPackSchema), createCreditPack)
adminRoutes.put('/credit-packs/:id', authentication, authorize('ADMIN'), validator(updateCreditPackSchema), updateCreditPack)
adminRoutes.patch('/credit-packs/:id/status', authentication, authorize('ADMIN'), validator(updateCreditPackStatusSchema), updateCreditPackStatus)

// UC37 Manage User Accounts: chỉ ADMIN
adminRoutes.get('/users', authentication, authorize('ADMIN'), getUsers)
adminRoutes.post('/users/admins', authentication, authorize('ADMIN'), validator(createAdminSchema), createAdmin)
adminRoutes.get('/users/:id', authentication, authorize('ADMIN'), getUserDetail)
adminRoutes.patch('/users/:id/status', authentication, authorize('ADMIN'), validator(updateUserStatusSchema), updateUserStatus)
