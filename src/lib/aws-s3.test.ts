// Simple test file to verify AWS S3 configuration
// Run with: npx tsx src/lib/aws-s3.test.ts

import { config } from "dotenv";
import { resolve } from "path";
// Removed unused imports since this is just a configuration test

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

async function testS3Connection() {
  try {
    console.log("Testing AWS S3 connection...");

    // Check if environment variables are set
    const requiredEnvVars = [
      "AWS_REGION",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_S3_BUCKET_NAME",
    ];

    console.log("🔍 Checking environment variables:");
    requiredEnvVars.forEach((varName) => {
      const value = process.env[varName];
      if (value) {
        console.log(
          `✅ ${varName}: ${varName.includes("SECRET") ? "***HIDDEN***" : value}`,
        );
      } else {
        console.log(`❌ ${varName}: NOT SET`);
      }
    });

    // Check CloudFront domain
    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
    if (cloudfrontDomain) {
      console.log(`✅ CLOUDFRONT_DOMAIN: ${cloudfrontDomain}`);
    } else {
      console.log(`❌ CLOUDFRONT_DOMAIN: NOT SET`);
    }

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingVars.length > 0) {
      console.error("❌ Missing environment variables:", missingVars);
      console.log("Please set these in your .env.local file");
      return;
    }

    console.log("\n✅ All environment variables are set!");
    console.log("✅ AWS S3 client should be configured");
    console.log("📦 Bucket name:", process.env.AWS_S3_BUCKET_NAME);
    console.log("🌍 Region:", process.env.AWS_REGION);

    // Note: We can't test actual upload without a real file
    // This is just a configuration test
  } catch (error) {
    console.error("❌ S3 configuration error:", error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testS3Connection();
}
