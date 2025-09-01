import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN; // Optional: for CDN

export interface UploadResult {
  fileName: string;
  avatarUrl: string;
  s3Key: string;
}

export const uploadAvatarToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<UploadResult> => {
  const s3Key = `avatars/${fileName}`; // Keep organized folder structure in S3

  const uploadCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000", // Cache for 1 year
    ContentDisposition: "inline", // Ensure images display in browser
    // Removed ACL since bucket has ACLs disabled
  });

  await s3Client.send(uploadCommand);

  // Generate the public URL
  const avatarUrl = CLOUDFRONT_DOMAIN
    ? `https://${CLOUDFRONT_DOMAIN}/${s3Key}`
    : `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${s3Key}`;

  return {
    fileName,
    avatarUrl,
    s3Key,
  };
};

export const deleteAvatarFromS3 = async (s3Key: string): Promise<void> => {
  const deleteCommand = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  await s3Client.send(deleteCommand);
};

export const generatePresignedUrl = async (
  s3Key: string,
  operation: "get" | "put" = "get",
  expiresIn: number = 3600,
): Promise<string> => {
  const command =
    operation === "get"
      ? new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key })
      : new PutObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key });

  return getSignedUrl(s3Client, command, { expiresIn });
};

export const extractS3KeyFromUrl = (avatarUrl: string): string | null => {
  if (CLOUDFRONT_DOMAIN && avatarUrl.includes(CLOUDFRONT_DOMAIN)) {
    return avatarUrl.replace(`https://${CLOUDFRONT_DOMAIN}/`, "");
  }

  if (avatarUrl.includes(BUCKET_NAME)) {
    const urlParts = avatarUrl.split(BUCKET_NAME);
    if (urlParts.length > 1) {
      return urlParts[1].substring(1); // Remove leading slash
    }
  }

  return null;
};
