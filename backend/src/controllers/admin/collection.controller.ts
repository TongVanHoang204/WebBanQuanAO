import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { logActivity } from '../../services/logger.service.js';
import { deepDiff } from '../../utils/deepDiff.js';

const serialize = (value: any) =>
  JSON.parse(
    JSON.stringify(value, (_key, currentValue) =>
      typeof currentValue === 'bigint' ? currentValue.toString() : currentValue
    )
  );

export const getCollections = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      prisma.collections.findMany({
        skip,
        take: limit,
        orderBy: [
          { is_featured: 'desc' },
          { featured_sort_order: 'asc' },
          { created_at: 'desc' }
        ],
        include: {
          _count: {
            select: { product_collections: true }
          }
        }
      }),
      prisma.collections.count()
    ]);

    const formatted = collections.map((collection) => ({
      ...collection,
      product_count: collection._count.product_collections
    }));

    res.json(
      serialize({
        success: true,
        data: {
          collections: formatted,
          pagination: {
            page,
            limit,
            totalItems: total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    );
  } catch (error) {
    console.error('getCollections error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const getCollectionById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const collection = await prisma.collections.findUnique({
      where: { id: BigInt(id) },
      include: {
        product_collections: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true
                  }
                },
                is_active: true,
                product_images: {
                  where: { is_primary: true },
                  take: 1,
                  select: { url: true }
                }
              }
            }
          }
        }
      }
    });

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ sưu tập' });
    }

    res.json(
      serialize({
        success: true,
        data: {
          ...collection,
          products: collection.product_collections.map((productCollection) => ({
            ...productCollection.product,
            cover_image: productCollection.product.product_images?.[0]?.url || '',
            product_images: undefined
          }))
        }
      })
    );
  } catch (error) {
    console.error('getCollectionById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const createCollection = async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description, image, is_active, is_featured, featured_sort_order, product_ids } = req.body;

    const finalSlug =
      slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existingCollection = await prisma.collections.findUnique({ where: { slug: finalSlug } });
    if (existingCollection) {
      return res.status(400).json({ success: false, message: 'Đường dẫn (slug) đã tồn tại' });
    }

    const collection = await prisma.collections.create({
      data: {
        name,
        slug: finalSlug,
        description,
        image,
        is_active: is_active ?? true,
        is_featured: is_featured ?? false,
        featured_sort_order: Number(featured_sort_order) || 0
      }
    });

    if (Array.isArray(product_ids) && product_ids.length > 0) {
      await prisma.product_collections.createMany({
        data: product_ids.map((productId: string) => ({
          collection_id: collection.id,
          product_id: BigInt(productId)
        })),
        skipDuplicates: true
      });
    }

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Tạo bộ sưu tập',
      entity_type: 'collection',
      entity_id: String(collection.id),
      details: {
        name: collection.name,
        slug: collection.slug,
        is_featured: collection.is_featured,
        featured_sort_order: collection.featured_sort_order
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(201).json(serialize({ success: true, data: collection }));
  } catch (error) {
    console.error('createCollection error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const updateCollection = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const { name, slug, description, image, is_active, is_featured, featured_sort_order, product_ids } = req.body;

    const existing = await prisma.collections.findUnique({
      where: { id: BigInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ sưu tập' });
    }

    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.collections.findUnique({ where: { slug } });
      if (slugConflict && slugConflict.id !== BigInt(id)) {
        return res.status(400).json({ success: false, message: 'Đường dẫn (slug) đã tồn tại' });
      }
    }

    const collection = await prisma.collections.update({
      where: { id: BigInt(id) },
      data: {
        name,
        slug,
        description,
        image,
        is_active,
        is_featured,
        featured_sort_order: featured_sort_order === undefined ? undefined : Number(featured_sort_order) || 0
      }
    });

    if (Array.isArray(product_ids)) {
      await prisma.product_collections.deleteMany({
        where: { collection_id: BigInt(id) }
      });

      if (product_ids.length > 0) {
        await prisma.product_collections.createMany({
          data: product_ids.map((productId: string) => ({
            collection_id: BigInt(id),
            product_id: BigInt(productId)
          }))
        });
      }
    }

    const beforeStats = {
      name: existing.name,
      slug: existing.slug,
      description: existing.description,
      is_active: existing.is_active,
      is_featured: existing.is_featured,
      featured_sort_order: existing.featured_sort_order
    };
    const afterStats = {
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      is_active: collection.is_active,
      is_featured: collection.is_featured,
      featured_sort_order: collection.featured_sort_order
    };

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Cập nhật bộ sưu tập',
      entity_type: 'collection',
      entity_id: id,
      details: {
        before: beforeStats,
        after: afterStats,
        diff: deepDiff(beforeStats, afterStats)
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json(serialize({ success: true, data: collection }));
  } catch (error) {
    console.error('updateCollection error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const deleteCollection = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id || '');

    const existing = await prisma.collections.findUnique({
      where: { id: BigInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ sưu tập' });
    }

    await prisma.collections.delete({
      where: { id: BigInt(id) }
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Xóa bộ sưu tập',
      entity_type: 'collection',
      entity_id: id,
      details: {
        deleted_data: {
          id: String(existing.id),
          name: existing.name,
          slug: existing.slug
        }
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    console.error('deleteCollection error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
