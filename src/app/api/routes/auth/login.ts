import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { prisma } from "@/lib/db";
import { generateTokenPair } from "@/lib/token-utils";
import { loginSchema } from "../../schemas/auth";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.post("/", async (c) => {
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

export default app;
