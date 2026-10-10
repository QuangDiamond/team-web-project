import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(6, "Username must have at least 6 character"),
  email: z.string().email("Input must be email"),
  password: z.string().min(8, "Password must have at least 8 character"),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(8, "Password must have at least 8 character"),
});