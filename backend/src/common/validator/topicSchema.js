import { z } from 'zod';

const topicNameSchema = z
  .string('Topic name is required')
  .trim()
  .min(1, 'Topic name is required')
  .max(100, 'Topic name must be at most 100 characters');

export const createTopicSchema = z.strictObject({ name: topicNameSchema });
export const updateTopicSchema = z.strictObject({ name: topicNameSchema });

//ok nhé, giờ để 1 cái z rồi đẩy ra thành các create/update topic schema cho validator, i was here