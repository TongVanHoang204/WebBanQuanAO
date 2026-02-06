import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server.js';
import { ApiError } from '../middlewares/error.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { checkoutSchema, updateOrderStatusSchema } from '../validators/order.validator.js';
import { logActivity } from '../services/logger.service.js';
import { sendOrderConfirmationEmail } from '../services/email.service.js';
import { createNotification } from './notificationController.js';

// Helper to convert BigInt to string for JSON serialization
const serializeOrder = (order: any) => {
  return JSON.parse(JSON.stringify(order, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

// Generate order code
const generateOrderCode = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FS${dateStr}-${random}`;
};

export const checkout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = checkoutSchema.parse(req.body);
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const sessionId = req.headers['x-session-id'] as string;

    // Prevent admin, manager, staff from placing orders
    const restrictedRoles = ['admin', 'manager', 'staff'];
    if (userRole && restrictedRoles.includes(userRole)) {
      throw new ApiError(403, 'Nhân viên không được phép đặt hàng. Vui lòng sử dụng tài khoản khách hàng.');
    }

    // Get cart with items
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
                product: true,
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

    if (!cart || cart.cart_items.length === 0) {
      throw new ApiError(400, 'Cart is empty');
    }

    // Validate stock for all items
    for (const item of cart.cart_items) {
      if (item.qty > item.variant.stock_qty) {
        throw new ApiError(400, `${item.variant.product.name} is out of stock. Only ${item.variant.stock_qty} available.`);
      }
    }

    // Calculate totals
    const subtotal = cart.cart_items.reduce((sum, item) => {
      return sum + (Number(item.variant.price) * item.qty);
    }, 0);

    let discountTotal = 0;
    let couponId: bigint | null = null;

    // Apply coupon if provided
    if (validatedData.coupon_code) {
      const coupon = await prisma.coupons.findUnique({
        where: { code: validatedData.coupon_code }
      });

      if (coupon && coupon.is_active) {
        const now = new Date();
        const isValid = (!coupon.start_at || coupon.start_at <= now) &&
                       (!coupon.end_at || coupon.end_at >= now) &&
                       subtotal >= Number(coupon.min_subtotal);

        // Check usage limit
        if (isValid && coupon.usage_limit) {
          const usageCount = await prisma.coupon_redemptions.count({
            where: { coupon_id: coupon.id }
          });
          if (usageCount >= coupon.usage_limit) {
            throw new ApiError(400, 'Mã giảm giá đã hết lượt sử dụng');
          }
        }

        if (isValid) {
          if (coupon.type === 'percent') {
            discountTotal = subtotal * (Number(coupon.value) / 100);
            if (coupon.max_discount) {
              discountTotal = Math.min(discountTotal, Number(coupon.max_discount));
            }
          } else {
            discountTotal = Number(coupon.value);
          }
          couponId = coupon.id;
        }
      }
    }

    // Calculate shipping (simplified - based on city)
    const shippingFee = validatedData.ship_city.toLowerCase().includes('hcm') ? 25000 : 35000;

    const grandTotal = subtotal - discountTotal + shippingFee;

    // Use transaction for checkout
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const newOrder = await tx.orders.create({
        data: {
          order_code: generateOrderCode(),
          user_id: userId || null,
          status: 'pending',
          subtotal,
          discount_total: discountTotal,
          shipping_fee: shippingFee,
          grand_total: grandTotal,
          customer_name: validatedData.customer_name,
          customer_phone: validatedData.customer_phone,
          ship_address_line1: validatedData.ship_address_line1,
          ship_address_line2: validatedData.ship_address_line2,
          ship_city: validatedData.ship_city,
          ship_province: validatedData.ship_province,
          ship_postal_code: validatedData.ship_postal_code,
          ship_country: validatedData.ship_country,
          note: validatedData.note
        }
      });

      // 2. Create order items and update stock
      for (const item of cart.cart_items) {
        // Create order item
        const optionsText = item.variant.variant_option_values
          .map(vov => `${vov.option_value.option.name}: ${vov.option_value.value}`)
          .join(', ');

        await tx.order_items.create({
          data: {
            order_id: newOrder.id,
            product_id: item.variant.product.id,
            variant_id: item.variant_id,
            sku: item.variant.variant_sku,
            name: item.variant.product.name,
            options_text: optionsText,
            unit_price: item.variant.price,
            qty: item.qty,
            line_total: Number(item.variant.price) * item.qty
          }
        });

        // Deduct stock
        await tx.product_variants.update({
          where: { id: item.variant_id },
          data: {
            stock_qty: {
              decrement: item.qty
            }
          }
        });

        // Create inventory movement
        await tx.inventory_movements.create({
          data: {
            variant_id: item.variant_id,
            type: 'out',
            qty: item.qty,
            note: `Order ${newOrder.order_code}`
          }
        });
      }

      // 3. Create payment record
      await tx.payments.create({
        data: {
          order_id: newOrder.id,
          method: validatedData.payment_method,
          status: 'pending',
          amount: grandTotal
        }
      });

      // 4. Create shipment record
      await tx.shipments.create({
        data: {
          order_id: newOrder.id,
          status: 'pending'
        }
      });

      // 5. Record coupon redemption if used
      if (couponId && discountTotal > 0) {
        await tx.coupon_redemptions.create({
          data: {
            coupon_id: couponId,
            user_id: userId || null,
            order_id: newOrder.id,
            discount_amount: discountTotal
          }
        });
      }

      // 6. Clear cart
      await tx.cart_items.deleteMany({
        where: { cart_id: cart.id }
      });

      return newOrder;
    });

    // Get full order details
    const fullOrder = await prisma.orders.findUnique({
      where: { id: order.id },
      include: {
        order_items: true,
        payments: true,
        shipments: true,
        user: true
      }
    });

    // Log activity
    await logActivity({
      user_id: BigInt(userId || 0),
      action: 'create_order',
      entity_type: 'order',
      entity_id: order.id.toString(),
      details: `Created order ${order.order_code}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    // Send notification to customer if logged in AND if the order is considered "active" (COD)
    // For Bank/QR, we wait until payment.
    if (userId && validatedData.payment_method === 'cod') {
      await createNotification({
        user_id: BigInt(userId),
        type: 'order_new',
        title: 'Đặt hàng thành công',
        message: `Đơn hàng ${order.order_code} đã được đặt thành công.`,
        link: `/orders/${order.id}`
      });
    }

    // ALWAYS notify admins about the new order BUT only if COD or immediate payment
    if (validatedData.payment_method === 'cod') {
      await createNotification({
        user_id: null, // null means general/system notification
        type: 'order_new',
        title: 'Đơn hàng mới',
        message: `Đơn hàng ${order.order_code} vừa được đặt bởi ${validatedData.customer_name}.`,
        link: `/admin/orders/${order.id}`
      });
    }

    // Check for low stock...

    // Send confirmation email if user has email or provided one AND if COD
    // For Bank/QR, we send email only after payment.
    const recipientEmail = fullOrder?.user?.email || validatedData.email;
    if (recipientEmail && fullOrder && validatedData.payment_method === 'cod') {
      sendOrderConfirmationEmail(recipientEmail, fullOrder.order_code, Number(fullOrder.grand_total)).catch(console.error);
    }

    res.status(201).json({
      success: true,
      data: serializeOrder(fullOrder)
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    const { page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where: { user_id: req.user.id },
        orderBy: { created_at: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          order_items: {
            include: {
              product: {
                include: {
                  product_images: {
                    where: { is_primary: true },
                    take: 1
                  }
                }
              }
            }
          },
          payments: true,
          shipments: true
        }
      }),
      prisma.orders.count({ where: { user_id: req.user.id } })
    ]);

    res.json({
      success: true,
      data: {
        orders: orders.map(serializeOrder),
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

export const getOrderById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const order = await prisma.orders.findUnique({
      where: { id: BigInt(id as string) },
      include: {
        order_items: {
          include: {
            product: {
              include: {
                product_images: {
                  where: { is_primary: true },
                  take: 1
                }
              }
            }
          }
        },
        payments: true,
        shipments: true
      }
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Check ownership (unless admin)
    if (req.user && req.user.role !== 'admin') {
      if (order.user_id?.toString() !== req.user.id.toString()) {
        throw new ApiError(403, 'Unauthorized');
      }
    }

    res.json({
      success: true,
      data: serializeOrder(order)
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderByCode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.params;

    const order = await prisma.orders.findUnique({
      where: { order_code: code as string },
      include: {
        order_items: {
          include: {
            product: {
              include: {
                product_images: {
                  where: { is_primary: true },
                  take: 1
                }
              }
            }
          }
        },
        payments: true,
        shipments: true
      }
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    res.json({
      success: true,
      data: serializeOrder(order)
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const validatedData = updateOrderStatusSchema.parse(req.body);

    const order = await prisma.orders.update({
      where: { id: BigInt(id as string) },
      data: { status: validatedData.status }
    });

    // Update related records based on status
    if (validatedData.status === 'paid') {
      await prisma.payments.updateMany({
        where: { order_id: BigInt(id as string) },
        data: { status: 'paid', paid_at: new Date() }
      });
    } else if (validatedData.status === 'shipped') {
      await prisma.shipments.updateMany({
        where: { order_id: BigInt(id as string) },
        data: { status: 'shipping', shipped_at: new Date() }
      });
    } else if (validatedData.status === 'completed') {
      await prisma.shipments.updateMany({
        where: { order_id: BigInt(id as string) },
        data: { status: 'delivered', delivered_at: new Date() }
      });
    }



    // Correctly proceeding to notification logic

    // Send notification to customer
    if (order.user_id) {
       let title = 'Cập nhật đơn hàng';
       let message = `Đơn hàng ${order.order_code} đã được cập nhật sang trạng thái: ${validatedData.status}`;
       
       if (validatedData.status === 'processing') {
          title = 'Đơn hàng đã được xác nhận';
          message = `Đơn hàng ${order.order_code} của bạn đã được xác nhận và đang được xử lý.`;
       } else if (validatedData.status === 'shipped') {
          title = 'Đơn hàng đang được giao';
          message = `Đơn hàng ${order.order_code} đã được giao cho đơn vị vận chuyển.`;
       } else if (validatedData.status === 'completed') {
          title = 'Giao hàng thành công';
          message = `Đơn hàng ${order.order_code} đã được giao thành công. Cảm ơn bạn đã mua sắm!`;
       } else if (validatedData.status === 'cancelled') {
          title = 'Đơn hàng đã bị hủy';
          message = `Đơn hàng ${order.order_code} đã bị hủy.`;
       }

       await createNotification({
        user_id: order.user_id,
        type: 'order_status',
        title,
        message,
        link: `/orders/${order.id}`
      });
    }

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'update_order_status',
      entity_type: 'order',
      entity_id: id as string,
      details: `Updated order status to ${validatedData.status}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: serializeOrder(order)
    });
  } catch (error) {
    next(error);
  }
};

// Get all orders (admin)
export const getAllOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          order_items: true,
          payments: true,
          shipments: true,
          user: {
            select: { id: true, username: true, email: true }
          }
        }
      }),
      prisma.orders.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        orders: orders.map(serializeOrder),
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

export const cancelOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const order = await prisma.orders.findUnique({
      where: { id: BigInt(id as string) },
      include: { order_items: true }
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Check ownership
    if (order.user_id?.toString() !== req.user?.id.toString()) {
      throw new ApiError(403, 'Unauthorized');
    }

    // Only allow cancellation if pending or confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new ApiError(400, 'Chỉ có thể hủy đơn hàng đang chờ hoặc đã xác nhận');
    }

    // Use transaction to cancel order and restore stock
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Restore stock for each order item
      for (const item of order.order_items) {
        if (item.variant_id) {
          await tx.product_variants.update({
            where: { id: item.variant_id },
            data: { stock_qty: { increment: item.qty } }
          });

          // Log inventory movement
          await tx.inventory_movements.create({
            data: {
              variant_id: item.variant_id,
              type: 'in',
              qty: item.qty,
              note: `Cancelled order ${order.order_code}`
            }
          });
        }
      }

      // Update order status
      return tx.orders.update({
        where: { id: BigInt(id as string) },
        data: { status: 'cancelled' }
      });
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'cancel_order',
      entity_type: 'order',
      entity_id: id as string,
      details: `Cancelled order ${order.order_code} - Stock restored`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: serializeOrder(updatedOrder)
    });
  } catch (error) {
    next(error);
  }
};
