import { PrismaClient } from '@prisma/client';

// Singleton Pattern: tránh tạo nhiều PrismaClient instance
// Mỗi instance quản lý connection pool riêng → cạn kiệt DB connections
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
