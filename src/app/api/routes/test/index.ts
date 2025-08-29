import { Hono } from "hono";
import { prisma } from "@/lib/db";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.get("/test", (c) => {
  return c.json({ message: "API is working!" });
});

app.get("/test-db", async (c) => {
  try {
    const userCount = await prisma.user.count();
    return c.json({
      message: "Database connected!",
      userCount,
      databaseUrl: `${process.env.DATABASE_URL?.substring(0, 30)}...`,
    });
  } catch (error) {
    console.error("Database error:", error);
    return c.json(
      {
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default app;
