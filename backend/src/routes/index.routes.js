import { authRoute } from "./auth.routes.js";
import { userRoutes } from "./user.routes.js";
import {healthRoutes} from './health.routes.js'
import {Router} from 'express';
import { paymentRoutes } from "./payment.routes.js";
import { studentDashboardRoutes } from "./studentDashboard.routes.js";
import { aiSuggestionRoutes } from "./aiSuggestion.routes.js";
import { parentRequestRoutes } from "./parentRequest.routes.js";
import { tutorRequestRoutes } from "./tutorRequest.routes.js";
import { applicationRoutes } from "./application.routes.js";
import { invitationRoutes } from "./invitation.routes.js";
import { creditRoutes } from "./credit.routes.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { tutorProfileRoutes } from "./tutorProfile.routes.js";
import { tutorPostRoutes } from "./tutorPost.routes.js";
import { chatRoutes } from "./chat.routes.js";
import { classroomRoutes } from './classroom.routes.js';
export const router = Router();

router.use('/user/v1', userRoutes)
router.use('/auth/v1', authRoute)
router.use("/health", healthRoutes)
router.use("/payment/v1", paymentRoutes)
router.use("/student-dashboard/v1", studentDashboardRoutes)
router.use("/ai-suggestions/v1", aiSuggestionRoutes)
router.use("/parent-requests/v1", parentRequestRoutes)
router.use("/tutor-requests/v1", tutorRequestRoutes)
router.use("/applications/v1", applicationRoutes)
router.use("/invitations/v1", invitationRoutes)
router.use("/credits/v1", creditRoutes)
router.use("/dashboard/v1", dashboardRoutes)
router.use("/tutor-profile/v1", tutorProfileRoutes)
router.use("/tutor-posts/v1", tutorPostRoutes)
router.use("/chat/v1", chatRoutes)
router.use('/classroom/v1', classroomRoutes)
