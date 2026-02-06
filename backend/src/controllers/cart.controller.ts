import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server.js';
import { ApiError } from '../middlewares/error.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { addToCartSchema, updateCartItemSchema } from '../validators/cart.validator.js';

// Helper to convert BigInt to string for JSON serialization
const serializeCart = (cart: any) => {
  return JSON.parse(JSON.stringify(cart, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

// Get or create cart for user
const getOrCreateCart = async (userId: bigint | undefined, sessionId?: string) => {
  let cart;

  if (userId) {
    cart = await prisma.carts.findFirst({
      where: { user_id: userId }
    });

    if (!cart) {
      cart = await prisma.carts.create({
        data: { user_id: userId }
      });
    }
  } else if (sessionId) {
    cart = await prisma.carts.findFirst({
      where: { session_id: sessionId }
    });

    if (!cart) {
      cart = await prisma.carts.create({
        data: { session_id: sessionId }
      });
    }
  } else {
    throw new ApiError(400, 'User or session required');
  }

  return cart;
};

export const getCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    if (!userId && !sessionId) {
      return res.json({
        success: true,
        data: { items: [], subtotal: 0 }
      });
    }

    const whereClause = userId 
      ? { user_id: userId }
      : { session_id: sessionId };

    const cart = await prisma.carts.findFirst({
      where: whereClause,
      include: {
        cart_items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    product_images: {
                      where: { is_primary: true },
                      take: 1
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
              }
            }
          }
        }
      }
    });

    if (!cart) {
      return res.json({
        success: true,
        data: { items: [], subtotal: 0 }
      });
    }

    // Calculate subtotal
    const subtotal = cart.cart_items.reduce((sum, item) => {
      return sum + (Number(item.variant.price) * item.qty);
    }, 0);

    res.json({
      success: true,
      data: {
        id: cart.id.toString(),
        items: cart.cart_items.map(item => ({
          id: item.id.toString(),
          variant_id: item.variant_id.toString(),
          qty: item.qty,
          price: Number(item.variant.price),
          stock_qty: item.variant.stock_qty,
          product: {
            id: item.variant.product.id.toString(),
            name: item.variant.product.name,
            slug: item.variant.product.slug,
            image: item.variant.product.product_images[0]?.url || null
          },
          options: item.variant.variant_option_values.map(vov => ({
            name: vov.option_value.option.name,
            value: vov.option_value.value
          })),
          line_total: Number(item.variant.price) * item.qty
        })),
        subtotal
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = addToCartSchema.parse(req.body);
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    // Get the variant and check stock
    const variant = await prisma.product_variants.findUnique({
      where: { id: BigInt(validatedData.variant_id) },
      include: { product: true }
    });

    if (!variant) {
      throw new ApiError(404, 'Product variant not found');
    }

    if (!variant.is_active) {
      throw new ApiError(400, 'Product variant is not available');
    }

    // Get or create cart
    const cart = await getOrCreateCart(userId, sessionId);

    // Check if item already exists in cart
    const existingItem = await prisma.cart_items.findUnique({
      where: {
        cart_id_variant_id: {
          cart_id: cart.id,
          variant_id: BigInt(validatedData.variant_id)
        }
      }
    });

    const newQty = existingItem 
      ? existingItem.qty + validatedData.quantity 
      : validatedData.quantity;

    // IMPORTANT: Check stock quantity
    if (newQty > variant.stock_qty) {
      if (variant.stock_qty === 0) {
        throw new ApiError(400, 'Sản phẩm này hiện đã hết hàng.');
      }
      throw new ApiError(400, `Chỉ còn lại ${variant.stock_qty} sản phẩm trong kho.`);
    }

    if (existingItem) {
      // Update existing item
      await prisma.cart_items.update({
        where: { id: existingItem.id },
        data: { qty: newQty }
      });
    } else {
      // Create new item
      await prisma.cart_items.create({
        data: {
          cart_id: cart.id,
          variant_id: BigInt(validatedData.variant_id),
          qty: validatedData.quantity,
          price_at_add: variant.price
        }
      });
    }

    // Return updated cart
    res.json({
      success: true,
      message: 'Item added to cart'
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params;
    const validatedData = updateCartItemSchema.parse(req.body);
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    // Get cart item
    const cartItem = await prisma.cart_items.findUnique({
      where: { id: BigInt(itemId as string) },
      include: {
        cart: true,
        variant: true
      }
    });

    if (!cartItem) {
      throw new ApiError(404, 'Cart item not found');
    }

    // Verify cart ownership
    if (userId) {
      if (cartItem.cart.user_id?.toString() !== userId.toString()) {
        throw new ApiError(403, 'Unauthorized');
      }
    } else if (sessionId) {
      if (cartItem.cart.session_id !== sessionId) {
        throw new ApiError(403, 'Unauthorized');
      }
    } else {
      throw new ApiError(403, 'Unauthorized');
    }

    // Check stock
    if (validatedData.quantity > cartItem.variant.stock_qty) {
      throw new ApiError(400, `Out of Stock. Only ${cartItem.variant.stock_qty} items available.`);
    }

    // Update quantity
    await prisma.cart_items.update({
      where: { id: BigInt(itemId as string) },
      data: { qty: validatedData.quantity }
    });

    res.json({
      success: true,
      message: 'Cart updated'
    });
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params;
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    // Get cart item
    const cartItem = await prisma.cart_items.findUnique({
      where: { id: BigInt(itemId as string) },
      include: { cart: true }
    });

    if (!cartItem) {
      throw new ApiError(404, 'Cart item not found');
    }

    // Verify cart ownership
    if (userId) {
      if (cartItem.cart.user_id?.toString() !== userId.toString()) {
        throw new ApiError(403, 'Unauthorized');
      }
    } else if (sessionId) {
      if (cartItem.cart.session_id !== sessionId) {
        throw new ApiError(403, 'Unauthorized');
      }
    } else {
      throw new ApiError(403, 'Unauthorized');
    }

    // Delete item
    await prisma.cart_items.delete({
      where: { id: BigInt(itemId as string) }
    });

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    const whereClause = userId 
      ? { user_id: userId }
      : { session_id: sessionId };

    const cart = await prisma.carts.findFirst({
      where: whereClause
    });

    if (cart) {
      await prisma.cart_items.deleteMany({
        where: { cart_id: cart.id }
      });
    }

    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    next(error);
  }
};

// Merge guest cart with user cart after login
export const mergeCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.body;

    if (!userId || !sessionId) {
      return res.json({ success: true, message: 'No cart to merge' });
    }

    const guestCart = await prisma.carts.findFirst({
      where: { session_id: sessionId },
      include: { cart_items: true }
    });

    if (!guestCart || guestCart.cart_items.length === 0) {
      return res.json({ success: true, message: 'No guest cart to merge' });
    }

    const userCart = await getOrCreateCart(userId);

    // Merge items
    for (const item of guestCart.cart_items) {
      const existingItem = await prisma.cart_items.findUnique({
        where: {
          cart_id_variant_id: {
            cart_id: userCart.id,
            variant_id: item.variant_id
          }
        }
      });

      if (existingItem) {
        await prisma.cart_items.update({
          where: { id: existingItem.id },
          data: { qty: existingItem.qty + item.qty }
        });
      } else {
        await prisma.cart_items.create({
          data: {
            cart_id: userCart.id,
            variant_id: item.variant_id,
            qty: item.qty,
            price_at_add: item.price_at_add
          }
        });
      }
    }

    // Delete guest cart
    await prisma.carts.delete({ where: { id: guestCart.id } });

    res.json({
      success: true,
      message: 'Cart merged successfully'
    });
  } catch (error) {
    next(error);
  }
};
