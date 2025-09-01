import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import {
  deleteAvatarFromS3,
  extractS3KeyFromUrl,
  uploadAvatarToS3,
} from "@/lib/storage/aws-s3";

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

  // Upload to S3
  const uploadResult = await uploadAvatarToS3(
    processedImageBuffer,
    fileName,
    "image/jpeg",
  );

  return {
    fileName: uploadResult.fileName,
    avatarUrl: uploadResult.avatarUrl,
  };
};

export const deleteAvatarFile = async (avatarUrl: string): Promise<void> => {
  try {
    const s3Key = extractS3KeyFromUrl(avatarUrl);
    if (s3Key) {
      await deleteAvatarFromS3(s3Key);
    }
  } catch (error) {
    console.error("Failed to delete avatar from S3:", error);
    // Don't throw error as this is cleanup operation
  }
};
