import { z } from 'zod';
import mongoose from 'mongoose';
import { URL } from 'node:url';
import { ENUMS } from '../../models/enums.js';

const uploadedMaterialTypes = [
  ENUMS.ClassMaterialsMaterialType.DOCUMENT,
  ENUMS.ClassMaterialsMaterialType.SLIDE,
  ENUMS.ClassMaterialsMaterialType.VIDEO,
];

const topicIdSchema = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.union([
    z.string().refine((value) => mongoose.isValidObjectId(value), 'Topic ID is invalid'),
    z.null(),
  ]),
);

const commonMaterialFields = {
  topic_id: topicIdSchema,
  title: z.string('Title is required').trim().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  visibility: z.enum(Object.values(ENUMS.ClassMaterialsVisibility), 'Choose a visibility'),
};

const uploadedFileMaterialSchema = z.strictObject({
  ...commonMaterialFields,
  material_type: z.enum(uploadedMaterialTypes, 'Choose a supported material type'),
});

const linkMaterialSchema = z.strictObject({
  ...commonMaterialFields,
  material_type: z.literal(ENUMS.ClassMaterialsMaterialType.LINK),
  file_url: z
    .string('URL is required')
    .trim()
    .url('Enter a valid URL')
    .max(2048, 'URL is too long')
    .refine((value) => {
      try {
        return ['http:', 'https:'].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, 'URL must start with http:// or https://'),
});

export const createClassMaterialSchema = z.union([uploadedFileMaterialSchema, linkMaterialSchema]);

export const updateClassMaterialSchema = createClassMaterialSchema;
