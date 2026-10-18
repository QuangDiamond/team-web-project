import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(6, "Username must have at least 6 character"),
  email: z.string().email("Input must be email"),
  password: z.string().min(8, "Password must have at least 8 character"),
  role: z.enum(["TUTOR", "PARENT", "STUDENT", "ADMIN"], "Role must be one of these ['TUTOR', 'PARENT', 'STUDENT', 'ADMIN']")
});

export const loginSchema = z.object({
  email: z.string().email("Input must be email").min(1, "Email is required"),
  password: z.string().min(8, "Password must have at least 8 character"),
});