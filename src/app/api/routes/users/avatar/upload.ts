import { Hono } from "hono";
import { prisma } from "@/lib/database/db";
import { authMiddleware } from "../../../middleware/auth";
import { processAvatarUpload } from "../../../utils/file-upload";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.put("/me/avatar", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const formData = await c.req.formData();
    const avatarFile = formData.get("avatar") as File;

    if (!avatarFile) {
      return c.json({ error: "Avatar file is required" }, 400);
    }

    // Process avatar upload
    const { avatarUrl } = await processAvatarUpload(avatarFile, userId);

    // Update user's avatar in database
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });

    return c.json({ avatar: avatarUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
