import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.permissions.upsert({
      where: { name: 'admin' },
      update: { description: 'Quan tri vien he thong' },
      create: { name: 'admin', description: 'Quan tri vien he thong' }
    });
    console.log('Seeded admin role');

    await prisma.permissions.upsert({
      where: { name: 'customer' },
      update: { description: 'Khach hang' },
      create: { name: 'customer', description: 'Khach hang' }
    });
    console.log('Seeded customer role');
  } catch (e: any) {
    console.error('Seeding failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
