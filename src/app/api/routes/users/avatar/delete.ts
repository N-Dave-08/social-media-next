import { Hono } from "hono";
import { prisma } from "@/lib/db";
import { authMiddleware } from "../../../middleware/auth";
import { deleteAvatarFile } from "../../../utils/file-upload";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.delete("/me/avatar", authMiddleware, async (c) => {
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
      await deleteAvatarFile(user.avatar);
    }

    return c.json({ message: "Avatar removed successfully" });
  } catch (error) {
    console.error("Avatar removal error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
