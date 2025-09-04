import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Get admin credentials from environment variables (REQUIRED)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log(
      "⚠️ ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required",
    );
    console.log("ℹ️ Skipping admin user creation - no credentials provided");
    return;
  }

  console.log("🔍 Checking if admin user exists...");
  console.log("📧 Admin email:", adminEmail);

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("✅ Admin user already exists:", existingAdmin.email);
    console.log("👤 Role:", existingAdmin.role);
    return;
  }

  console.log("🔐 Creating admin user...");

  // Hash the admin password
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      username: "admin",
      name: "System Administrator",
    },
  });

  console.log("✅ Admin user created successfully!");
  console.log("📧 Email:", adminUser.email);
  console.log("👤 Role:", adminUser.role);
  console.log("🆔 ID:", adminUser.id);

  // You can add more seed data here
  console.log("🌱 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
