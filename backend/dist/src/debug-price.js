import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const products = await prisma.products.findMany({
        where: { name: { contains: 'Quần đùi bơi' } },
        include: {
            product_variants: true
        }
    });
    if (products.length === 0) {
        console.log('No products found');
        return;
    }
    products.forEach(product => {
        console.log('Product:', JSON.stringify({
            id: product.id.toString(),
            name: product.name,
            base_price: Number(product.base_price),
            compare_at_price: Number(product.compare_at_price),
            variants: product.product_variants.map(v => ({
                id: v.id.toString(),
                sku: v.variant_sku,
                price: Number(v.price)
            }))
        }, null, 2));
    });
}
// Remove old code
async function unused() {
}
main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
//# sourceMappingURL=debug-price.js.map