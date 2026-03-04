import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin2@shopfeshen.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.users.upsert({
    where: { email },
    update: {
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
    },
    create: {
      email,
      username: 'admin2',
      password_hash: hashedPassword,
      full_name: 'Admin User',
      phone: '0123456789',
      role: 'admin',
      status: 'active',
    },
  });

  console.log(`Admin user ready: ${admin.email} / ${password}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
