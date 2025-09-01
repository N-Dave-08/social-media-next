import type { Context, Next } from "hono";
import { verifyToken } from "@/lib/auth/token-utils";

type Variables = {
  userId: string;
  userRole: string;
};

export const authMiddleware = async (
  c: Context<{ Variables: Variables }>,
  next: Next,
) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "No token provided" }, 401);
  }

  try {
    const decoded = verifyToken(token);

    if (decoded.type !== "access") {
      return c.json({ error: "Invalid token type" }, 401);
    }

    c.set("userId", decoded.userId);
    c.set("userRole", decoded.role);
    await next();
  } catch (_error) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};
