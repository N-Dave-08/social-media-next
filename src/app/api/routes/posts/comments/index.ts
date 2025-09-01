import { Hono } from "hono";
import { prisma } from "@/lib/database/db";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.get("/", async (c) => {
  try {
    const postId = c.req.param("postId");
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: { postId },
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
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const totalComments = await prisma.comment.count({ where: { postId } });

    return c.json({
      comments,
      pagination: {
        page,
        limit,
        total: totalComments,
        totalPages: Math.ceil(totalComments / limit),
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
