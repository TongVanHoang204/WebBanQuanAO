
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const counts = await prisma.orders.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    console.log('STATUS COUNTS:', counts);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
