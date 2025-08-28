import bcrypt from "bcryptjs";
import { type Context, Hono, type Next } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { handle } from "hono/vercel";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  generateTokenPair,
  refreshAccessToken,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  verifyToken,
} from "@/lib/token-utils";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>().basePath("/api");

// Middleware
app.use(
  "*",
  cors({
    origin: (origin) => origin,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use("*", logger());

// JWT middleware
const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "No token provided" }, 401);
  }

  try {
    const decoded = verifyToken(token);

    if (decoded.type !== "access") {
      return c.json({ error: "Invalid token type" }, 401);
    }

    c.set("userId", decoded.userId);
    c.set("userRole", decoded.role);
    await next();
  } catch (_error) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};

// Admin middleware
const adminMiddleware = async (c: Context, next: Next) => {
  await authMiddleware(c, next);

  const userRole = c.get("userRole");
  if (userRole !== "ADMIN") {
    return c.json({ error: "Admin access required" }, 403);
  }
};

// Schemas
const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  name: z.string().min(1),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const postSchema = z.object({
  content: z.string().min(1).max(280),
});

// Test route
app.get("/test", (c) => {
  return c.json({ message: "API is working!" });
});

// Auth routes
app.post("/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, username, name, password } = signupSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return c.json({ error: "User already exists" }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate token pair
    const { accessToken, refreshToken } = await generateTokenPair(
      user.id,
      user.role,
    );

    // Set refresh token as httpOnly cookie
    c.header(
      "Set-Cookie",
      `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
    );

    return c.json({ user, accessToken });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Generate token pair
    const { accessToken, refreshToken } = await generateTokenPair(
      user.id,
      user.role,
    );

    // Set refresh token as httpOnly cookie
    c.header(
      "Set-Cookie",
      `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
    );

    const { password: _, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword, accessToken });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Refresh token endpoint
app.post("/auth/refresh", async (c) => {
  try {
    // Get refresh token from cookie
    const cookieHeader = c.req.header("Cookie");
    const refreshToken = cookieHeader
      ?.split(";")
      .find((cookie) => cookie.trim().startsWith("refreshToken="))
      ?.split("=")[1];

    if (!refreshToken) {
      return c.json({ error: "No refresh token provided" }, 401);
    }

    // Refresh the access token
    const tokenPair = await refreshAccessToken(refreshToken);

    if (!tokenPair) {
      return c.json({ error: "Invalid or expired refresh token" }, 401);
    }

    // Set new refresh token as httpOnly cookie
    c.header(
      "Set-Cookie",
      `refreshToken=${tokenPair.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
    );

    return c.json({ accessToken: tokenPair.accessToken });
  } catch (error) {
    console.error("Refresh error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Logout endpoint
app.post("/auth/logout", async (c) => {
  try {
    // Get refresh token from cookie
    const cookieHeader = c.req.header("Cookie");
    const refreshToken = cookieHeader
      ?.split(";")
      .find((cookie) => cookie.trim().startsWith("refreshToken="))
      ?.split("=")[1];

    if (refreshToken) {
      // Revoke refresh token
      await revokeRefreshToken(refreshToken);
    }

    // Clear refresh token cookie
    c.header(
      "Set-Cookie",
      "refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
    );

    return c.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Logout all devices endpoint
app.post("/auth/logout-all", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");

    // Revoke all refresh tokens for the user
    await revokeAllRefreshTokens(userId);

    // Clear refresh token cookie
    c.header(
      "Set-Cookie",
      "refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
    );

    return c.json({ message: "Logged out from all devices" });
  } catch (error) {
    console.error("Logout all error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Posts routes
app.get("/posts", async (c) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return c.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/posts", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { content } = postSchema.parse(body);
    const userId = c.get("userId");

    const post = await prisma.post.create({
      data: {
        content,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return c.json(post);
  } catch (error) {
    console.error("Create post error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Like/Unlike post
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

// Admin routes
app.get("/admin/users", adminMiddleware, async (c) => {
  try {
    const search = c.req.query("search") || "";
    const role = c.req.query("role") || "";
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = (page - 1) * limit;

    // Build where clause for filtering
    const where: Prisma.UserWhereInput = {};

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add role filter
    if (role && role !== "ALL") {
      where.role = role as "USER" | "ADMIN";
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });

    // Get filtered users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    return c.json({
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

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

// TEST
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

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
