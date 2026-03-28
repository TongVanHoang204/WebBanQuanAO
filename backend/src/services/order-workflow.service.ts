import type { orders, order_items, payments, payments_status, Prisma, shipments } from '@prisma/client';
import { ApiError } from '../middlewares/error.middleware.js';

type WorkflowActor = {
  id?: bigint | string | number | null;
  role?: string | null;
};

export const REFUND_REQUEST_MARKER = '[REFUND_REQUESTED]';
export const REFUND_PROCESSED_MARKER = '[REFUND_PROCESSED]';
export const REFUND_RESTOCKED_MARKER = '[REFUND_RESTOCKED]';

type OrderWithWorkflowRelations = orders & {
  order_items?: order_items[];
  payments?: payments[];
  shipments?: shipments[];
};

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'paid', 'cancelled'],
  confirmed: ['processing', 'paid', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed', 'cancelled'],
  completed: ['refunded'],
  cancelled: [],
  refunded: []
};

const hasMarker = (adminNote: string | null | undefined, marker: string) =>
  typeof adminNote === 'string' && adminNote.includes(marker);

export const getRefundWorkflowState = (adminNote?: string | null) => ({
  refund_requested: hasMarker(adminNote, REFUND_REQUEST_MARKER),
  refund_processed: hasMarker(adminNote, REFUND_PROCESSED_MARKER),
  refund_restocked: hasMarker(adminNote, REFUND_RESTOCKED_MARKER)
});

export const appendAdminNoteMarker = (adminNote: string | null | undefined, marker: string) => {
  if (hasMarker(adminNote, marker)) {
    return adminNote ?? null;
  }

  return [adminNote, marker].filter(Boolean).join(' | ');
};

export const enrichOrderWorkflowState = <T extends { admin_note?: string | null }>(order: T) => {
  const workflow = getRefundWorkflowState(order.admin_note);
  return {
    ...order,
    ...workflow,
    refund_processed: workflow.refund_processed || (order as any).status === 'refunded'
  };
};

const restoreOrderStock = async (tx: Prisma.TransactionClient, order: OrderWithWorkflowRelations, note: string) => {
  for (const item of order.order_items || []) {
    if (!item.variant_id) {
      continue;
    }

    await tx.product_variants.update({
      where: { id: item.variant_id },
      data: { stock_qty: { increment: item.qty } }
    });

    await tx.inventory_movements.create({
      data: {
        variant_id: item.variant_id,
        type: 'in',
        qty: item.qty,
        note
      }
    });
  }
};

export const validateOrderStatusTransition = (currentStatus: string, nextStatus: string, adminNote?: string | null) => {
  const allowed = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(400, `Không thể chuyển trạng thái từ "${currentStatus}" sang "${nextStatus}"`);
  }

  const workflow = getRefundWorkflowState(adminNote);
  if (nextStatus === 'refunded' && !workflow.refund_requested) {
    throw new ApiError(400, 'Đơn hàng chưa có yêu cầu hoàn tiền từ khách hàng nên không thể chuyển sang trạng thái hoàn tiền');
  }
};

export const transitionOrderStatus = async (
  tx: Prisma.TransactionClient,
  orderId: bigint,
  nextStatus: string,
  actor?: WorkflowActor
) => {
  const currentOrder = await tx.orders.findUnique({
    where: { id: orderId },
    include: {
      order_items: true,
      payments: true,
      shipments: true
    }
  });

  if (!currentOrder) {
    throw new ApiError(404, 'Order not found');
  }

  if (nextStatus === 'refunded' && !['admin', 'manager'].includes(actor?.role || '')) {
    throw new ApiError(403, 'Chỉ admin hoặc manager mới được xác nhận hoàn tiền');
  }

  validateOrderStatusTransition(currentOrder.status, nextStatus, currentOrder.admin_note);

  if (nextStatus === 'cancelled' && ['pending', 'confirmed', 'paid', 'processing'].includes(currentOrder.status)) {
    await restoreOrderStock(tx, currentOrder, `Admin cancelled order ${currentOrder.order_code}`);
  }

  let adminNote = currentOrder.admin_note;
  if (nextStatus === 'refunded') {
    adminNote = appendAdminNoteMarker(adminNote, REFUND_PROCESSED_MARKER);
  }

  await tx.orders.update({
    where: { id: orderId },
    data: {
      status: nextStatus as any,
      admin_note: adminNote,
      updated_at: new Date()
    }
  });

  if (nextStatus === 'paid') {
    await tx.payments.updateMany({
      where: { order_id: orderId },
      data: {
        status: 'paid' satisfies payments_status,
        paid_at: new Date()
      }
    });
  } else if (nextStatus === 'completed') {
    const codPendingPayment = currentOrder.payments.some(
      (payment) => payment.method === 'cod' && payment.status === 'pending'
    );

    if (codPendingPayment) {
      await tx.payments.updateMany({
        where: {
          order_id: orderId,
          method: 'cod',
          status: 'pending'
        },
        data: {
          status: 'paid' satisfies payments_status,
          paid_at: new Date()
        }
      });
    }
  } else if (nextStatus === 'refunded') {
    await tx.payments.updateMany({
      where: {
        order_id: orderId,
        status: 'paid'
      },
      data: {
        status: 'refunded' satisfies payments_status
      }
    });
  }

  if (nextStatus === 'shipped') {
    await tx.shipments.updateMany({
      where: { order_id: orderId },
      data: {
        status: 'shipping',
        shipped_at: new Date()
      }
    });
  } else if (nextStatus === 'completed') {
    await tx.shipments.updateMany({
      where: { order_id: orderId },
      data: {
        status: 'delivered',
        delivered_at: new Date()
      }
    });
  } else if (nextStatus === 'cancelled') {
    await tx.shipments.updateMany({
      where: { order_id: orderId },
      data: {
        status: 'cancelled'
      }
    });
  }

  const updatedOrder = await tx.orders.findUnique({
    where: { id: orderId },
    include: {
      order_items: true,
      payments: true,
      shipments: true,
      user: true
    }
  });

  if (!updatedOrder) {
    throw new ApiError(404, 'Order not found after update');
  }

  return updatedOrder;
};

export const requestOrderRefund = async (
  tx: Prisma.TransactionClient,
  orderId: bigint,
  userId: bigint
) => {
  const order = await tx.orders.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (!order.user_id || order.user_id.toString() !== userId.toString()) {
    throw new ApiError(403, 'Unauthorized');
  }

  if (order.status !== 'completed') {
    throw new ApiError(400, 'Chỉ có thể yêu cầu hoàn tiền với đơn hàng đã hoàn thành');
  }

  const workflow = getRefundWorkflowState(order.admin_note);
  if (workflow.refund_requested) {
    throw new ApiError(400, 'Đơn hàng này đã được gửi yêu cầu hoàn tiền trước đó');
  }

  return tx.orders.update({
    where: { id: orderId },
    data: {
      admin_note: appendAdminNoteMarker(order.admin_note, REFUND_REQUEST_MARKER)
    }
  });
};

export const restockRefundedOrder = async (
  tx: Prisma.TransactionClient,
  orderId: bigint,
  actor?: WorkflowActor
) => {
  const order = await tx.orders.findUnique({
    where: { id: orderId },
    include: {
      order_items: true,
      shipments: true
    }
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (!['admin', 'manager'].includes(actor?.role || '')) {
    throw new ApiError(403, 'Chỉ admin hoặc manager mới được nhập lại kho cho đơn hoàn tiền');
  }

  const workflow = getRefundWorkflowState(order.admin_note);

  if (order.status !== 'refunded' || !workflow.refund_processed) {
    throw new ApiError(400, 'Chỉ có thể nhập lại kho cho đơn hàng đã hoàn tiền');
  }

  if (workflow.refund_restocked) {
    throw new ApiError(400, 'Đơn hàng này đã được nhập lại kho trước đó');
  }

  await restoreOrderStock(tx, order, `Restocked refunded order ${order.order_code}`);

  await tx.orders.update({
    where: { id: orderId },
    data: {
      admin_note: appendAdminNoteMarker(order.admin_note, REFUND_RESTOCKED_MARKER)
    }
  });

  await tx.shipments.updateMany({
    where: { order_id: orderId },
    data: {
      status: 'returned'
    }
  });

  const updatedOrder = await tx.orders.findUnique({
    where: { id: orderId },
    include: {
      order_items: true,
      payments: true,
      shipments: true,
      user: true
    }
  });

  if (!updatedOrder) {
    throw new ApiError(404, 'Order not found after restock');
  }

  return updatedOrder;
};
