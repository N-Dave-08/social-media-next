const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error("❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env file");
      process.exit(1);
    }

    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      console.log("ℹ️ Admin user already exists:", existingUser.email);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create new admin user with hashed password
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        username: "admin",
        name: "System Administrator",
        bio: "System administrator account",
        password: hashedPassword, // Now properly hashed!
        role: "ADMIN",
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log(" Email:", adminUser.email);
    console.log("👤 Username:", adminUser.username);
    console.log(" Role:", adminUser.role);
    console.log("📅 Created:", adminUser.createdAt);
    console.log("\n You can now log in with these credentials!");
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);

    if (error.code === "P2002") {
      console.error(" This usually means the email or username already exists");
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createAdminUser();
