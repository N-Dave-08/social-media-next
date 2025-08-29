import { Hono } from "hono";
import { prisma } from "@/lib/db";
import { authMiddleware } from "../../../middleware/auth";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.delete("/:id", authMiddleware, async (c) => {
  try {
    const commentId = c.req.param("id");
    const userId = c.get("userId");

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

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return c.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
