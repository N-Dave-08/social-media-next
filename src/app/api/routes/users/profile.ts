import { Hono } from "hono";
import { prisma } from "@/lib/db";
import { authMiddleware } from "../../middleware/auth";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.get("/me", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
  } catch (error) {
    console.error("Get user profile error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
