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

app.put("/:id", authMiddleware, async (c) => {
  try {
    const commentId = c.req.param("id");
    const userId = c.get("userId");
    const body = await c.req.json();
    const { content } = commentSchema.parse(body);

    // Check if comment exists and user owns it
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });

    if (!existingComment) {
      return c.json({ error: "Comment not found" }, 404);
    }

    if (existingComment.userId !== userId) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
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

    return c.json(updatedComment);
  } catch (error) {
    console.error("Update comment error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid comment data" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
