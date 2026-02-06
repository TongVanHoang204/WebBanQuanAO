import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server.js';

// Helper to convert BigInt to string for JSON serialization
const serializeCategory = (category: any): any => {
  return JSON.parse(JSON.stringify(category, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

// Build category tree recursively
const buildCategoryTree = (categories: any[], parentId: bigint | null = null): any[] => {
  return categories
    .filter(cat => {
      if (parentId === null) {
        return cat.parent_id === null;
      }
      return cat.parent_id?.toString() === parentId.toString();
    })
    .map(cat => ({
      ...cat,
      id: cat.id.toString(),
      parent_id: cat.parent_id?.toString() || null,
      children: buildCategoryTree(categories, cat.id)
    }));
};

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { include_inactive } = req.query;
    const where: any = {};
    
    if (include_inactive !== 'true') {
      where.is_active = true;
    }

    const categories = await prisma.categories.findMany({
      where,
      orderBy: [
        { sort_order: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    // Build hierarchical tree
    const tree = buildCategoryTree(categories);

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;

    const category = await prisma.categories.findUnique({
      where: { slug: slug as string },
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        },
        children: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' }
        },
        category_options: {
          include: {
            option: {
              include: {
                option_values: {
                  orderBy: { sort_order: 'asc' }
                }
              }
            }
          },
          orderBy: { sort_order: 'asc' }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: { message: 'Category not found' }
      });
    }

    res.json({
      success: true,
      data: serializeCategory(category)
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    const { page = '1', limit = '12' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));

    const category = await prisma.categories.findUnique({
      where: { slug: slug as string },
      include: {
        children: { select: { id: true } }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: { message: 'Category not found' }
      });
    }

    // Include products from children categories
    const categoryIds = [category.id, ...category.children.map((c: { id: bigint }) => c.id)];

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: {
          category_id: { in: categoryIds },
          is_active: true
        },
        orderBy: { created_at: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          product_images: {
            where: { is_primary: true },
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
        }
      }),
      prisma.products.count({
        where: {
          category_id: { in: categoryIds },
          is_active: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        category: serializeCategory(category),
        products: products.map(p => JSON.parse(JSON.stringify(p, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        ))),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, parent_id, sort_order, is_active } = req.body;

    const category = await prisma.categories.create({
      data: {
        name,
        slug,
        parent_id: parent_id ? BigInt(parent_id) : null,
        sort_order: sort_order ? parseInt(sort_order) : 0,
        is_active: is_active ?? true
      }
    });

    res.status(201).json({
      success: true,
      data: serializeCategory(category)
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, slug, parent_id, sort_order, is_active } = req.body;

    const category = await prisma.categories.update({
      where: { id: BigInt(id as string) },
      data: {
        name,
        slug,
        parent_id: parent_id ? BigInt(parent_id) : null,
        sort_order: sort_order ? parseInt(sort_order) : undefined,
        is_active: is_active
      }
    });

    res.json({
      success: true,
      data: serializeCategory(category)
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const categoryId = BigInt(id as string);

    // Check if category has linked products
    const productCount = await prisma.products.count({
      where: { category_id: categoryId }
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục này vì đang có ${productCount} sản phẩm liên kết. Vui lòng chuyển sản phẩm sang danh mục khác trước.`
      });
    }

    // Check if category has children
    const childrenCount = await prisma.categories.count({
      where: { parent_id: categoryId }
    });

    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục này vì đang có ${childrenCount} danh mục con. Vui lòng xóa danh mục con trước.`
      });
    }

    await prisma.categories.delete({
      where: { id: categoryId }
    });
    res.json({ success: true, message: 'Xóa danh mục thành công' });
  } catch (error) {
    next(error);
  }
};
