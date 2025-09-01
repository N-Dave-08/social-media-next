// Simple test file to verify AWS S3 configuration
// Run with: npx tsx src/lib/aws-s3.test.ts

import { resolve } from "node:path";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

describe("AWS S3 Configuration", () => {
  it("should have all required environment variables set", () => {
    const requiredEnvVars = [
      "AWS_REGION",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_S3_BUCKET_NAME",
    ];

    requiredEnvVars.forEach((varName) => {
      expect(process.env[varName]).toBeDefined();
      expect(process.env[varName]).not.toBe("");
    });
  });

  it("should have valid AWS region", () => {
    const region = process.env.AWS_REGION;
    expect(region).toBeDefined();
    expect(region).toMatch(/^[a-z0-9-]+$/);
  });

  it("should have CloudFront domain configured", () => {
    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
    expect(cloudfrontDomain).toBeDefined();
    expect(cloudfrontDomain).toContain("cloudfront.net");
  });

  it("should have valid S3 bucket name", () => {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    expect(bucketName).toBeDefined();
    expect(bucketName).toMatch(/^[a-z0-9-]+$/);
  });
});
