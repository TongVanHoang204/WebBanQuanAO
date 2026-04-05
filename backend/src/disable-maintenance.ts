import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function disableMaintenance() {
  try {
    await prisma.settings.upsert({
      where: { key: 'maintenance_mode' },
      update: { value: 'false' },
      create: { key: 'maintenance_mode', value: 'false' }
    });
    console.log('Successfully disabled maintenance mode in the database.');
  } catch (error) {
    console.error('Error disabling maintenance mode:', error);
  } finally {
    await prisma.$disconnect();
  }
}

disableMaintenance();
