import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Supports Casso / Sepay / Generic Webhook format
// Expected body: { data: [ { description: "...", amount: 10000, ... } ] } or simple object
export const handleBankWebhook = async (req, res) => {
    try {
        console.log("Bank Webhook Received:", JSON.stringify(req.body, null, 2));
        const transactions = req.body.data || (Array.isArray(req.body) ? req.body : [req.body]);
        if (!transactions || transactions.length === 0) {
            return res.status(200).json({ success: true, message: "No transactions processed" });
        }
        const processedOrders = [];
        for (const trans of transactions) {
            const description = (trans.description || trans.content || '').toUpperCase();
            const amount = parseFloat(trans.amount || trans.transferAmount || '0');
            if (!description)
                continue;
            // Find order code in description (e.g. "ORD123456" or just order code)
            // We look for patterns or assume the order code is present.
            // Let's search for "ORDER ID" or simply try to match existing orders.
            // A simple approach is to extract all potential alphanumeric codes and check DB.
            // But since our order codes are "ORD..." (usually), we can regex for it.
            // If the user's order codes are formatted differently, we might need a broader search.
            // Assuming order_code regex like /ORD[A-Z0-9]+/ or just searching for the code string if we know the pattern.
            // For now, let's try to find an order that matches exactly or contains the code.
            // Heuristic: Extract all "words" and check if any is an Order Code with status 'pending'
            const potentialCodes = description.match(/[A-Z0-9]{3,20}/g) || [];
            for (const code of potentialCodes) {
                const order = await prisma.orders.findUnique({
                    where: { order_code: code },
                    include: { payments: true }
                });
                // Check if order exists and is pending/processing
                if (order && (order.status === 'pending' || order.status === 'processing')) {
                    // Check amount (allow small diff for fees if needed, but usually exact)
                    const orderTotal = parseFloat(order.grand_total.toString());
                    if (amount >= orderTotal) {
                        // Success! Update Order
                        await prisma.$transaction([
                            prisma.orders.update({
                                where: { id: order.id },
                                data: {
                                    status: 'processing', // or 'paid' depending on workflow
                                    updated_at: new Date()
                                }
                            }),
                            prisma.payments.updateMany({
                                where: { order_id: order.id },
                                data: {
                                    status: 'paid',
                                    paid_at: new Date(),
                                    transaction_ref: trans.tid || trans.id?.toString() || 'WEBHOOK'
                                }
                            })
                        ]);
                        // Log notification
                        await prisma.notifications.create({
                            data: {
                                type: 'order_status',
                                title: 'Thanh toán thành công',
                                message: `Đơn hàng #${order.order_code} đã được thanh toán qua chuyển khoản.`,
                                is_read: false,
                                link: `/admin/orders/${order.order_code}`
                            }
                        });
                        console.log(`Order ${order.order_code} confirmed paid by webhook.`);
                        processedOrders.push(order.order_code);
                        break; // Found the order for this transaction
                    }
                }
            }
        }
        res.json({ success: true, processed: processedOrders });
    }
    catch (error) {
        console.error("Webhook Error:", error);
        res.status(200).json({ success: false, message: "Error processing webhook" }); // Return 200 to keep webhook sender happy
    }
};
//# sourceMappingURL=payment-webhook.controller.js.map