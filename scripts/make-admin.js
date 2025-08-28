const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function makeAdmin(email) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
      },
    });

    console.log("✅ User updated to admin:", user);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log("Usage: node scripts/make-admin.js <email>");
  console.log("Example: node scripts/make-admin.js user@example.com");
  process.exit(1);
}

makeAdmin(email);
