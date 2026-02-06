import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import querystring from 'qs';
import dayjs from 'dayjs';
import { logActivity } from '../services/logger.service.js';
const prisma = new PrismaClient();
// VNPay Config (Should be in env)
const vnp_TmnCode = process.env.VNP_TMN_CODE || '2QXUI4J4'; // Demo code
const vnp_HashSecret = process.env.VNP_HASH_SECRET || 'secret';
const vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const vnp_ReturnUrl = process.env.VNP_RETURN_URL || 'http://localhost:5173/payment/vnpay-return';
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}
/**
 * Create VNPay Payment URL
 * POST /api/payment/create_url
 */
/**
 * Create VNPay Payment URL
 * POST /api/payment/create_url
 */
export const createPaymentUrl = async (req, res, next) => {
    try {
        const { order_id, bank_code } = req.body;
        const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        // Fetch Settings
        const settings = await prisma.$queryRaw `SELECT * FROM settings WHERE \`key\` IN ('payment_vnpay_tmn_code', 'payment_vnpay_hash_secret', 'payment_vnpay_url')`;
        const config = {};
        settings.forEach(s => config[s.key] = s.value);
        const vnp_TmnCode = config.payment_vnpay_tmn_code;
        const vnp_HashSecret = config.payment_vnpay_hash_secret;
        const vnp_Url = config.payment_vnpay_url || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        const vnp_ReturnUrl = process.env.VNP_RETURN_URL || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/vnpay-return`;
        if (!vnp_TmnCode || !vnp_HashSecret) {
            return res.status(400).json({ success: false, message: 'VNPay configuration is missing' });
        }
        const order = await prisma.orders.findUnique({
            where: { id: BigInt(order_id) }
        });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const date = new Date();
        const createDate = dayjs(date).format('YYYYMMDDHHmmss');
        const orderId = order.order_code; // Use order_code for VNPay txnRef
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = vnp_TmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang:' + orderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = Number(order.grand_total) * 100;
        vnp_Params['vnp_ReturnUrl'] = vnp_ReturnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        if (bank_code) {
            vnp_Params['vnp_BankCode'] = bank_code;
        }
        vnp_Params = sortObject(vnp_Params);
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;
        const vnpUrl = vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
        res.json({
            success: true,
            data: { url: vnpUrl }
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Handle VNPay Return (IPN/Callback)
 * GET /api/payment/vnpay_return
 */
export const vnpayReturn = async (req, res, next) => {
    try {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];
        vnp_Params = sortObject(vnp_Params);
        // Fetch Hash Secret
        const settings = await prisma.$queryRaw `SELECT * FROM settings WHERE \`key\` = 'payment_vnpay_hash_secret'`;
        const vnp_HashSecret = settings.length > 0 ? settings[0].value : '';
        if (!vnp_HashSecret) {
            return res.status(400).json({ success: false, message: 'Payment config missing' });
        }
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        if (secureHash === signed) {
            // Check transaction status
            // vnp_ResponseCode: 00 = Success
            const orderCode = vnp_Params['vnp_TxnRef'];
            const rspCode = vnp_Params['vnp_ResponseCode'];
            const order = await prisma.orders.findUnique({
                where: { order_code: orderCode }
            });
            if (order) {
                if (rspCode === '00') {
                    // Success
                    await prisma.orders.update({
                        where: { id: order.id },
                        data: { status: 'paid' }
                    });
                    await prisma.payments.updateMany({
                        where: { order_id: order.id },
                        data: {
                            status: 'paid',
                            paid_at: new Date(),
                            transaction_ref: vnp_Params['vnp_TransactionNo']
                        }
                    });
                    // Log
                    logActivity({
                        user_id: order.user_id || undefined,
                        action: 'payment_success',
                        entity_type: 'order',
                        entity_id: order.id.toString(),
                        details: `VNPay Success. Ref: ${vnp_Params['vnp_TransactionNo']}`
                    });
                    res.json({ success: true, message: 'Payment success', data: { order_code: orderCode } });
                }
                else {
                    // Failed
                    await prisma.payments.updateMany({
                        where: { order_id: order.id },
                        data: { status: 'failed' }
                    });
                    res.json({ success: false, message: 'Payment failed' });
                }
            }
            else {
                res.status(404).json({ success: false, message: 'Order not found' });
            }
        }
        else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    }
    catch (error) {
        next(error);
    }
};
/**
 * Handle VNPay IPN (Server to Server)
 * GET /api/payment/vnpay_ipn
 */
export const vnpayIpn = async (req, res, next) => {
    try {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];
        vnp_Params = sortObject(vnp_Params);
        // Fetch Hash Secret
        const settings = await prisma.$queryRaw `SELECT * FROM settings WHERE \`key\` = 'payment_vnpay_hash_secret'`;
        const vnp_HashSecret = settings.length > 0 ? settings[0].value : '';
        if (!vnp_HashSecret) {
            console.error("VNPAY IPN: Missing Hash Secret");
            return res.status(200).json({ RspCode: '99', Message: 'Config Missing' });
        }
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        if (secureHash === signed) {
            const orderCode = vnp_Params['vnp_TxnRef'];
            const rspCode = vnp_Params['vnp_ResponseCode'];
            const order = await prisma.orders.findUnique({ where: { order_code: orderCode } });
            if (order) {
                if (rspCode === '00') {
                    await prisma.orders.update({
                        where: { id: order.id },
                        data: { status: 'paid' }
                    });
                    await prisma.payments.updateMany({
                        where: { order_id: order.id },
                        data: {
                            status: 'paid',
                            paid_at: new Date(),
                            transaction_ref: vnp_Params['vnp_TransactionNo']
                        }
                    });
                }
                res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
            }
            else {
                res.status(200).json({ RspCode: '01', Message: 'Order not found' });
            }
        }
        else {
            res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
        }
    }
    catch (error) {
        res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};
/**
 * Get all transactions
 * GET /api/payment/transactions
 */
export const getTransactions = async (req, res, next) => {
    try {
        const { search, status } = req.query;
        const where = {};
        if (status && status !== 'all')
            where.status = status;
        if (search) {
            where.OR = [
                { transaction_ref: { contains: search } },
                { order: { order_code: { contains: search } } }
            ];
        }
        const transactions = await prisma.payments.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: {
                order: { select: { order_code: true, customer_name: true } }
            },
            take: 50
        });
        const formatted = transactions.map((tx) => ({
            id: tx.id.toString(),
            order_id: tx.order_id.toString(),
            order_code: tx.order.order_code,
            customer_name: tx.order.customer_name,
            method: tx.method,
            status: tx.status,
            amount: Number(tx.amount),
            transaction_ref: tx.transaction_ref,
            paid_at: tx.paid_at,
            created_at: tx.created_at
        }));
        res.json({ success: true, data: formatted });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=payment.controller.js.map