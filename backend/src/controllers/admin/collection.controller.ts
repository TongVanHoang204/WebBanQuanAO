import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

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
      where: { id: BigInt(id) },
      include: {
        product_collections: {
          include: {
            product: { select: { id: true, name: true, cover_image: true, is_active: true } }
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
        products: collection.product_collections.map(pc => pc.product)
      }
    };
    res.json(JSON.parse(JSON.stringify(responseData, (key, value) => typeof value === 'bigint' ? value.toString() : value)));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const createCollection = async (req: Request, res: Response) => {
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

    const responseData = { success: true, data: collection };
    res.status(201).json(JSON.parse(JSON.stringify(responseData, (key, value) => typeof value === 'bigint' ? value.toString() : value)));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const updateCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, is_active, product_ids } = req.body;

    const collection = await prisma.collections.update({
      where: { id: BigInt(id) },
      data: {
        name, slug, description, image, is_active
      }
    });

    // If product_ids were passed, sync them
    if (Array.isArray(product_ids)) {
      await prisma.product_collections.deleteMany({
        where: { collection_id: BigInt(id) }
      });
      if (product_ids.length > 0) {
        await prisma.product_collections.createMany({
          data: product_ids.map((pid: string) => ({
            collection_id: BigInt(id),
            product_id: BigInt(pid)
          }))
        });
      }
    }

    const responseData = { success: true, data: collection };
    res.json(JSON.parse(JSON.stringify(responseData, (key, value) => typeof value === 'bigint' ? value.toString() : value)));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.collections.delete({
      where: { id: BigInt(id) }
    });
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
