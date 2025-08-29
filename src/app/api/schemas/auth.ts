import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  name: z.string().min(1),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});
