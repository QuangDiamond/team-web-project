import { z } from 'zod';

// Role được phép tự đăng ký (không cho tự đăng ký ADMIN)
const REGISTER_ROLES = ["TUTOR", "PARENT", "STUDENT"];

// BR-01: 8–64 ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số
const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password must be at most 64 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit");

const fullNameRule = z
  .string()
  .trim()
  .min(1, "Full name is required")
  .max(100, "Full name must be at most 100 characters");

const roleRule = z.enum(REGISTER_ROLES, "Role must be one of these ['TUTOR', 'PARENT', 'STUDENT']");

const agreeTermsRule = z.literal(true, "You must agree to the Terms of Service");

export const registerSchema = z
  .object({
    full_name: fullNameRule,
    email: z.string().trim().email("Input must be email"),
    password: passwordRule,
    confirm_password: z.string().min(1, "Confirm password is required"),
    role: roleRule,
    agree_terms: agreeTermsRule,
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Confirm password does not match",
    path: ["confirm_password"],
  });

export const loginSchema = z.object({
  email: z.string().email("Input must be email").min(1, "Email is required"),
  password: z.string().min(8, "Password must have at least 8 character"),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email("Input must be email"),
});

export const googleCompleteSchema = z.object({
  ticket: z.string().min(1, "Ticket is required"),
  full_name: fullNameRule,
  role: roleRule,
  agree_terms: agreeTermsRule,
});
