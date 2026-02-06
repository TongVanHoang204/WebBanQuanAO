import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LogData {
  user_id?: bigint;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

export const logActivity = async (data: LogData) => {
  try {
    await prisma.activity_logs.create({
      data: {
        user_id: data.user_id || null,
        action: data.action,
        entity_type: data.entity_type || null,
        entity_id: data.entity_id ? String(data.entity_id) : null,
        details: data.details ? JSON.stringify(data.details) : null,
        ip_address: data.ip_address || null,
        user_agent: data.user_agent || null
      }
    });
  } catch (error) {
    console.error('Failed to create activity log:', error);
    // Don't throw error to avoid blocking main flow
  }
};
