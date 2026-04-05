import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { createNotification } from '../controllers/admin/notificationController.js';
import { transitionOrderStatus } from './order-workflow.service.js';

const PAYMENT_TIMEOUT_MINUTES = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '30', 10); // Configurable via env, default 30 min

export const initializeScheduler = () => {
  // Check for abandoned carts every day at 10:00 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('⏰ Running Abandoned Cart Check...');
    await checkAbandonedCarts();
  });

  // Check for expired pending bank transfer orders every minute
  cron.schedule('* * * * *', async () => {
    await cancelExpiredBankTransferOrders();
  });

  console.log('✅ Scheduler initialized');
};

/**
 * Cancel pending bank transfer/momo orders that have exceeded the payment timeout.
 * Restores stock for all order items.
 */
const cancelExpiredBankTransferOrders = async () => {
  try {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - PAYMENT_TIMEOUT_MINUTES);

    // Find pending orders that:
    // 1. Status is 'pending'
    // 2. Created more than 5 minutes ago
    // 3. Payment method is NOT 'cod' (which doesn't require upfront payment)
    const expiredOrders = await prisma.orders.findMany({
      where: {
        status: 'pending',
        created_at: { lt: cutoffTime },
        payments: {
          some: {
            method: { in: ['bank_transfer', 'momo'] }
          }
        }
      },
      include: {
        order_items: true,
        user: true
      }
    });

    if (expiredOrders.length === 0) return;

    console.log(`⏰ Found ${expiredOrders.length} expired bank transfer orders to cancel...`);

    for (const order of expiredOrders) {
      try {
        await prisma.$transaction((tx) =>
          transitionOrderStatus(tx as any, order.id, 'cancelled')
        );

        // Send notification to user
        if (order.user_id) {
          await createNotification({
            user_id: order.user_id,
            type: 'order',
            title: 'Đơn hàng đã bị hủy',
            message: `Đơn hàng #${order.order_code} đã bị hủy do hết thời gian thanh toán (${PAYMENT_TIMEOUT_MINUTES} phút).`,
            link: `/orders`
          });
        }

        console.log(`✅ Auto-cancelled expired order ${order.order_code}`);
      } catch (orderErr) {
        console.error(`Failed to cancel order ${order.order_code}:`, orderErr);
      }
    }

  } catch (error) {
    console.error('Error checking expired orders:', error);
  }
};

/**
 * Find carts updated more than 24h ago but less than 48h ago (to avoid spamming)
 * and send notification to user.
 */
const checkAbandonedCarts = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dayBeforeYesterday = new Date();
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

    // Find carts that:
    // 1. Have items
    // 2. Belong to a registered user
    // 3. Updated between 24h and 48h ago
    const abandonedCarts = await prisma.carts.findMany({
      where: {
        updated_at: {
          lt: yesterday,
          gt: dayBeforeYesterday
        },
        user_id: { not: null },
        cart_items: { some: {} } // Has items
      },
      include: {
        user: true,
        cart_items: true
      }
    });

    console.log(`Found ${abandonedCarts.length} abandoned carts.`);

    for (const cart of abandonedCarts) {
      if (!cart.user_id) continue;

      // Check if user already has a pending notification about this? 
      // Simplified: Just update/create notification
      
      await createNotification({
        user_id: cart.user_id,
        type: 'system', // or new type 'promotion'
        title: 'Bạn quên gì đó trong giỏ hàng kìa! 🛒',
        message: 'Các sản phẩm trong giỏ hàng đang chờ bạn. Hoàn tất đơn hàng ngay để nhận ưu đãi nhé!',
        link: '/cart'
      });

      console.log(`Sent abandoned cart notification to user ${cart.user_id}`);
    }

  } catch (error) {
    console.error('Error checking abandoned carts:', error);
  }
};
