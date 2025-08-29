import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Hono } from "hono";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

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

export default app;
