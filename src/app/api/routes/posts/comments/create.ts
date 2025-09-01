import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@/lib/database/db";
import { authMiddleware } from "../../../middleware/auth";
import { commentSchema } from "../../../schemas/comments";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.post("/", authMiddleware, async (c) => {
  try {
    const postId = c.req.param("postId");
    const userId = c.get("userId");
    const body = await c.req.json();
    const { content } = commentSchema.parse(body);

    if (!postId) {
      return c.json({ error: "Post ID is required" }, 400);
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        postId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return c.json(comment);
  } catch (error) {
    console.error("Create comment error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid comment data" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
