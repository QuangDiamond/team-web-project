import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import {
    updatePlanSchema,
    createCreditPackSchema,
    updateCreditPackSchema,
    updateCreditPackStatusSchema,
} from '../common/validator/planSchema.js';
import {
    getPlans,
    updatePlan,
    getCreditPacks,
    createCreditPack,
    updateCreditPack,
    updateCreditPackStatus,
} from '../controllers/plan.controller.js';
import { updateUserStatusSchema, createAdminSchema } from '../common/validator/adminUserSchema.js';
import { getUsers, getUserDetail, updateUserStatus, createAdmin } from '../controllers/adminUser.controller.js';
export const adminRoutes = Router();

// UC39 Manage Plans & Pricing: chỉ ADMIN
adminRoutes.get('/plans', authentication, authorize('ADMIN'), getPlans)
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
