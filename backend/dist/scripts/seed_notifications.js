import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Seeding notifications...');
    // 1. Find the admin user (assuming id 1 or username 'admin')
    const admin = await prisma.users.findFirst({
        where: {
            OR: [
                { id: 1 },
                { role: 'admin' }
            ]
        }
    });
    if (!admin) {
        console.error('No admin user found to seed notifications for.');
        return;
    }
    const userId = admin.id;
    console.log(`Found Admin User: ${admin.username} (ID: ${userId})`);
    // 2. Create Notifications
    const notifications = [
        {
            user_id: userId,
            type: 'order_new',
            title: 'Đơn hàng mới #ORD-123',
            message: 'Khách hàng Nguyễn Văn A vừa đặt đơn hàng trị giá 500.000đ',
            link: '/admin/orders/1',
            is_read: false
        },
        {
            user_id: userId,
            type: 'product_low_stock',
            title: 'Sản phẩm sắp hết hàng',
            message: 'Áo thun Basic (Size M) chỉ còn 2 sản phẩm trong kho.',
            link: '/admin/products/5',
            is_read: false
        },
        {
            user_id: userId,
            type: 'system',
            title: 'Hệ thống đã cập nhật',
            message: 'Phiên bản v1.2 đã được triển khai thành công.',
            is_read: true
        },
        {
            user_id: userId,
            type: 'order_status',
            title: 'Đơn hàng #ORD-999 đã hoàn thành',
            message: 'Giao hàng thành công cho khách hàng.',
            link: '/admin/orders/999',
            is_read: false
        }
    ];
    for (const n of notifications) {
        // @ts-ignore - enum handling might be strict
        await prisma.notifications.create({
            data: {
                ...n,
                // Ensure type cast if needed
                type: n.type
            }
        });
    }
    console.log(`✅ Default notifications added for user ${admin.username}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed_notifications.js.map