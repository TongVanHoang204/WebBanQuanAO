import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 FROM settings LIMIT 1`;
    console.log('✅ Settings table exists!');
  } catch (e: any) {
    console.log('❌ Settings table check failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
