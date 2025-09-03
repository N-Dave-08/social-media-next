import { Hono } from "hono";
import { prisma } from "@/lib/database/db";

const app = new Hono();

// Basic health check for load balancer (no database check)
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "social-media-app",
  });
});

// Detailed health check with database connectivity
app.get("/health/detailed", async (c) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "social-media-app",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return c.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        service: "social-media-app",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      503,
    );
  }
});

export default app;
