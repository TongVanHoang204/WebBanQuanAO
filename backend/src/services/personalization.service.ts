import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const trackProductView = async (userId: bigint, productId: bigint) => {
  try {
    await prisma.user_views.create({
      data: {
        user_id: userId,
        product_id: productId
      }
    });
  } catch (error) {
    console.error('Failed to track product view:', error);
  }
};

export const getRecommendedProducts = async (userId: bigint, limit = 8) => {
  try {
    // 1. Get recent viewing history
    const recentViews = await prisma.user_views.findMany({
      where: { user_id: userId },
      orderBy: { viewed_at: 'desc' },
      take: 20,
      include: { product: { select: { category_id: true } } }
    });

    // 2. Get past order items
    const pastOrders = await prisma.order_items.findMany({
      where: { order: { user_id: userId } },
      take: 10,
      include: { product: { select: { category_id: true } } }
    });

    // 3. Extract preferred categories
    const categoryCounts: Record<string, number> = {};
    
    // Weight orders more than views
    pastOrders.forEach(item => {
      if (item.product.category_id) {
        const catId = item.product.category_id.toString();
        categoryCounts[catId] = (categoryCounts[catId] || 0) + 3;
      }
    });

    recentViews.forEach(view => {
      if (view.product.category_id) {
        const catId = view.product.category_id.toString();
        categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
      }
    });

    const topCategoryIds = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => BigInt(id));

    // 4. Query products from these categories that the user hasn't recently bought
    const boughtProductIds = pastOrders.map(i => i.product_id);

    let recommended = await prisma.products.findMany({
      where: {
        is_active: true,
        category_id: { in: topCategoryIds },
        id: { notIn: boughtProductIds }
      },
      take: limit,
      include: {
        product_images: {
          where: { is_primary: true },
          take: 1
        },
        product_variants: {
          where: { is_active: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // 5. Fallback to newest products if we didn't get enough recommendations
    if (recommended.length < limit) {
      const fallbackLimit = limit - recommended.length;
      const ignoreIds = [...boughtProductIds, ...recommended.map(r => r.id)];
      
      const fallbackProducts = await prisma.products.findMany({
        where: {
          is_active: true,
          id: { notIn: ignoreIds }
        },
        take: fallbackLimit,
        orderBy: { base_price: 'desc' }, // Just a different sort
        include: {
          product_images: { where: { is_primary: true }, take: 1 },
          product_variants: { where: { is_active: true } }
        }
      });
      
      recommended = [...recommended, ...fallbackProducts];
    }

    return recommended;
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return [];
  }
};
