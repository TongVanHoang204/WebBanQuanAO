import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if permissions table has data
    const perms: any[] = await prisma.$queryRaw`SELECT * FROM permissions`;
    console.log('✅ Permissions count:', perms.length);
    console.log('Roles:', perms.map(p => p.name).join(', '));

    // Check if we can select from users (to see if schema creates no runtime error on read)
    const users = await prisma.$queryRaw`SELECT id, email, role FROM users LIMIT 1`;
    console.log('✅ Users check:', users);

  } catch (e: any) {
    console.log('❌ Verify failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
