import { existsSync } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

export const processAvatarUpload = async (
  avatarFile: File,
  userId: string,
): Promise<{ fileName: string; avatarUrl: string }> => {
  // Enhanced file validation
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (!allowedTypes.includes(avatarFile.type.toLowerCase())) {
    throw new Error(
      "Invalid file type. Only JPG, PNG, GIF, and WebP are allowed",
    );
  }

  // Validate file size (max 2MB for better performance)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (avatarFile.size > maxSize) {
    throw new Error(
      `File size must be less than 2MB. Current size: ${(avatarFile.size / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  // Validate file extension matches MIME type
  const fileExtension = avatarFile.name.split(".").pop()?.toLowerCase();
  const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
  if (!fileExtension || !validExtensions.includes(fileExtension)) {
    throw new Error("Invalid file extension");
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
  } catch (_sharpError) {
    throw new Error("Failed to process image. Please try a different image.");
  }

  // Save the processed file to the avatars directory
  const filePath = join(avatarsDir, fileName);
  await writeFile(filePath, processedImageBuffer);

  // Store the public URL path with cache busting
  const avatarUrl = `/api/avatars/${fileName}?v=${timestamp}`;

  return { fileName, avatarUrl };
};

export const deleteAvatarFile = async (avatarUrl: string): Promise<void> => {
  try {
    // Extract filename from URL (remove /api/avatars/ prefix and query params)
    const urlParts = avatarUrl.split("?")[0]; // Remove query params
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
};
