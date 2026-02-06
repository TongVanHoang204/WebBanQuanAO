import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Checking orders data...');
    const allOrders = await prisma.orders.findMany({
        select: {
            id: true,
            created_at: true,
            status: true,
            grand_total: true
        },
        orderBy: {
            created_at: 'desc'
        },
        take: 10
    });
    console.log(`Total orders found: ${allOrders.length} (showing max 10)`);
    if (allOrders.length === 0) {
        console.log('No orders in database.');
        return;
    }
    allOrders.forEach(o => {
        console.log(`Order ${o.id}: Date=${o.created_at}, Status=${o.status}, Total=${o.grand_total}`);
    });
    // Check query logic
    const revenueStats = await prisma.$queryRaw `
    SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, SUM(grand_total) as total
    FROM orders
    WHERE status IN ('paid', 'completed')
    AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
    ORDER BY date ASC
  `;
    console.log('Revenue Stats (Raw Query Result):', revenueStats);
    const weeklyStats = await prisma.$queryRaw `
    SELECT DATE_FORMAT(created_at, '%a') as day, COUNT(*) as count
    FROM orders
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY day, DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `;
    console.log('Weekly Stats (Raw Query Result):', weeklyStats);
}
main()
    .catch(e => console.error(e))
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=check-orders.js.map