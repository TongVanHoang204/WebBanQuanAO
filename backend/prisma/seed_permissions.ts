import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔑 Seeding default permissions/roles...');

  // Create default roles (these are referenced by users.role column)
  const roles = [
    { name: 'admin', description: 'Administrator with full access' },
    { name: 'customer', description: 'Regular customer account' },
    { name: 'staff', description: 'Staff member with limited admin access' },
  ];

  for (const role of roles) {
    await prisma.permissions.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    console.log(`✅ Created/verified role: ${role.name}`);
  }

  console.log('🎉 Permissions seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
