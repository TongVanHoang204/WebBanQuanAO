
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugLatestOrder() {
  try {
    const order = await prisma.orders.findFirst({
      orderBy: { created_at: 'desc' },
      include: {
        payments: true
      }
    });

    console.log("LATEST ORDER DEBUG:");
    console.log(`Order ID: ${order?.id}`);
    console.log(`Status: ${order?.status}`);
    console.log(`Payments Count: ${order?.payments?.length}`);
    if (order?.payments && order.payments.length > 0) {
        console.log(`Payment Method: ${order?.payments[0].method}`);
        console.log(`Payment Status: ${order?.payments[0].status}`);
    } else {
        console.log("NO PAYMENTS FOUND");
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

debugLatestOrder();
