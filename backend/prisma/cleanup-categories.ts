import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting duplicate categories from seed...');
  
  const slugsToDelete = [
    'ao-nam', 'quan-nam', 'ao-nu', 'quan-nu', 'vay-dam', 
    'tui-xach', 'giay-dep', 'phu-kien', 'do-the-thao', 'do-ngu'
  ];

  for (const slug of slugsToDelete) {
    try {
      await prisma.categories.delete({ where: { slug } });
      console.log('✅ Deleted:', slug);
    } catch (e) {
      console.log('⏭️ Not found or has products:', slug);
    }
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
