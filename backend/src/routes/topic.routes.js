import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { createTopicSchema, updateTopicSchema } from '../common/validator/topicSchema.js';
import { assertRole } from '../common/utils/assertRole.js';
import { ENUMS } from '../models/enums.js';
import { createTopic, deleteTopic, getAllTopics, updateTopic } from '../controllers/topic.controller.js';

export const topicRoutes = Router();

const tutorOnly = (req, res, next) => {
  assertRole(req.user, ENUMS.UserRole.TUTOR);
  return next();
};

topicRoutes.get('/:classId/topics', authentication, authorize('TUTOR', 'STUDENT'), getAllTopics);
topicRoutes.post('/:classId/topics', authentication, tutorOnly, validator(createTopicSchema), createTopic);
topicRoutes.patch('/:classId/topics/:topicId', authentication, tutorOnly, validator(updateTopicSchema), updateTopic);
topicRoutes.delete('/:classId/topics/:topicId', authentication, tutorOnly, deleteTopic);
