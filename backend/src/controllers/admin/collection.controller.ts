import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { logActivity } from '../../services/logger.service.js';
import { deepDiff } from '../../utils/deepDiff.js';

export const getCollections = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      prisma.collections.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: { product_collections: true }
          }
        }
      }),
      prisma.collections.count()
    ]);

    const formatted = collections.map(c => ({
      ...c,
      product_count: c._count.product_collections
    }));

    const responseData = {
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
    };
    res.json(JSON.parse(JSON.stringify(responseData, (key, value) => typeof value === 'bigint' ? value.toString() : value)));
  } catch (error) {
    console.error('getCollections error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const getCollectionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const collection = await prisma.collections.findUnique({
      where: { id: BigInt(id as string) },
      include: {
        product_collections: {
          include: {
            product: { 
              select: { 
                id: true, 
                name: true, 
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

    const responseData = {
      success: true,
      data: {
        ...collection,
        products: collection.product_collections.map(pc => ({
          ...pc.product,
          cover_image: pc.product.product_images?.[0]?.url || '',
          product_images: undefined
        }))
      }
    };
    res.json(JSON.parse(JSON.stringify(responseData, (key, value) => typeof value === 'bigint' ? value.toString() : value)));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const createCollection = async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description, image, is_active } = req.body;

    // Auto-generate slug if not provided, very basic version
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const exist = await prisma.collections.findUnique({ where: { slug: finalSlug } });
    if (exist) {
      return res.status(400).json({ success: false, message: 'Đường dẫn (slug) đã tồn tại' });
    }

    const collection = await prisma.collections.create({
      data: {
        name,
        slug: finalSlug,
        description,
        image,
        is_active: is_active ?? true
      }
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Tạo bộ sưu tập',
      entity_type: 'collection',
      entity_id: String(collection.id),
      details: { name: collection.name, slug: collection.slug },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    const responseData = { success: true, data: collection };
    res.status(201).json(JSON.parse(JSON.stringify(responseData, (key, value) => typeof value === 'bigint' ? value.toString() : value)));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const updateCollection = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, is_active, product_ids } = req.body;

    const existing = await prisma.collections.findUnique({
      where: { id: BigInt(id as string) }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ sưu tập' });
    }

    const collection = await prisma.collections.update({
      where: { id: BigInt(id as string) },
      data: {
        name, slug, description, image, is_active
      }
    });

    // If product_ids were passed, sync them
    if (Array.isArray(product_ids)) {
      await prisma.product_collections.deleteMany({
        where: { collection_id: BigInt(id as string) }
      });
      if (product_ids.length > 0) {
        await prisma.product_collections.createMany({
          data: product_ids.map((pid: string) => ({
            collection_id: BigInt(id as string),
            product_id: BigInt(pid)
          }))
        });
      }
    }

    const beforeStats = { name: existing.name, slug: existing.slug, description: existing.description, is_active: existing.is_active };
    const afterStats = { name: collection.name, slug: collection.slug, description: collection.description, is_active: collection.is_active };
    
    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Cập nhật bộ sưu tập',
      entity_type: 'collection',
      entity_id: String(id),
      details: { before: beforeStats, after: afterStats, diff: deepDiff(beforeStats, afterStats) },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    const responseData = { success: true, data: collection };
    res.json(JSON.parse(JSON.stringify(responseData, (key, value) => typeof value === 'bigint' ? value.toString() : value)));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const deleteCollection = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.collections.findUnique({
      where: { id: BigInt(id as string) }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ sưu tập' });
    }
    
    await prisma.collections.delete({
      where: { id: BigInt(id as string) }
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Xóa bộ sưu tập',
      entity_type: 'collection',
      entity_id: String(id),
      details: { deleted_data: { id: String(existing.id), name: existing.name, slug: existing.slug } },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
