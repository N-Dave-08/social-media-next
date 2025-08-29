import { Hono } from "hono";
import { prisma } from "@/lib/db";
import { adminMiddleware } from "../../middleware/admin";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.patch("/admin/users/:id/role", adminMiddleware, async (c) => {
  try {
    const userId = c.req.param("id");
    const { role } = await c.req.json();

    if (!["USER", "ADMIN"].includes(role)) {
      return c.json({ error: "Invalid role" }, 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
      },
    });

    return c.json(updatedUser);
  } catch (error) {
    console.error("Update user role error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
