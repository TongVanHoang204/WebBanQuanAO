import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const serialize = <T>(value: T): T =>
  JSON.parse(
    JSON.stringify(value, (_key, currentValue) =>
      typeof currentValue === 'bigint' ? currentValue.toString() : currentValue
    )
  );

const productPreviewInclude: any = {
  category: {
    select: { id: true, name: true, slug: true }
  },
  product_images: {
    orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
    take: 1
  },
  product_variants: {
    where: { is_active: true },
    select: {
      id: true,
      price: true,
      compare_at_price: true,
      stock_qty: true
    }
  }
};

export const getFeaturedCollections = async (_req: Request, res: Response) => {
  try {
    const collections = await prisma.collections.findMany({
      where: {
        is_active: true,
        is_featured: true,
        product_collections: {
          some: {
            product: { is_active: true }
          }
        }
      },
      orderBy: [{ featured_sort_order: 'asc' }, { created_at: 'desc' }],
      take: 4,
      include: {
        _count: {
          select: { product_collections: true }
        },
        product_collections: {
          take: 3,
          include: {
            product: {
              include: {
                product_images: {
                  orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    const data = collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      image: collection.image || collection.product_collections[0]?.product.product_images?.[0]?.url || null,
      is_featured: collection.is_featured,
      featured_sort_order: collection.featured_sort_order,
      product_count: collection._count.product_collections,
      preview_images: collection.product_collections
        .map((item) => item.product.product_images?.[0]?.url)
        .filter(Boolean)
    }));

    res.json({
      success: true,
      data: serialize(data)
    });
  } catch (error) {
    console.error('getFeaturedCollections error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const getPublicCollectionBySlug = async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug || '');

    const collection = await prisma.collections.findUnique({
      where: { slug },
      include: {
        product_collections: {
          where: {
            product: { is_active: true }
          },
          include: {
            product: {
              include: productPreviewInclude
            }
          }
        }
      }
    });

    if (!collection || !collection.is_active) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ sưu tập' });
    }

    const products: any[] = collection.product_collections.map((item: any) => item.product);
    const coverImage = collection.image || products[0]?.product_images?.[0]?.url || null;

    res.json({
      success: true,
      data: serialize({
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        image: coverImage,
        product_count: products.length,
        products
      })
    });
  } catch (error) {
    console.error('getPublicCollectionBySlug error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
