import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { prisma } from "@/lib/db";
import { generateTokenPair } from "@/lib/token-utils";
import { signupSchema } from "../../schemas/auth";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.post("/", async (c) => {
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

export default app;
