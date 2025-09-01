// Simple test file to verify AWS S3 configuration
// Run with: npx tsx src/lib/aws-s3.test.ts

import { resolve } from "node:path";
import { config } from "dotenv";

// Load environment variables from .env.local (only in local development)
if (process.env.NODE_ENV !== "test") {
  config({ path: resolve(process.cwd(), ".env.local") });
}

describe("AWS S3 Configuration", () => {
  // Skip these tests in CI/CD if AWS credentials aren't available
  const hasAwsCredentials =
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME;

  describe("when AWS credentials are available", () => {
    beforeAll(() => {
      // Skip this describe block if no AWS credentials
      if (!hasAwsCredentials) {
        console.log("⚠️ Skipping AWS tests - no credentials available");
      }
    });

    it("should have all required environment variables set", () => {
      if (!hasAwsCredentials) {
        console.log("⏭️ Skipping test - no AWS credentials");
        return;
      }

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
      if (!hasAwsCredentials) {
        console.log("⏭️ Skipping test - no AWS credentials");
        return;
      }

      const region = process.env.AWS_REGION;
      expect(region).toBeDefined();
      expect(region).toMatch(/^[a-z0-9-]+$/);
    });

    it("should have CloudFront domain configured", () => {
      if (!hasAwsCredentials) {
        console.log("⏭️ Skipping test - no AWS credentials");
        return;
      }

      const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
      expect(cloudfrontDomain).toBeDefined();
      expect(cloudfrontDomain).toContain("cloudfront.net");
    });

    it("should have valid S3 bucket name", () => {
      if (!hasAwsCredentials) {
        console.log("⏭️ Skipping test - no AWS credentials");
        return;
      }

      const bucketName = process.env.AWS_S3_BUCKET_NAME;
      expect(bucketName).toBeDefined();
      expect(bucketName).toMatch(/^[a-z0-9-]+$/);
    });
  });

  // Always run this test to ensure basic environment setup
  it("should have basic environment configuration", () => {
    expect(process.env.NODE_ENV).toBeDefined();
    expect(process.env.NODE_ENV).toBe("test");
  });
});
