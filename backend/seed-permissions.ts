import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Seed Admin role
    await prisma.$executeRaw`
      INSERT INTO permissions (name, description, created_at)
      VALUES ('admin', 'Quản trị viên hệ thống', NOW())
      ON DUPLICATE KEY UPDATE description = 'Quản trị viên hệ thống'
    `;
    console.log('✅ Seeded admin role');

    // Seed Customer role
    await prisma.$executeRaw`
      INSERT INTO permissions (name, description, created_at)
      VALUES ('customer', 'Khách hàng', NOW())
      ON DUPLICATE KEY UPDATE description = 'Khách hàng'
    `;
    console.log('✅ Seeded customer role');

  } catch (e: any) {
    console.error('❌ Seeding failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
