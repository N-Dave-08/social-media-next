import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authMiddleware } from "../../middleware/auth";
import { updateProfileSchema } from "../../schemas/users";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.put("/me", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { name, username, email, bio } = updateProfileSchema.parse(body);

    // Check if username or email is already taken by another user
    if (username || email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(username ? [{ username }] : []),
                ...(email ? [{ email }] : []),
              ],
            },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.username === username) {
          return c.json({ error: "Username is already taken" }, 400);
        }
        if (existingUser.email === email) {
          return c.json({ error: "Email is already taken" }, 400);
        }
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(username && { username }),
        ...(email && { email }),
        ...(bio !== undefined && { bio }),
      },
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

    return c.json(updatedUser);
  } catch (error) {
    console.error("Update user profile error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input data" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
