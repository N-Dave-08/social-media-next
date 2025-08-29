import { Hono } from "hono";
import { revokeRefreshToken } from "@/lib/token-utils";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.post("/", async (c) => {
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

export default app;
