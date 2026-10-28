import { authRoute } from "./auth.routes.js";
import { userRoutes } from "./user.routes.js";
import { healthRoutes } from './health.routes.js';
import { paymentRoutes } from "./payment.routes.js";
import { applicationRoutes } from "./application.routes.js";
import { Router } from 'express';

export const router = Router();

router.use('/user/v1', userRoutes);
router.use('/auth/v1', authRoute);
router.use("/health", healthRoutes);
router.use("/payment/v1", paymentRoutes);
router.use("/applications/v1", applicationRoutes);