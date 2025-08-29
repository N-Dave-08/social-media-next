import type { Context, Next } from "hono";
import { authMiddleware } from "./auth";

type Variables = {
  userId: string;
  userRole: string;
};

export const adminMiddleware = async (
  c: Context<{ Variables: Variables }>,
  next: Next,
) => {
  await authMiddleware(c, next);

  const userRole = c.get("userRole");
  if (userRole !== "ADMIN") {
    return c.json({ error: "Admin access required" }, 403);
  }
};
