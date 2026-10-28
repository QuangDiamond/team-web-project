import { authRoute } from "./auth.routes.js";
import { userRoutes } from "./user.routes.js";
import { healthRoutes } from './health.routes.js';
import { paymentRoutes } from "./payment.routes.js";
import { applicationRoutes } from "./application.routes.js";
import { invitationRoutes } from "./invitation.routes.js";
import { agreementRoutes } from "./agreement.routes.js";
import { notificationRoutes } from "./notification.routes.js";
import { Router } from 'express';

export const router = Router();

router.use('/user/v1', userRoutes);
router.use('/auth/v1', authRoute);
router.use("/health", healthRoutes);
router.use("/payment/v1", paymentRoutes);
router.use("/applications/v1", applicationRoutes);
router.use("/invitations/v1", invitationRoutes);
router.use("/agreements/v1", agreementRoutes);
router.use("/notifications/v1", notificationRoutes);


