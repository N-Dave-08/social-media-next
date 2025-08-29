import { Hono } from "hono";
import { refreshAccessToken } from "@/lib/token-utils";

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

export default app;
