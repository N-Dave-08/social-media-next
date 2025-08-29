import { Hono } from "hono";
import { revokeAllRefreshTokens } from "@/lib/token-utils";
import { authMiddleware } from "../../middleware/auth";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.post("/", authMiddleware, async (c) => {
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

export default app;
