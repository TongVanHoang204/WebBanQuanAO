import { Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { ApiError } from '../../middlewares/error.middleware.js';
import { logActivity } from '../../services/logger.service.js';

// Get wishlist items
export const getWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'Unauthorized');

    let wishlist = await prisma.wishlists.findFirst({
      where: { user_id: userId },
      include: {
        wishlist_items: {
          include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    product_images: {
                        where: { is_primary: true },
                        take: 1
                    },
                    product_variants: {
                        take: 1,
                        select: { id: true, price: true, compare_at_price: true, stock_qty: true }
                    }
                }
            }
          }
        }
      }
    });

    if (!wishlist) {
      // Create if not exists
      wishlist = await prisma.wishlists.create({
        data: { user_id: userId },
        include: { wishlist_items: true }
      }) as any;
    }

    // Format response
    const items = wishlist?.wishlist_items.map((item: any) => {
      const p = item.product;
      return {
        id: p.id.toString(), // Needs to be the product ID for Flutter Product.fromJson
        wishlist_item_id: item.id.toString(),
        name: p.name,
        slug: p.slug,
        description: p.description,
        // Map to what Product.fromJson expects in Flutter
        base_price: Number(p.product_variants?.[0]?.price || 0),
        compare_at_price: p.product_variants?.[0]?.compare_at_price ? Number(p.product_variants[0].compare_at_price) : null,
        product_images: p.product_images || [],
        product_variants: p.product_variants || [],
        added_at: item.created_at
      };
    }) || [];

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

// Add to wishlist
export const addToWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { product_id } = req.body;

    if (!userId) throw new ApiError(401, 'Unauthorized');
    if (!product_id) throw new ApiError(400, 'Product ID required');

    // Find or create wishlist
    let wishlist = await prisma.wishlists.findFirst({
      where: { user_id: userId }
    });

    if (!wishlist) {
      wishlist = await prisma.wishlists.create({
        data: { user_id: userId }
      });
    }

    const productIdBigInt = BigInt(product_id);

    // Check if exists
    const existing = await prisma.wishlist_items.findFirst({
        where: {
            wishlist_id: wishlist.id,
            product_id: productIdBigInt
        }
    });

    if (existing) {
        return res.json({ success: true, message: 'Already in wishlist' });
    }

    await prisma.wishlist_items.create({
        data: {
            wishlist_id: wishlist.id,
            product_id: productIdBigInt
        }
    });

    // Audit: Log add to wishlist
    logActivity({
      user_id: userId,
      action: 'Thêm vào danh sách yêu thích',
      entity_type: 'wishlist',
      entity_id: String(product_id),
      details: { product_id },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'Added to wishlist' });
  } catch (error) {
    next(error);
  }
};

// Remove from wishlist
export const removeFromWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { product_id } = req.params;

    if (!userId) throw new ApiError(401, 'Unauthorized');

    const wishlist = await prisma.wishlists.findFirst({
        where: { user_id: userId }
    });

    if (!wishlist) throw new ApiError(404, 'Wishlist not found');

    await prisma.wishlist_items.deleteMany({
        where: {
            wishlist_id: wishlist.id,
            product_id: BigInt(product_id as string)
        }
    });

    // Audit: Log remove from wishlist
    logActivity({
      user_id: userId,
      action: 'Xóa khỏi danh sách yêu thích',
      entity_type: 'wishlist',
      entity_id: String(product_id),
      details: { product_id },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    }).catch(() => {});

    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
};
