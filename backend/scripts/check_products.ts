import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.products.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      base_price: true,
      compare_at_price: true,
    }
  });

  console.log('Total products:', products.length);
  for (const p of products) {
    console.log(`- ${p.name} | Base: ${p.base_price} | Compare: ${p.compare_at_price}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
