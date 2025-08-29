import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authMiddleware } from "../../middleware/auth";
import { changePasswordSchema } from "../../schemas/auth";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>();

app.put("/me/password", authMiddleware, async (c) => {
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

export default app;
