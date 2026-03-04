import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function disableMaintenance() {
  try {
    await prisma.$executeRaw`
      UPDATE settings 
      SET value = 'false', updated_at = NOW() 
      WHERE \`key\` = 'maintenance_mode'
    `;
    console.log('Successfully disabled maintenance mode in the database.');
  } catch (error) {
    console.error('Error disabling maintenance mode:', error);
  } finally {
    await prisma.$disconnect();
  }
}

disableMaintenance();
