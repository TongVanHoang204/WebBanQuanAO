import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../server.js';
import { ApiError } from '../../middlewares/error.middleware.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { createProductSchema, updateProductSchema } from '../../validators/product.validator.js';
import { Prisma } from '@prisma/client';
import { logActivity } from '../../services/logger.service.js';
import { deepDiff, createDeleteSnapshot } from '../../utils/deepDiff.js';
import { getIO } from '../../socket.js';
import { enrichOrderWorkflowState } from '../../services/order-workflow.service.js';
import { assertCanManageTargetUser, assertCanReadTargetUser, canAssignRole, getReadableRoles } from '../../utils/access-control.js';

// Helper to convert BigInt to string for JSON serialization
const serialize = (data: any) => {
  const enrich = (value: any): any => {
    if (Array.isArray(value)) return value.map(enrich);
    if (!value || typeof value !== 'object') return value;

    const next = { ...value };
    return 'admin_note' in next ? enrichOrderWorkflowState(next) : next;
  };

  return JSON.parse(JSON.stringify(enrich(data), (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

// Helper to get diff between two objects (using deepDiff utility)
const getDiff = deepDiff;

// Generate slug from name
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Helper recursive function to get all descendant category IDs
const getDescendantCategoryIds = async (parentId: bigint): Promise<bigint[]> => {
  const children = await prisma.categories.findMany({
    where: { parent_id: parentId },
    select: { id: true }
  });

  let ids = children.map(c => c.id);
  for (const child of children) {
    const descendantIds = await getDescendantCategoryIds(child.id);
    ids = [...ids, ...descendantIds];
  }
  return ids;
};

// PRODUCT MANAGEMENT
export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createProductSchema.parse(req.body);

    // 1. Create Base Product
    const product = await prisma.$transaction(async (tx) => {
      // Create Product Record
      const newProduct = await tx.products.create({
        data: {
          category_id: data.category_id ? BigInt(data.category_id) : null,
          brand_id: data.brand_id ? BigInt(data.brand_id) : null,
          sku: data.sku,
          name: data.name,
          slug: data.slug, // Assumes unique check handled or catch error
          description: data.description,
          base_price: data.base_price,
          compare_at_price: data.compare_at_price,
          is_active: data.is_active,
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          meta_keywords: data.meta_keywords,
          tags: data.tags,
          weight: data.weight ? new Prisma.Decimal(data.weight) : undefined,
          length: data.length ? new Prisma.Decimal(data.length) : undefined,
          width: data.width ? new Prisma.Decimal(data.width) : undefined,
          height: data.height ? new Prisma.Decimal(data.height) : undefined,
        } as any
      });

      const productId = newProduct.id;

      // 2. Handle Attributes (Options)
      // data.attributes = [{ name: "Color", values: ["Red", "Blue"] }]
      const optionMap = new Map<string, bigint>(); // "Color" -> OptionID
      const valueMap = new Map<string, bigint>();  // "Color:Red" -> ValueID

      if (data.attributes && data.attributes.length > 0) {
        for (const attr of data.attributes) {
            // Upsert Option
            // Note: Prisma upsert requires a unique constraint on 'name' or 'code'.
            // Assuming 'options' has a unique constraint on 'name' or 'code'.
            // If not, we should ideally use it. For now, let's use code which is usually unique.
            const code = attr.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            
            // Try to find first, if not create. 
            // Better: tx.options.upsert if name is unique.
            // If not unique in schema, we stick to findFirst but we add a try-catch loop or rely on constraint error.
            // Best practice without schema change: Use findFirst but handle unique constraint error if parallel creates happen.
            // However, the cleanest fix for "Race Condition" IS upsert.
            // Let's assume we can use upsert on 'code' if it's unique, or 'name'.
            // If schema doesn't support upsert (no unique), we can't easily fix without schema change.
            // Assuming current schema allows duplicate names (bad), we will use logic to minimize race:
            // "Upsert-like" logic with find-create-find fallback.
            
            let option = await tx.options.findFirst({ where: { name: attr.name } });
            if (!option) {
                try {
                   option = await tx.options.create({ data: { name: attr.name, code } });
                } catch (e) {
                   // If race condition hit (unique constraint violation), fetch again
                   option = await tx.options.findFirst({ where: { name: attr.name } });
                }
            }
            if (!option) throw new Error(`Could not create or find option ${attr.name}`);
            
            optionMap.set(attr.name, option.id);

            // Handle Values
            for (const val of attr.values) {
                let optionValue = await tx.option_values.findFirst({
                    where: { option_id: option.id, value: val }
                });
                if (!optionValue) {
                    try {
                        optionValue = await tx.option_values.create({
                            data: { option_id: option.id, value: val }
                        });
                    } catch (e) {
                         optionValue = await tx.option_values.findFirst({
                            where: { option_id: option.id, value: val }
                        });
                    }
                }
                if (!optionValue) throw new Error(`Could not create value ${val}`);
                
                valueMap.set(`${attr.name}:${val}`, optionValue.id);

                // Link to Product (product_attributes)
                await tx.product_attributes.create({
                    data: {
                        product_id: productId,
                        option_id: option.id,
                        option_value_id: optionValue.id
                    }
                });
            }
        }
      }

      // 3. Handle Variants
      if (data.variants && data.variants.length > 0) {
        for (const v of data.variants) {
            // Create Variant
            const variant = await tx.product_variants.create({
                data: {
                    product_id: productId,
                    variant_sku: v.variant_sku || v.sku || `${data.sku}-${Date.now()}`,
                    price: v.price || data.base_price,
                    cost: v.cost,
                    stock_qty: v.stock_qty,
                    is_active: v.is_active,
                    weight: v.weight ? new Prisma.Decimal(v.weight) : undefined
                } as any
            });

            // Link Variant Option Values
            if (v.options) {
                for (const [optName, optVal] of Object.entries(v.options)) {
                    const valueKey = `${optName}:${optVal}`;
                    const valueId = valueMap.get(valueKey);
                    if (valueId) {
                        await tx.variant_option_values.create({
                            data: {
                                variant_id: variant.id,
                                option_value_id: valueId
                            }
                        });
                    }
                }
            }
        }
      } else {
        // Create Default Single Variant if no variants provided (Simple Product)
        await tx.product_variants.create({
            data: {
                product_id: productId,
                variant_sku: data.sku,
                price: data.base_price,
                stock_qty: 0, // Default or passed param?
                is_active: true
            }
        });
      }

      // 4. Handle Images
      if (data.images && data.images.length > 0) {
        await tx.product_images.createMany({
          data: data.images.map((img, index) => ({
            product_id: productId,
            url: img.url,
            alt_text: img.alt_text,
            is_primary: index === 0 || img.is_primary,
            sort_order: img.sort_order ?? index
          }))
        });
      }

      return newProduct;
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Tạo sản phẩm mới',
      entity_type: 'product',
      entity_id: String(product.id),
      details: { name: product.name, sku: product.sku },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      data: serialize(product)
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = updateProductSchema.parse(req.body);

    const existingProduct = await prisma.products.findUnique({
      where: { id: BigInt(id as string) },
      include: {
        product_variants: true,
        product_images: true
      }
    });

    if (!existingProduct) {
      throw new ApiError(404, 'Product not found');
    }

    // Update product
    const product = await prisma.$transaction(async (tx) => {
      // Update base product
      const updated = await tx.products.update({
        where: { id: BigInt(id as string) },
        data: {
          category_id: data.category_id ? BigInt(data.category_id) : undefined,
          brand_id: data.brand_id ? BigInt(data.brand_id) : undefined,
          sku: data.sku,
          name: data.name,
          slug: data.slug,
          description: data.description,
          base_price: data.base_price,
          compare_at_price: data.compare_at_price,
          is_active: data.is_active,
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          meta_keywords: data.meta_keywords,
          tags: data.tags,
          weight: data.weight ? new Prisma.Decimal(data.weight) : undefined,
          length: data.length ? new Prisma.Decimal(data.length) : undefined,
          width: data.width ? new Prisma.Decimal(data.width) : undefined,
          height: data.height ? new Prisma.Decimal(data.height) : undefined,
        }
      });

      // Handle variants
      if (data.variants) {
        // Delete removed variants
        const variantIds = data.variants.filter(v => v.id).map(v => BigInt(v.id!));
        await tx.product_variants.deleteMany({
          where: {
            product_id: BigInt(id as string),
            id: { notIn: variantIds }
          }
        });

        // Upsert variants
        for (const v of data.variants) {
          if (v.id) {
            await tx.product_variants.update({
              where: { id: BigInt(v.id) },
              data: {
                variant_sku: v.variant_sku,
                price: v.price,
                compare_at_price: v.compare_at_price,
                cost: v.cost,
                stock_qty: v.stock_qty,
                is_active: v.is_active
              }
            });
          } else {
            await tx.product_variants.create({
              data: {
                product_id: BigInt(id as string),
                variant_sku: v.variant_sku || v.sku || `${data.sku}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                price: v.price,
                compare_at_price: v.compare_at_price,
                cost: v.cost,
                stock_qty: v.stock_qty ?? 0,
                is_active: v.is_active ?? true
              }
            });
          }
        }
      }

      // Handle images
      if (data.images) {
        // Delete old images
        await tx.product_images.deleteMany({
          where: { product_id: BigInt(id as string) }
        });

        // Create new images
        await tx.product_images.createMany({
          data: data.images.map((img, index) => ({
            product_id: BigInt(id as string),
            url: img.url,
            alt_text: img.alt_text,
            is_primary: index === 0 || img.is_primary,
            sort_order: img.sort_order ?? index
          }))
        });
      }

      return updated;
    });

    // Get full product
    const fullProduct = await prisma.products.findUnique({
      where: { id: BigInt(id as string) },
      include: {
        product_variants: true,
        product_images: true,
        category: true
      }
    });

    // Build a normalized old-data snapshot matching the frontend payload shape
    const serialized = serialize(existingProduct) as any;
    const oldSnapshot: Record<string, any> = {};
    // Only include fields that exist in the update payload
    for (const key of Object.keys(data)) {
      if (key === 'variants') {
        // Map product_variants → variants, normalizing field names
        oldSnapshot.variants = (serialized.product_variants || []).map((v: any) => ({
          id: v.id ? Number(v.id) : undefined,
          sku: v.variant_sku,          // DB: variant_sku → Frontend: sku
          variant_sku: v.variant_sku,
          price: v.price ? Number(v.price) : 0,
          stock_qty: v.stock_qty ?? 0,
          is_active: v.is_active ?? true,
        }));
      } else if (key === 'images') {
        // Map product_images → images, only compare url/is_primary/sort_order
        oldSnapshot.images = (serialized.product_images || []).map((img: any) => ({
          url: img.url,
          is_primary: img.is_primary ?? false,
          sort_order: img.sort_order ?? 0,
        }));
      } else if (key === 'attributes') {
        // attributes don't exist in DB product row, skip to avoid null→value
        continue;
      } else if (key in serialized) {
        oldSnapshot[key] = serialized[key];
      }
    }
    
    // Also normalize the new data variants to strip options for cleaner diff
    const normalizedNewData: Record<string, any> = { ...data };
    if (normalizedNewData.variants) {
      normalizedNewData.variants = normalizedNewData.variants.map((v: any) => ({
        id: v.id ? Number(v.id) : undefined,
        sku: v.sku || v.variant_sku,
        variant_sku: v.variant_sku || v.sku,
        price: v.price ? Number(v.price) : 0,
        stock_qty: v.stock_qty ?? 0,
        is_active: v.is_active ?? true,
      }));
    }
    if (normalizedNewData.images) {
      normalizedNewData.images = normalizedNewData.images.map((img: any) => ({
        url: img.url,
        is_primary: img.is_primary ?? false,
        sort_order: img.sort_order ?? 0,
      }));
    }
    // Remove attributes from diff (no old data to compare)
    delete normalizedNewData.attributes;
    
    const diff = getDiff(oldSnapshot, normalizedNewData);
    
    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Cập nhật sản phẩm',
      entity_type: 'product',
      entity_id: String(id),
      details: { diff, updates: data },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: serialize(fullProduct)
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const status = req.query.status as string;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } }
      ];
    }

    if (category) {
      const normalizedCategory = category.trim();
      let categoryIds: bigint[] = [];

      if (/^\d+$/.test(normalizedCategory)) {
        const catId = BigInt(normalizedCategory);
        categoryIds = [catId, ...(await getDescendantCategoryIds(catId))];
      } else {
        const categoryData = await prisma.categories.findUnique({
          where: { slug: normalizedCategory },
          select: { id: true }
        });
        if (categoryData) {
          categoryIds = [categoryData.id, ...(await getDescendantCategoryIds(categoryData.id))];
        }
      }

      if (categoryIds.length > 0) {
        where.category_id = { in: categoryIds };
      } else if (!/^\d+$/.test(normalizedCategory)) {
        // If slug search and no category found, force no results
        where.category_id = BigInt(0);
      }
    }

    if (status) {
      where.is_active = status === 'active';
    }

    const [total, products] = await Promise.all([
      prisma.products.count({ where }),
      prisma.products.findMany({
        where,
        include: {
          category: true,
          product_images: {
            orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
            take: 1
          },
          _count: {
             select: { product_variants: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' }
      })
    ]);

    res.json({
      success: true,
      data: serialize(products),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const productId = BigInt(id as string);

    // Get all variant IDs of this product
    const variants = await prisma.product_variants.findMany({
      where: { product_id: productId },
      select: { id: true }
    });
    const variantIds = variants.map(v => v.id);

    // Check if product variants are in any user's cart
    if (variantIds.length > 0) {
      const cartItemCount = await prisma.cart_items.count({
        where: { variant_id: { in: variantIds } }
      });

      if (cartItemCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Không thể xóa sản phẩm này vì đang có ${cartItemCount} khách hàng giữ trong giỏ hàng.`
        });
      }
    }

    // Check if product is in any pending/processing orders
    const pendingOrderItems = await prisma.order_items.count({
      where: {
        product_id: productId,
        order: {
          status: { in: ['pending', 'confirmed', 'processing', 'shipped'] }
        }
      }
    });

    if (pendingOrderItems > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa sản phẩm này vì đang có ${pendingOrderItems} đơn hàng chưa hoàn thành.`
      });
    }

    // Snapshot before delete for forensics
    const productToDelete = await prisma.products.findUnique({
      where: { id: productId },
      include: { product_variants: true, category: true }
    });
    const snapshot = productToDelete ? createDeleteSnapshot(serialize(productToDelete)) : {};

    await prisma.products.delete({
      where: { id: productId }
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Xóa sản phẩm',
      entity_type: 'product',
      entity_id: String(id),
      details: { deleted_data: snapshot },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    next(error);
  }
};

// DASHBOARD STATS
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const range = req.query.range as string || '7days';
    
    let dateFilter = '';
    let groupFormat = '%Y-%m-%d';
    
    if (range === '7days') {
      dateFilter = `AND orders.created_at >= DATE_SUB(Now(), INTERVAL 7 DAY)`;
    } else if (range === '30days') {
      dateFilter = `AND orders.created_at >= DATE_SUB(Now(), INTERVAL 30 DAY)`;
    } else if (range === 'this_month') {
      dateFilter = `AND MONTH(orders.created_at) = MONTH(Now()) AND YEAR(orders.created_at) = YEAR(Now())`;
    } else if (range === 'this_year') {
      dateFilter = `AND YEAR(orders.created_at) = YEAR(Now())`;
      groupFormat = '%Y-%m';
    }

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      pendingOrders,
      recentOrders,
      topItemsRaw,
      salesOverTimeRaw,
      ordersThisWeekRaw
    ] = await Promise.all([
      prisma.products.count({ where: { is_active: true } }),
      prisma.orders.count({ where: { status: { in: ['paid', 'completed'] } } }),
      prisma.users.count({ where: { role: 'customer' } }),
      prisma.orders.count({ where: { status: 'pending' } }),
      prisma.orders.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { username: true, email: true } }
        }
      }),
      // top products
      prisma.$queryRawUnsafe(`
        SELECT product_id, SUM(qty) as sold, SUM(unit_price * qty) as revenue
        FROM order_items
        JOIN orders ON orders.id = order_items.order_id
        WHERE orders.status IN ('paid', 'completed')
        ${dateFilter}
        GROUP BY product_id
        ORDER BY sold DESC
        LIMIT 5
      `),
      // sales over time
      prisma.$queryRawUnsafe(`
        SELECT DATE_FORMAT(created_at, '${groupFormat}') as date, SUM(grand_total) as total
        FROM orders
        WHERE status IN ('paid', 'completed')
        ${dateFilter}
        GROUP BY DATE_FORMAT(created_at, '${groupFormat}')
        ORDER BY date ASC
      `),
      // orders this week equivalent
      prisma.$queryRawUnsafe(`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as day, COUNT(*) as count
        FROM orders
        WHERE status IN ('paid', 'completed', 'pending', 'processing', 'shipped')
        ${dateFilter}
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY day ASC
      `)
    ]);

    let topProducts: any[] = [];
    if (Array.isArray(topItemsRaw) && topItemsRaw.length > 0) {
      const pIds = (topItemsRaw as any[]).map(t => typeof t.product_id === 'bigint' ? t.product_id : BigInt(t.product_id));
      const products = await prisma.products.findMany({
        where: { id: { in: pIds } },
        select: { id: true, name: true, sku: true }
      });
      
      topProducts = (topItemsRaw as any[]).map(t => {
        const pIdBigInt = typeof t.product_id === 'bigint' ? t.product_id : BigInt(t.product_id);
        const product = products.find(p => p.id === pIdBigInt);
        return {
          id: pIdBigInt.toString(),
          name: product ? product.name : 'Unknown Product',
          sku: product ? product.sku : '',
          sold: Number(t.sold) || 0,
          revenue: Number(t.revenue) || 0
        };
      });
    }

    // Get revenue stats
    const revenueStats: any = await prisma.$queryRawUnsafe(`
      SELECT SUM(grand_total) as total
      FROM orders
      WHERE status IN ('paid', 'completed') ${dateFilter}
    `);
    const totalRevenue = (Array.isArray(revenueStats) && revenueStats.length > 0) ? Number(revenueStats[0].total || 0) : 0;

    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalUsers,
        pendingOrders,
        totalRevenue: totalRevenue,
        recentOrders: serialize(recentOrders),
        topProducts: serialize(topProducts),
        salesOverTime: serialize(salesOverTimeRaw), 
        ordersThisWeek: serialize(ordersThisWeekRaw)
      }
    });
  } catch (error) {
    console.error("DASHBOARD STATS ERROR", error);
    next(error);
  }
};

// ORDER MANAGEMENT
export const getAdminOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    console.log('GET ORDERS QUERY:', { page, limit, search, status });

    const where: any = {};

    // Search by Order Code or Customer Name
    if (search && search !== 'undefined' && search !== 'null') {
      where.OR = [
        { order_code: { contains: search } },
        { customer_name: { contains: search } },
        { user: { username: { contains: search } } } // Also search by registered username
      ];
    }

    // Filter by Status
    // Map Frontend Tabs to Backend Status
    // "New" -> pending
    // "Processing" -> processing
    // "Delivering" -> shipped
    // "Completed" -> completed
    if (status && status !== 'all' && status !== 'undefined' && status !== 'null') {
      if (status === 'delivering') {
        where.status = 'shipped'; // Map 'delivering' UI term to 'shipped' DB enum
      } else if (status === 'new') {
         where.status = 'pending';
      } else if (status === 'refund_requested') {
        where.status = 'completed';
        where.admin_note = { contains: '[REFUND_REQUESTED]' };
      } else {
        where.status = status;
        // Handle confirmed status if matches DB enum
      }
    }

    console.log('GET ORDERS WHERE:', JSON.stringify(where, null, 2));

    // Get specific stats for Order Page
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Calculate trends
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const [orders, total, stats, trendsHelper] = await Promise.all([
      // Get Orders List
      prisma.orders.findMany({
        where,
        include: {
          user: { select: { username: true, email: true } },
          payments: { select: { status: true, method: true } }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      // Get Total Count
      prisma.orders.count({ where }),
      // Get Stats Headers (Global, not filtered by search)
      prisma.$transaction([
        prisma.orders.count(), // Total
        prisma.orders.count({ where: { status: 'pending' } }), // Pending
        prisma.orders.count({ where: { status: 'shipped' } }), // Delivering
        prisma.orders.aggregate({
           where: { 
             created_at: { gte: today },
             status: { not: 'cancelled' } 
           },
           _sum: { grand_total: true }
        }) // Revenue Today
      ]),
      // Get Data for Trends (Snapshot of yesterday)
      prisma.$transaction([
         // Orders Yesterday
         prisma.orders.count({ 
           where: { 
             created_at: { gte: yesterday, lt: today } 
           } 
         }),
         // Orders Today
         prisma.orders.count({ 
           where: { 
             created_at: { gte: today } 
           } 
         }),
         // Revenue Yesterday
         prisma.orders.aggregate({
            where: { 
              created_at: { gte: yesterday, lt: today },
              status: { not: 'cancelled' } 
            },
            _sum: { grand_total: true }
         }),
         // Shipments Yesterday (Proxy for Delivering Trend)
         prisma.shipments.count({
            where: {
               shipped_at: { gte: yesterday, lt: today }
            }
         }),
         // Shipments Today
         prisma.shipments.count({
            where: {
               shipped_at: { gte: today }
            }
         })
      ])
    ]);

    const revenueToday = Number(stats[3]._sum.grand_total || 0);
    const revenueYesterday = Number(trendsHelper[2]._sum.grand_total || 0);
    const ordersToday = trendsHelper[1];
    const ordersYesterday = trendsHelper[0];
    const shipmentsToday = trendsHelper[4];
    const shipmentsYesterday = trendsHelper[3];

    // For "Pending", we use "New Orders Today" as the trend proxy, 
    // because "Pending" is the entry state for all orders.
    // So if New Orders are up 5%, then Pending inflow is up 5%.
    const pendingTrend = calculateTrend(ordersToday, ordersYesterday);

    res.json({
      success: true,
      data: {
        orders: serialize(orders),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalOrders: stats[0],
          pendingOrders: stats[1],
          deliveringOrders: stats[2],
          revenueToday,
          trends: {
            revenue: calculateTrend(revenueToday, revenueYesterday),
            orders: calculateTrend(ordersToday, ordersYesterday), 
            pending: pendingTrend, 
            delivering: calculateTrend(shipmentsToday, shipmentsYesterday)
          }
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, slug, parent_id, is_active, sort_order } = req.body;

    const category = await prisma.categories.create({
      data: {
        name,
        slug: slug || generateSlug(name),
        parent_id: parent_id ? BigInt(parent_id) : null,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0
      }
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Tạo danh mục',
      entity_type: 'category',
      entity_id: String(category.id),
      details: { name: category.name, slug: category.slug },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      data: serialize(category)
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, slug, parent_id, is_active, sort_order } = req.body;

    // Fetch old data for diff
    const oldCategory = await prisma.categories.findUnique({ where: { id: BigInt(id as string) } });

    const category = await prisma.categories.update({
      where: { id: BigInt(id as string) },
      data: {
        name,
        slug,
        parent_id: parent_id ? BigInt(parent_id) : null,
        is_active,
        sort_order
      }
    });

    const diff = oldCategory ? deepDiff(serialize(oldCategory), serialize(category)) : {};

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Cập nhật danh mục',
      entity_type: 'category',
      entity_id: String(id),
      details: { diff },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: serialize(category)
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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

    // Snapshot before delete
    const catToDelete = await prisma.categories.findUnique({ where: { id: categoryId } });
    const snapshot = catToDelete ? createDeleteSnapshot(serialize(catToDelete)) : {};

    await prisma.categories.delete({
      where: { id: categoryId }
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Xóa danh mục',
      entity_type: 'category',
      entity_id: String(id),
      details: { deleted_data: snapshot },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Xóa danh mục thành công'
    });
  } catch (error) {
    next(error);
  }
};

// USER MANAGEMENT
export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '20', role, search } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const readableRoles = getReadableRoles(req.user || {});

    const where: any = {};

    if (readableRoles.length === 0) {
      return res.json({
        success: true,
        data: {
          users: [],
          stats: {
            total: 0,
            active: 0,
            new_this_week: 0
          },
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 0
          }
        }
      });
    }
    
    // Filters
    if (role) {
      if (!readableRoles.includes(role as any)) {
        return res.json({
          success: true,
          data: {
            users: [],
            stats: {
              total: 0,
              active: 0,
              new_this_week: 0
            },
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: 0,
              totalPages: 0
            }
          }
        });
      }

      where.role = role;
    } else {
      where.role = { in: readableRoles };
    }
    if (search) {
      where.OR = [
        { full_name: { contains: search as string } }, // Removed mode: 'insensitive' for compatibility if mysql/prisma config varies, but okay for default
        { email: { contains: search as string } },
        { phone: { contains: search as string } }
      ];
    }

    // Determine "New This Week"
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Run parallel queries
    const [users, total, totalCustomers, activeCustomers, newCustomers] = await Promise.all([
      prisma.users.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        select: {
          id: true,
          username: true,
          email: true,
          full_name: true,
          phone: true,
          role: true,
          status: true,
          address_line1: true,
          address_line2: true,
          city: true,
          province: true,
          country: true,
          created_at: true,
          avatar_url: true
          // Removed orders include
        }
      }),
      prisma.users.count({ where }),
      // Stats: Total Customers
      prisma.users.count({ where: { role: 'customer' } }),
      // Stats: Active Now (Status = active)
      prisma.users.count({ where: { role: 'customer', status: 'active' } }),
      // Stats: New This Week
      prisma.users.count({ 
        where: { 
          role: 'customer',
          created_at: { gte: oneWeekAgo }
        } 
      })
    ]);

    // Optimize: Get stats for these users specifically using GroupBy
    const userIds = users.map(u => u.id);
    const orderStats = await prisma.orders.groupBy({
        by: ['user_id'],
        where: {
            user_id: { in: userIds as any },
            status: { in: ['paid', 'completed'] } // Only count real value
        },
        _sum: { grand_total: true },
        _count: { id: true }
    });

    // Map stats to users
    const statsMap = new Map();
    orderStats.forEach(stat => {
        if(stat.user_id) statsMap.set(stat.user_id.toString(), stat);
    });

    // Process users to add calculated fields
    const processedUsers = users.map(user => {
      const stat = statsMap.get(user.id.toString());
      
      return {
        ...user,
        orders_count: stat?._count.id || 0,
        total_spent: Number(stat?._sum.grand_total || 0),
        // orders: undefined // No longer needed
      };
    });

    res.json({
      success: true,
      data: {
        users: serialize(processedUsers),
        stats: {
          total: totalCustomers,
          active: activeCustomers,
          new_this_week: newCustomers
        },
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

export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, full_name, role, status, phone } = req.body;

    // Check existing
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email đã tồn tại' }
      });
    }

    if (role && !canAssignRole(req.user || {}, role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Bạn không có quyền tạo người dùng với vai trò này' }
      });
    }

    // Hash password (assuming bcrypt imported or handle in model/service)
    // For simplicity, using simple hash or assuming pre-hashed. 
    // Wait, we need bcrypt. Let's assume auth service has it or use placeholder.
    // Ideally we reuse auth service logic. Let's just store as is for now or use bcrypt if available.
    // Better: Import bcrypt.
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        email,
        password_hash: hashedPassword,
        full_name,
        phone,
        role: role || 'customer',
        status: status || 'active',
        username: email.split('@')[0] + Math.floor(Math.random() * 1000)
      }
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Tạo người dùng',
      entity_type: 'user',
      entity_id: String(user.id),
      details: { email, full_name, role: role || 'customer' },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      data: serialize(user)
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, role, full_name, phone, email, address_line1, address_line2, city, province, country } = req.body;

    // Build update data dynamically
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (role !== undefined) updateData.role = role;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address_line1 !== undefined) updateData.address_line1 = address_line1;
    if (address_line2 !== undefined) updateData.address_line2 = address_line2;
    if (city !== undefined) updateData.city = city;
    if (province !== undefined) updateData.province = province;
    if (country !== undefined) updateData.country = country;

    // Fetch old data for diff
    const oldUser = await prisma.users.findUnique({
      where: { id: BigInt(id as string) },
      select: {
        id: true, username: true, email: true, full_name: true, phone: true,
        role: true, status: true, address_line1: true, address_line2: true,
        city: true, province: true, country: true, created_at: true
      }
    });

    if (!oldUser) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy người dùng' }
      });
    }

    try {
      assertCanManageTargetUser(req.user || {}, oldUser);
    } catch (error) {
      return next(error);
    }

    if (role !== undefined && role !== oldUser.role && !canAssignRole(req.user || {}, role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Bạn không có quyền gán vai trò này' }
      });
    }

// ... inside updateUser ...
    const user = await prisma.users.update({
      where: { id: BigInt(id as string) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        status: true,
        address_line1: true,
        address_line2: true,
        city: true,
        province: true,
        country: true,
        created_at: true
      }
    });

    // Log with old→new diff
    const diff = oldUser ? deepDiff(serialize(oldUser), serialize(user)) : {};
    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Cập nhật người dùng',
      entity_type: 'user',
      entity_id: String(id),
      details: { diff },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    if (status === 'blocked') {
      try {
        const io = getIO();
        const sockets = await io.fetchSockets();
        
        for (const socket of sockets) {
          const s = socket as any;
          if (s.userId && s.userId.toString() === id.toString()) {
            console.log(`[Admin] Force logging out blocked user: ${user.username}`);
            socket.emit('force_logout', { message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên.' });
            socket.disconnect(true);
          }
        }
      } catch (e) {
        console.error('Error forcing logout:', e);
      }
    }


    res.json({
      success: true,
      data: serialize(user)
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await prisma.users.findUnique({
      where: { id: BigInt(id as string) },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        status: true,
        address_line1: true,
        address_line2: true,
        city: true,
        province: true,
        country: true,
        created_at: true,
        shipping_addresses: true,
        orders: {
          select: {
            id: true,
            order_code: true,
            status: true,
            grand_total: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy người dùng' }
      });
    }

    try {
      assertCanReadTargetUser(req.user || {}, user);
    } catch (error) {
      return next(error);
    }

    res.json({
      success: true,
      data: serialize(user)
    });
  } catch (error) {
    next(error);
  }
};



export const getAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if not provided
    const end = endDate ? new Date(endDate as string) : new Date();
    // Set end date to end of day to include all orders for that day
    end.setHours(23, 59, 59, 999);

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(end.getDate() - 30));
    // Set start date to beginning of day
    start.setHours(0, 0, 0, 0);

    // Ensure valid Dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
       return res.status(400).json({ success: false, error: { message: 'Invalid date format' } });
    }

    // Previous Period calculation for Trends
    const durationMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - durationMs);
    const prevEnd = new Date(start.getTime() - 1);

    // 1. Efficient Aggregations (No more findMany all orders)
    
    // Total Revenue & Orders (Strict "Realized" Logic: Paid + Completed)
    const revenueStats = await prisma.orders.aggregate({
        where: {
            created_at: { gte: start, lte: end },
            status: { in: ['paid', 'completed'] }
        },
        _sum: { grand_total: true },
        _count: { id: true }
    });

    // Total Orders (All statuses except maybe cancelled? Dashboard showed Total Orders = 91 vs Realized 30)
    // For Analytics "Total Orders", we usually want ALL orders placed.
    const totalOrdersCount = await prisma.orders.count({
        where: {
            created_at: { gte: start, lte: end }
            // If you want to exclude cancelled: status: { not: 'cancelled' }
        }
    });

    // 2. Revenue Graph using DB Grouping
    // Note: SQLite/Postgres/MySQL differences exist. Prisma groupBy is safer but doesn't support date truncation easily without raw query.
    // Using simple Raw Query for best performance on date grouping.
    const revenueOverTime: any[] = await prisma.$queryRaw`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, 
               SUM(grand_total) as revenue, 
               COUNT(id) as orders
        FROM orders
        WHERE created_at >= ${start} AND created_at <= ${end}
        AND status IN ('paid', 'completed')
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date ASC
    `;

    const customerRegistrationsOverTime: any[] = await prisma.$queryRaw`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date,
               COUNT(id) as customers
        FROM users
        WHERE created_at >= ${start} AND created_at <= ${end}
        AND role = 'customer'
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date ASC
    `;

    // 3. Status Distribution
    const statusDistribution = await prisma.orders.groupBy({
        by: ['status'],
        where: { created_at: { gte: start, lte: end } },
        _count: { id: true }
    });

    // 4. Top Products (By Quantity Sold)
    const topProductsRaw = await prisma.order_items.groupBy({
        by: ['product_id'],
        where: {
            order: {
                created_at: { gte: start, lte: end },
                status: { in: ['paid', 'completed'] } // Only count sold items from valid orders
            }
        },
        _sum: { qty: true, line_total: true },
        orderBy: { _sum: { qty: 'desc' } },
        take: 10
    });

    // Fetch product details for top items
    const productDetails = await prisma.products.findMany({
        where: { id: { in: topProductsRaw.map(p => p.product_id).filter(id => id !== null) as bigint[] } },
        select: { id: true, name: true, sku: true }
    });

    const topProducts = topProductsRaw.map(item => {
        const product = productDetails.find(p => p.id === item.product_id);
        return {
            name: product?.name || 'Unknown Product',
            sku: product?.sku || 'N/A',
            sold: Number(item._sum.qty || 0),
            revenue: Number(item._sum.line_total || 0)
        };
    });

    // 5. Customer Stats
    const totalCustomers = await prisma.users.count({ where: { role: 'customer' } });
    const newCustomers = await prisma.users.count({
        where: {
            role: 'customer',
            created_at: { gte: start, lte: end }
        }
    });

    // Previous Customer Stats
    const prevNewCustomers = await prisma.users.count({
        where: {
            role: 'customer',
            created_at: { gte: prevStart, lte: prevEnd }
        }
    });

    const recentCustomers = await prisma.users.findMany({
        where: { role: 'customer' },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { id: true, full_name: true, status: true, avatar_url: true }
    });

    // 6. Aggregated Category Stats
    // This is tricky without complex joins. We can approximate or use raw query.
    // For safety/speed, let's use raw query again.
    const categoryStatsRaw: any[] = await prisma.$queryRaw`
        SELECT c.name, SUM(oi.qty) as sold, SUM(oi.line_total) as revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE o.created_at >= ${start} AND o.created_at <= ${end}
        AND o.status IN ('paid', 'completed')
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
        /* Remove LIMIT here to aggregating all first, then limit in JS */
    `;

    // Process and merge duplicates (same name or trimmed name)
    const categoryMap = new Map<string, { name: string, sold: number, revenue: number }>();
    
    categoryStatsRaw.forEach(c => {
        const rawName = c.name || 'Uncategorized';
        const normalizedName = rawName.trim(); // Normalize: trim spaces
        
        if (categoryMap.has(normalizedName)) {
            const existing = categoryMap.get(normalizedName)!;
            existing.sold += Number(c.sold);
            existing.revenue += Number(c.revenue);
        } else {
            categoryMap.set(normalizedName, {
                name: normalizedName,
                sold: Number(c.sold),
                revenue: Number(c.revenue)
            });
        }
    });

    // Convert to array, sort and limit
    const categoryStats = Array.from(categoryMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);


    // Serialize for BigInt support
    const totalRevenue = Number(revenueStats._sum.grand_total || 0);
    const realizedOrders = revenueStats._count.id || 0;
    const aov = realizedOrders > 0 ? totalRevenue / realizedOrders : 0;

    // Calculate Trends
    const prevRevenueStats = await prisma.orders.aggregate({
        where: {
            created_at: { gte: prevStart, lte: prevEnd },
            status: { in: ['paid', 'completed'] }
        },
        _sum: { grand_total: true }
    });
    
    const prevTotalRevenue = Number(prevRevenueStats._sum.grand_total || 0);
    const revenueTrend = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : (totalRevenue > 0 ? 100 : 0);
    
    // Total Customers trend: (Current Total / Previous Total)
    const prevTotalCustomers = totalCustomers - newCustomers;
    const activeCustomersTrend = prevTotalCustomers > 0 ? ((totalCustomers - prevTotalCustomers) / prevTotalCustomers) * 100 : (totalCustomers > 0 ? 100 : 0);
    
    // New Customers Trend
    const newCustomersTrend = prevNewCustomers > 0 ? ((newCustomers - prevNewCustomers) / prevNewCustomers) * 100 : (newCustomers > 0 ? 100 : 0);

    res.json({
      success: true,
      data: serialize({
        summary: {
          totalRevenue,
          totalOrders: totalOrdersCount, // All orders attempted
          realizedOrders, // Only paid/completed (for internal tracking if needed)
          aov,
          totalCustomers,
          newCustomers,
          trends: {
             revenue: parseFloat(revenueTrend.toFixed(1)),
             activeCustomers: parseFloat(activeCustomersTrend.toFixed(1)),
             newCustomers: parseFloat(newCustomersTrend.toFixed(1))
          }
        },
        charts: {
            revenue: revenueOverTime.map(r => ({
                date: r.date,
                revenue: Number(r.revenue),
                orders: Number(r.orders) // Orders count in graph matches strict filtering
            })),
            customerRegistrations: customerRegistrationsOverTime.map((row) => ({
                date: row.date,
                customers: Number(row.customers)
            })),
            status: statusDistribution.map(s => ({
                status: s.status,
                count: s._count.id
            })),
            categories: categoryStats
        },
        topProducts,
        recentCustomers
      })
    });

  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = BigInt(id as string);

    // Prevent self-deletion
    if (req.user?.id && userId === BigInt(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Bạn không thể tự xóa tài khoản của mình' }
      });
    }

    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy người dùng' }
      });
    }

    try {
      assertCanManageTargetUser(req.user || {}, targetUser);
    } catch (error) {
      return next(error);
    }

    // Check for related data
    const [ordersCount, reviewsCount, cartItemsCount] = await Promise.all([
      prisma.orders.count({ where: { user_id: userId } }),
      prisma.product_reviews.count({ where: { user_id: userId } }),
      prisma.cart_items.count({ where: { cart: { user_id: userId } } })
    ]);

    if (ordersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa người dùng này vì đã có ${ordersCount} đơn hàng. Vui lòng khóa tài khoản thay vì xóa.`
      });
    }

    if (reviewsCount > 0) {
        return res.status(400).json({
            success: false,
            message: `Không thể xóa người dùng này vì đã có ${reviewsCount} lượt đánh giá sản phẩm.`
        });
    }

    if (cartItemsCount > 0) {
        return res.status(400).json({
            success: false,
            message: `Người dùng đang có ${cartItemsCount} sản phẩm trong giỏ hàng. Không thể xóa.`
        });
    }

    // Snapshot before delete
    const userToDelete = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, full_name: true, role: true, status: true, created_at: true }
    });
    const snapshot = userToDelete ? createDeleteSnapshot(serialize(userToDelete)) : {};

    await prisma.users.delete({
      where: { id: userId }
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Xóa người dùng',
      entity_type: 'user',
      entity_id: String(id),
      details: { deleted_data: snapshot },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    next(error);
  }
};




