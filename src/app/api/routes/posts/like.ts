import { Hono } from "hono";
import { prisma } from "@/lib/db";
import { authMiddleware } from "../../middleware/auth";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.post("/posts/:id/like", authMiddleware, async (c) => {
  try {
    const postId = c.req.param("id");
    const userId = c.get("userId");

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      return c.json({ liked: false });
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId,
          postId,
        },
      });
      return c.json({ liked: true });
    }
  } catch (error) {
    console.error("Like post error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
