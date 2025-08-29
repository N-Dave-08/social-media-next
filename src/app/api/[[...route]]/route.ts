import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { type Context, Hono, type Next } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { handle } from "hono/vercel";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
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

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const commentSchema = z.object({
  content: z.string().min(1).max(500),
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
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          take: 3,
          orderBy: { createdAt: "desc" },
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
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          take: 3,
          orderBy: { createdAt: "desc" },
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

// Comment endpoints
app.post("/posts/:id/comments", authMiddleware, async (c) => {
  try {
    const postId = c.req.param("id");
    const userId = c.get("userId");
    const body = await c.req.json();
    const { content } = commentSchema.parse(body);

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

app.get("/posts/:id/comments", async (c) => {
  try {
    const postId = c.req.param("id");
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");
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

app.put("/comments/:id", authMiddleware, async (c) => {
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

app.delete("/comments/:id", authMiddleware, async (c) => {
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

// User profile routes
app.get("/users/me", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
  } catch (error) {
    console.error("Get user profile error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/users/me", authMiddleware, async (c) => {
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

app.put("/users/me/password", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isValidPassword) {
      return c.json({ error: "Current password is incorrect" }, 400);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return c.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input data" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Avatar management routes
app.put("/users/me/avatar", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const formData = await c.req.formData();
    const avatarFile = formData.get("avatar") as File;

    if (!avatarFile) {
      return c.json({ error: "Avatar file is required" }, 400);
    }

    // Enhanced file validation
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(avatarFile.type.toLowerCase())) {
      return c.json(
        {
          error: "Invalid file type. Only JPG, PNG, GIF, and WebP are allowed",
        },
        400,
      );
    }

    // Validate file size (max 2MB for better performance)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (avatarFile.size > maxSize) {
      return c.json(
        {
          error: `File size must be less than 2MB. Current size: ${(avatarFile.size / 1024 / 1024).toFixed(2)}MB`,
        },
        400,
      );
    }

    // Validate file extension matches MIME type
    const fileExtension = avatarFile.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return c.json({ error: "Invalid file extension" }, 400);
    }

    // Generate secure unique filename with UUID (always JPEG after processing)
    const timestamp = Date.now();
    const uuid = uuidv4();
    const fileName = `avatar_${userId}_${timestamp}_${uuid}.jpg`;

    // Create avatars directory if it doesn't exist
    const avatarsDir = join(process.cwd(), "public", "avatars");
    if (!existsSync(avatarsDir)) {
      await mkdir(avatarsDir, { recursive: true });
    }

    // Process image with Sharp to strip EXIF data and optimize
    const arrayBuffer = await avatarFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image with Sharp
    let processedImageBuffer: Buffer;
    try {
      processedImageBuffer = await sharp(buffer)
        .resize(400, 400, {
          // Resize to reasonable avatar size
          fit: "cover",
          position: "center",
        })
        .jpeg({
          quality: 85, // Good quality for avatars
          progressive: true, // Progressive JPEG for better loading
          mozjpeg: true, // Use mozjpeg for better compression
        })
        .toBuffer(); // Sharp automatically strips EXIF data when converting
    } catch (sharpError) {
      console.error("Image processing error:", sharpError);
      return c.json(
        { error: "Failed to process image. Please try a different image." },
        400,
      );
    }

    // Save the processed file to the avatars directory
    const filePath = join(avatarsDir, fileName);
    await writeFile(filePath, processedImageBuffer);

    // Store the public URL path with cache busting
    const avatarUrl = `/api/avatars/${fileName}?v=${timestamp}`;

    // Update user's avatar in database
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });

    return c.json({ avatar: avatarUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Serve avatar files
app.get("/avatars/:filename", async (c) => {
  try {
    const filename = c.req.param("filename");

    // Security: Validate filename format (prevent directory traversal)
    if (!filename.match(/^avatar_\w+_\d+_[a-f0-9-]{36}\.jpg$/)) {
      return c.json({ error: "Invalid filename format" }, 400);
    }

    const filePath = join(process.cwd(), "public", "avatars", filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      return c.json({ error: "Avatar not found" }, 404);
    }

    // Read and serve the file
    const fileBuffer = await readFile(filePath);

    // All processed avatars are JPEG
    const contentType = "image/jpeg";

    return new Response(Uint8Array.from(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        "X-Content-Type-Options": "nosniff", // Security header
        "X-Frame-Options": "DENY", // Security header
      },
    });
  } catch (error) {
    console.error("Avatar serve error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.delete("/users/me/avatar", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");

    // Get current user to find avatar file
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Remove avatar from user
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });

    // Delete the actual file if it exists
    if (user?.avatar) {
      try {
        // Extract filename from URL (remove /api/avatars/ prefix and query params)
        const urlParts = user.avatar.split("?")[0]; // Remove query params
        const filename = urlParts.replace("/api/avatars/", "");
        if (filename) {
          const filePath = join(process.cwd(), "public", "avatars", filename);
          if (existsSync(filePath)) {
            await unlink(filePath);
          }
        }
      } catch (fileError) {
        // Log error but don't fail the request
        console.error("Failed to delete avatar file:", fileError);
      }
    }

    return c.json({ message: "Avatar removed successfully" });
  } catch (error) {
    console.error("Avatar removal error:", error);
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
