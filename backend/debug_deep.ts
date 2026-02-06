
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- DB ORDER ANALYTICS ---');
    
    // 1. Total Count
    const total = await prisma.orders.count();
    console.log(`[1] Total Orders in DB: ${total}`);

    // 2. Status Distribution
    const statusDist = await prisma.orders.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });
    console.log('[2] Status Distribution:');
    statusDist.forEach(s => console.log(`   - ${s.status}: ${s._count.id}`));

    // 3. Simulate "All" Query (Empty Where)
    const allWhere = {};
    const countAll = await prisma.orders.count({ where: allWhere });
    console.log(`[3] Count with empty where: ${countAll}`);

    // 4. Simulate "Pending" Query
    const pendingWhere = { status: 'pending' };
    const countPending = await prisma.orders.count({ where: pendingWhere });
    console.log(`[4] Count with status='pending': ${countPending}`);

    // 5. Simulate Search (Space check)
    const spaceWhere = {
      OR: [
        { order_code: { contains: ' ' } },
        { customer_name: { contains: ' ' } }
      ]
    };
    const countSpace = await prisma.orders.count({ where: spaceWhere });
    console.log(`[5] Count with space in name/code: ${countSpace}`);
    
    // 6. Check for soft delete column if exists? (Inspect first order)
    const sample = await prisma.orders.findFirst();
    // console.log('Sample Order Keys:', Object.keys(sample || {}));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
