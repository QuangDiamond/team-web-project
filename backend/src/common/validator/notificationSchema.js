import { z } from 'zod';

export const updatePreferencesSchema = z
  .object({
    enable_in_app: z.boolean().optional(),
    enable_email: z.boolean().optional(),
    enable_sms: z.boolean().optional(),
    notify_on_sessions: z.boolean().optional(),
    notify_on_assignments: z.boolean().optional(),
    notify_on_messages: z.boolean().optional(),
  })
  .strict();

