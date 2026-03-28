import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { logActivity } from '../../services/logger.service.js';
import { deepDiff } from '../../utils/deepDiff.js';

// Get current stock (Variants)
export const getInventory = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const lowStock = req.query.lowStock === 'true';

    const where: any = {};
    if (search) {
      where.OR = [
        { variant_sku: { contains: search } },
        { product: { name: { contains: search } } }
      ];
    }
    if (lowStock) {
      where.stock_qty = { lt: 10 }; // Low stock threshold
    }

    const [variants, total] = await Promise.all([
      prisma.product_variants.findMany({
        where,
        include: {
          product: {
            select: { 
              id: true, 
              name: true, 
              product_images: {
                where: { is_primary: true },
                take: 1,
                select: { url: true }
              }
            }
          },
          variant_option_values: {
            include: {
              option_value: {
                include: { option: true }
              }
            }
          }
        },
        orderBy: { stock_qty: 'asc' },
        skip,
        take: limit,
      }),
      prisma.product_variants.count({ where })
    ]);

    // Format the attributes properly
    const formattedVariants = variants.map(v => {
      const attributes = v.variant_option_values.map(vov => 
        `${vov.option_value.option.name}: ${vov.option_value.value}`
      ).join(', ');

      const productCover = v.product.product_images?.[0]?.url || '';

      return {
        ...v,
        attributes,
        product: {
          ...v.product,
          cover_image: productCover,
          product_images: undefined // hide from response
        }
      };
    });

    const responseData = {
      success: true,
      data: {
        inventory: formattedVariants,
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
    console.error('getInventory error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// List Inventory Movements
export const getMovements = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      prisma.inventory_movements.findMany({
        include: {
          variant: {
            include: {
              product: { select: { name: true } },
              variant_option_values: {
                include: { option_value: { include: { option: true } } }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.inventory_movements.count()
    ]);

    const formatted = movements.map(m => {
      const attributes = m.variant.variant_option_values.map(vov => 
        `${vov.option_value.option.name}: ${vov.option_value.value}`
      ).join(', ');

      return {
        ...m,
        product_name: m.variant.product.name,
        variant_sku: m.variant.variant_sku,
        attributes,
        variant: undefined // remove nested to flatten a bit
      };
    });

    const responseData = {
      success: true,
      data: {
        movements: formatted,
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
    console.error('getMovements error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Create a new movement (Adjust, In, Out)
export const createMovement = async (req: AuthRequest, res: Response) => {
  try {
    const { variant_id, type, qty, note } = req.body;
    const allowedMovementTypes = ['in', 'out', 'adjust'];

    if (!variant_id || !type || !qty) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    if (!allowedMovementTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Loại điều chỉnh kho không hợp lệ' });
    }

    const variantIdBigInt = BigInt(variant_id);
    const parsedQty = parseInt(qty);

    if (!Number.isInteger(parsedQty)) {
      return res.status(400).json({ success: false, message: 'Số lượng phải là số nguyên hợp lệ' });
    }

    if (parsedQty <= 0 && type !== 'adjust') {
      return res.status(400).json({ success: false, message: 'Số lượng phải lớn hơn 0' });
    }

    if (type === 'adjust' && parsedQty < 0) {
      return res.status(400).json({ success: false, message: 'Số lượng tồn kho sau điều chỉnh không được âm' });
    }

    const variant = await prisma.product_variants.findUnique({
      where: { id: variantIdBigInt },
      include: { product: true }
    });

    if (!variant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy variant' });
    }

    // Calculate new stock
    let newStock = variant.stock_qty;
    let actualMovementQty = parsedQty;

    if (type === 'in') {
      newStock += parsedQty;
    } else if (type === 'out') {
      newStock -= parsedQty;
    } else if (type === 'adjust') {
      actualMovementQty = parsedQty - variant.stock_qty; // store the delta in movement
      newStock = parsedQty; // adjust sets exactly to the requested qty
    }

    if (newStock < 0) {
      return res.status(400).json({ success: false, message: 'Số lượng tồn kho không được âm' });
    }

    // Transaction to update stock and logic
    await prisma.$transaction([
      // 1. Create movement
      prisma.inventory_movements.create({
        data: {
          variant_id: variantIdBigInt,
          type,
          qty: Math.abs(actualMovementQty), // optionally keep as delta, but usually we just keep absolute and use type
          note: note || ''
        }
      }),
      // 2. Update stock
      prisma.product_variants.update({
        where: { id: variantIdBigInt },
        data: { stock_qty: newStock }
      })
    ]);
    
    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: type === 'in' ? 'Nhập kho' : type === 'out' ? 'Xuất kho' : 'Điều chỉnh kho',
      entity_type: 'inventory',
      entity_id: String(variantIdBigInt),
      details: { 
        before: {
          stock_qty: variant.stock_qty
        },
        after: {
          stock_qty: newStock
        },
        diff: deepDiff(
          { stock_qty: variant.stock_qty },
          { stock_qty: newStock }
        ),
        product_name: variant.product.name,
        variant_sku: variant.variant_sku,
        old_stock: variant.stock_qty,
        new_stock: newStock,
        movement_qty: Math.abs(actualMovementQty),
        type,
        note: note || ''
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Cập nhật kho thành công' });

  } catch (error) {
    console.error('createMovement error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};


