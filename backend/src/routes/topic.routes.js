import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { createTopicSchema, updateTopicSchema } from '../common/validator/topicSchema.js';
import { createTopic, deleteTopic, getAllTopics, updateTopic } from '../controllers/topic.controller.js';

export const topicRoutes = Router();

topicRoutes.get('/:classId/topics', authentication, authorize('TUTOR', 'STUDENT'), getAllTopics);
topicRoutes.post('/:classId/topics', authentication, authorize('TUTOR'), validator(createTopicSchema), createTopic);
topicRoutes.patch('/:classId/topics/:topicId', authentication, authorize('TUTOR'), validator(updateTopicSchema), updateTopic);
topicRoutes.delete('/:classId/topics/:topicId', authentication, authorize('TUTOR'), deleteTopic);
