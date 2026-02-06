import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createNotificationsTable() {
  try {
    console.log('Creating notifications table...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS notifications (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NULL,
        type ENUM('order_new', 'order_status', 'product_low_stock', 'product_out_of_stock', 'system') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message VARCHAR(500) NOT NULL,
        link VARCHAR(255) NULL,
        is_read TINYINT(1) DEFAULT 0 NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_notifications_user (user_id),
        INDEX idx_notifications_read (is_read),
        INDEX idx_notifications_created (created_at),
        CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    
    console.log('✅ Notifications table created successfully!');
    
    // Create a test notification for admin
    const admin = await prisma.users.findFirst({
      where: { role: 'admin' }
    });
    
    if (admin) {
      await prisma.$executeRaw`
        INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
        VALUES (${admin.id}, 'system', 'Chào mừng!', 'Hệ thống thông báo đã được kích hoạt.', '/admin/dashboard', 0, NOW())
      `;
      console.log('✅ Test notification created for admin user!');
    }
    
  } catch (error) {
    console.error('Error creating notifications table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createNotificationsTable();
