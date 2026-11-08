import mongoose from 'mongoose';
import { z } from 'zod';

const objectIdString = z
  .string({ required_error: 'ID is required' })
  .refine((val) => mongoose.isValidObjectId(val), { message: 'Invalid ID format' });

export const proposeAgreementSchema = z
  .object({
    conversation_id: objectIdString.optional(),
    conversationId: objectIdString.optional(),
    agreed_subject: z.string().trim().min(1, 'Subject is required').max(200).optional(),
    agreedSubject: z.string().trim().min(1, 'Subject is required').max(200).optional(),
    agreed_schedule: z.string().trim().min(1, 'Schedule is required').max(300).optional(),
    agreedSchedule: z.string().trim().min(1, 'Schedule is required').max(300).optional(),
    agreed_price: z.coerce.number().positive('Price must be positive').optional(),
    agreedPrice: z.coerce.number().positive('Price must be positive').optional(),
  })
  .strict();

export const confirmAgreementSchema = z
  .object({
    action: z.enum(['CONFIRM', 'REJECT', 'CANCEL']),
  })
  .strict();

export const rateTutorSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5),
    knowledge_rating: z.coerce.number().int().min(1).max(5).optional(),
    punctuality_rating: z.coerce.number().int().min(1).max(5).optional(),
    communication_rating: z.coerce.number().int().min(1).max(5).optional(),
    comment: z.string().trim().max(1000).optional(),
  })
  .strict();

