import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
});
