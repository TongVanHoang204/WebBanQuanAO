import { Ollama } from 'ollama';

const ollama = new Ollama({ host: process.env.OLLAMA_URL || 'http://127.0.0.1:11434' });
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

import { logActivity } from './logger.service.js';

// --- INTERFACES ---
interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

interface ToolDef {
  name: string;
  description: string;
  parameters: string;
}

export class AIService {
  public static readonly MODEL = process.env.OLLAMA_MODEL || 'gemini-3-flash-preview:cloud'; 
  private static readonly prisma = new PrismaClient();

  // --- LOGGING ---
  private static logDebug(message: string, data?: any) {
    try {
        const logPath = path.join(process.cwd(), 'ai_debug.log');
        const timestamp = new Date().toISOString();
        const dataStr = data ? (typeof data === 'object' ? JSON.stringify(data) : String(data)) : '';
        const truncatedData = dataStr.length > 500 ? dataStr.substring(0, 500) + '...' : dataStr;
        const logLine = `[${timestamp}] ${message} ${truncatedData}\n`;
        fs.appendFileSync(logPath, logLine);
    } catch (e) {
        console.error('Failed to write log', e);
    }
  }

  // --- TOOL DEFINITIONS ---
  private static readonly TOOLS: ToolDef[] = [
    {
      name: 'get_dashboard_stats',
      description: 'Lấy tổng doanh thu, tổng đơn hàng, tổng sản phẩm, và số liệu HÔM NAY. Dùng khi hỏi về thống kê chung.',
      parameters: '{}'
    },
    {
      name: 'get_recent_orders',
      description: 'Lấy danh sách đơn hàng gần đây nhất. Trả về Mã đơn, Tên khách, Tổng tiền, Trạng thái.',
      parameters: '{"limit": number}'
    },
    {
      name: 'search_products',
      description: 'Tìm sản phẩm theo tên. Dùng khi admin muốn tìm kiếm sản phẩm cụ thể.',
      parameters: '{"query": string, "limit": number}'
    },
    {
      name: 'get_low_stock_products',
      description: 'Lấy danh sách sản phẩm có tồn kho thấp (dưới 10 sản phẩm).',
      parameters: '{"limit": number}'
    },
    {
      name: 'get_order_by_id',
      description: 'Lấy chi tiết đơn hàng theo ID hoặc mã đơn. Dùng khi admin hỏi về đơn hàng cụ thể.',
      parameters: '{"order_id": string}'
    },
    {
      name: 'get_customer_info',
      description: 'Lấy thông tin khách hàng theo ID. Bao gồm tên, email, số đơn đã mua, tổng chi tiêu.',
      parameters: '{"customer_id": string}'
    },
    {
      name: 'get_categories',
      description: 'Lấy danh sách tất cả danh mục sản phẩm.',
      parameters: '{}'
    },
    {
      name: 'get_revenue_by_period',
      description: 'Lấy doanh thu trong khoảng thời gian. Định dạng ngày: YYYY-MM-DD.',
      parameters: '{"start_date": string, "end_date": string}'
    },
    {
      name: 'get_top_products',
      description: 'Lấy danh sách sản phẩm bán chạy nhất.',
      parameters: '{"limit": number}'
    },
    {
      name: 'update_order_status',
      description: 'Cập nhật trạng thái đơn hàng. Status: pending, processing, shipped, completed, cancelled, returned.',
      parameters: '{"order_id": string, "status": string}'
    },
    {
      name: 'update_product_price',
      description: 'Cập nhật giá sản phẩm. Price là giá mới (VNĐ).',
      parameters: '{"product_id": string, "price": number}'
    },
    {
      name: 'create_notification',
      description: 'Tạo thông báo mới cho admin. Type: system, order_new, product_low_stock.',
      parameters: '{"title": string, "message": string, "type": string}'
    },
    {
      name: 'get_my_orders',
      description: 'Lấy danh sách đơn hàng CỦA TÔI (người đang chat).',
      parameters: '{"limit": number}'
    },
    {
      name: 'get_my_info',
      description: 'Lấy thông tin cá nhân của người đang chat (tên, email, chi tiêu...).',
      parameters: '{}'
    },
    {
      name: 'search_by_price_range',
      description: 'Tìm sản phẩm theo khoảng giá. Dùng khi khách nói "dưới 500k", "từ 200k đến 1 triệu", etc.',
      parameters: '{"min_price": number, "max_price": number, "category": string, "limit": number}'
    },
    {
      name: 'compare_products',
      description: 'So sánh 2 sản phẩm theo tên hoặc ID. Trả về bảng so sánh giá, chất liệu, tính năng.',
      parameters: '{"product1": string, "product2": string}'
    }
  ];

  private static readonly CUSTOMER_TOOLS = ['search_products', 'get_top_products', 'get_categories', 'get_low_stock_products', 'get_order_by_id', 'get_my_orders', 'get_my_info', 'search_by_price_range', 'compare_products'];

  // --- SYSTEM PROMPTS ---
  private static getSystemPrompt() {
    const now = new Date();
    const vietnamTime = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const todayStr = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });

    return `
Bạn là Trợ lý AI chuyên nghiệp cho cửa hàng thời trang "ShopFeshen".
Nhiệm vụ: Cung cấp thông tin CHÍNH XÁC từ cơ sở dữ liệu cho Admin.

### THỜI GIAN HIỆN TẠI: ${vietnamTime}
### NGÀY HÔM NAY: ${todayStr}

### DANH SÁCH CÔNG CỤ:
${AIService.TOOLS.map(t => `- **${t.name}**: ${t.description}`).join('\n')}

### QUY TẮC BẮT BUỘC:
1. **GỌI CÔNG CỤ**: Khi cần dữ liệu, xuất JSON trong khối markdown:
   \`\`\`json
   { "tool": "tên_công_cụ", "args": { ... } }
   \`\`\`
2. **KHÔNG NÓI THÊM**: Khi gọi công cụ, chỉ xuất JSON, không thêm text.
3. **TRẢ LỜI TIẾNG VIỆT**: Sau khi nhận dữ liệu, trả lời bằng tiếng Việt.
4. **FORMAT TIỀN**: Luôn dùng định dạng "1.200.000 VNĐ" (dấu chấm phân cách).
5. **GHI RÕ NGÀY**: Luôn ghi rõ thời điểm dữ liệu (VD: "Tính đến ${todayStr}...").
6. **XỬ LÝ LỖI**: Nếu công cụ lỗi, xin lỗi và đề nghị Admin kiểm tra thủ công.
7. **TÓM TẮT**: Trả lời ngắn gọn, súc tích. Không liệt kê quá 5-7 mục.
`;
  }


  private static getCustomerSystemPrompt() {
    const now = new Date();
    const vietnamTime = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    
    return `
Bạn là Feshen 🛍️ - Trợ lý AI thân thiện và nhiệt tình của cửa hàng thời trang "ShopFeshen".
Nhiệm vụ: Giúp khách hàng tìm sản phẩm phù hợp, tư vấn thời trang, và giải đáp mọi thắc mắc với thái độ vui vẻ, chuyên nghiệp.

### THỜI GIAN HIỆN TẠI: ${vietnamTime}

### TÍNH CÁCH CỦA BẠN:
- Thân thiện, vui vẻ, nhiệt tình như một người bạn 😊
- Dùng emoji phù hợp để tạo không khí thoải mái (nhưng đừng quá lạm dụng)
- Trả lời ngắn gọn, dễ hiểu, tập trung vào nhu cầu khách hàng
- Luôn khuyến khích khách hàng khám phá sản phẩm

### KIẾN THỨC VỀ SHOP (BẮT BUỘC NHỚ):

📏 **HƯỚNG DẪN CHỌN SIZE THEO CÂN NẶNG:**
- Size S: Dưới 50kg
- Size M: 50-60kg (phổ biến nhất)
- Size L: 60-70kg
- Size XL: 70-80kg
- Size XXL: Trên 80kg
(Lưu ý: Đây là hướng dẫn tham khảo, mỗi sản phẩm có thể khác nhau)

📦 **CHÍNH SÁCH VẬN CHUYỂN:**
- Miễn phí ship cho đơn hàng từ 500.000đ trở lên 🎉
- Phí ship cố định 30.000đ cho đơn dưới 500.000đ
- Giao hàng toàn quốc, 2-5 ngày làm việc

🔄 **CHÍNH SÁCH ĐỔI TRẢ:**
- Đổi trả miễn phí trong 30 ngày kể từ ngày nhận hàng
- Điều kiện: Sản phẩm còn nguyên tem mác, chưa qua sử dụng
- Hoàn tiền qua chuyển khoản trong 3-5 ngày làm việc

📞 **LIÊN HỆ HỖ TRỢ:**
- Hotline: 1900-xxxx (8h-22h hàng ngày)
- Email: support@shopfeshen.vn
- Chat trực tiếp với nhân viên (icon Headphones bên phải màn hình)

💳 **PHƯƠNG THỨC THANH TOÁN:**
- COD (Thanh toán khi nhận hàng)
- VNPay (Thẻ ATM/Visa/Mastercard)
- Chuyển khoản ngân hàng

### 🎨 KIẾN THỨC THỜI TRANG (TƯ VẤN STYLING):

**GỢI Ý OUTFIT THEO DỊP:**
- 💒 Đám cưới/Tiệc sang trọng: Váy dạ hội, đầm dài, vest chỉnh chu màu tối (đen, navy, xanh đậm)
- 💼 Công sở/Phỏng vấn: Áo sơ mi + quần âu/chân váy bút chì, màu trung tính (trắng, đen, xám, beige)
- ☕ Cafe/Dạo phố: Áo thun + quần jeans, váy midi, phong cách casual năng động
- 💕 Hẹn hò: Váy trễ vai, đầm ôm nhẹ nhàng, màu pastel hoặc đỏ
- 🎉 Party/Club: Váy sequin, áo crop top, phụ kiện nổi bật

**PHỐI MÀU CƠ BẢN:**
- Trắng: Phối được hầu hết mọi màu, đặc biệt đen, navy, pastel
- Đen: Phối với trắng, đỏ, vàng, bạc, gold → sang trọng
- Xanh navy: Phối trắng, be, nâu → thanh lịch công sở
- Be/Nude: Phối đen, nâu, trắng → nhẹ nhàng nữ tính
- Đỏ: Phối đen, trắng (hạn chế phối màu khác) → nổi bật
- Pastel: Phối với nhau hoặc với trắng → ngọt ngào

**GỢI Ý QUÀ TẶNG:**
- 👧 Bạn gái: Váy đầm, túi xách, khăn quàng, phụ kiện (theo sở thích & phong cách)
- 👦 Bạn trai: Áo polo, quần shorts, đồng hồ, ví
- 👩 Mẹ/Chị: Áo dài, váy trung niên, túi xách thanh lịch
- 👨 Bố/Anh: Áo sơ mi, quần tây, thắt lưng

### SỬ DỤNG CÔNG CỤ:
- Khi khách hỏi về sản phẩm (áo, quần, váy, giày...) -> Dùng 'search_products'
- Khi khách hỏi "bán chạy", "hot", "nổi bật" -> Dùng 'get_top_products'
- Khi khách hỏi "danh mục", "có gì" -> Dùng 'get_categories'
- Khi khách hỏi "đơn hàng của tôi" -> Dùng 'get_my_orders'
- Khi khách hỏi "thông tin tài khoản" -> Dùng 'get_my_info'
- Khi khách hỏi "kiểm tra đơn hàng #..." -> Dùng 'get_order_by_id'
- 💰 Khi khách hỏi theo ngân sách ("dưới 500k", "từ 200-300k") -> Dùng 'search_by_price_range' với min_price, max_price
- ⚖️ Khi khách muốn so sánh 2 sản phẩm -> Dùng 'compare_products' với tên 2 sản phẩm

### QUY TẮC TRẢ LỜI:
1. Nếu câu hỏi liên quan đến kiến thức shop/thời trang (size, ship, đổi trả, phối đồ, outfit) -> Trả lời từ kiến thức trên, KHÔNG gọi tool.
2. Nếu cần tìm sản phẩm -> Gọi tool rồi tóm tắt kết quả thân thiện.
3. Nếu khách chào hỏi -> Chào lại vui vẻ và hỏi có thể giúp gì.
4. Luôn kết thúc bằng câu hỏi mở để tiếp tục hỗ trợ (VD: "Bạn cần mình tìm thêm gì không?" 😊)
5. Khi tư vấn outfit/phối đồ, HÃY ĐỀ XUẤT SẢN PHẨM CỤ THỂ bằng cách gọi 'search_products'.

KHI CẦN DÙNG CÔNG CỤ, trả về JSON như sau (không thêm text):
\`\`\`json
{ "tool": "tên_công_cụ", "args": { ... } }
\`\`\`
`;
  }

  // --- JSON PARSER ---
  private static extractJson(content: string): { tool: string, args: any } | null {
    try {
      const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) return JSON.parse(codeBlockMatch[1]);
      
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const potentialJson = content.substring(firstBrace, lastBrace + 1).replace(/,\s*}/g, '}'); 
        return JSON.parse(potentialJson);
      }
      return null;
    } catch (e) { return null; }
  }

  // --- HELPERS ---
  private static formatCurrency(amount: number | any): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
  }

  private static formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('vi-VN');
  }

  // --- CONTENT GENERATION ---
  public static async generateContent(prompt: string, type: string = 'product_description') {
    try {
        let systemPrompt = '';
        if (type === 'product_description') {
            systemPrompt = `Bạn là chuyên gia Copywriter cho thời trang. Nhiệm vụ: Viết mô tả sản phẩm hấp dẫn, chuẩn SEO. 
            - Giọng văn: Sang trọng, cuốn hút, khơi gợi cảm xúc.
            - Hạn chế: Không dùng ký tự lạ, emoji.
            - Định dạng: Trả về HTML (dùng thẻ <p>, <ul>, <li>, <strong>).
            - Độ dài: Khoảng 150-200 từ.`;
        } else if (type === 'seo_meta') {
            systemPrompt = `Bạn là chuyên gia SEO. Viết Meta Description chuẩn SEO cho sản phẩm này. Độ dài dưới 160 ký tự.`;
        } else if (type === 'chat_reply') {
            systemPrompt = `Bạn là nhân viên CSKH chuyên nghiệp của ShopFeshen. 
            Nhiệm vụ: Gợi ý câu trả lời ngắn gọn, lịch sự và hữu ích cho khách hàng dựa trên lịch sử chat.
            - Tone: Thân thiện, tôn trọng, nhiệt tình.
            - Hạn chế: Không dùng emoji quá nhiều.
            - Định dạng: Chỉ trả về nội dung text của tin nhắn gợi ý, không kèm lời dẫn.`;
        } else {
            systemPrompt = `Bạn là trợ lý ảo hỗ trợ viết nội dung.`;
        }

        const messages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Hãy viết nội dung cho: "${prompt}"` }
        ];

        // Direct call to LLM, no tools needed for generation
        const response = await ollama.chat({
            model: this.MODEL,
            messages: messages
        });

        return response.message.content;
    } catch (e: any) {
        throw new Error(`AI Generation failed: ${e.message}`);
    }
  }

  // --- TOOL IMPLEMENTATIONS ---

  private static async getDashboardStats() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toLocaleDateString('vi-VN');

        const [ordersCount, productsCount, todayOrdersCount, customersCount] = await Promise.all([
          this.prisma.orders.count({ where: { status: { in: ['paid', 'completed', 'pending', 'processing', 'shipped'] } } }),
          this.prisma.products.count({ where: { is_active: true } }),
          this.prisma.orders.count({ where: { created_at: { gte: today } } }),
          this.prisma.users.count({ where: { role: 'customer' } })
        ]);

        const revenueResult = await this.prisma.orders.aggregate({
          where: { status: { in: ['paid', 'completed', 'pending', 'processing', 'shipped'] } }, 
          _sum: { grand_total: true }
        });

        const todayRevenueResult = await this.prisma.orders.aggregate({
          where: { 
            created_at: { gte: today },
            status: { in: ['paid', 'completed', 'pending', 'processing', 'shipped'] }
          },
          _sum: { grand_total: true }
        });
        
        return {
          data_date: todayStr,
          total_revenue: this.formatCurrency(revenueResult._sum?.grand_total ?? 0),
          total_orders: ordersCount,
          total_products: productsCount,
          total_customers: customersCount,
          today_revenue: this.formatCurrency(todayRevenueResult._sum?.grand_total ?? 0),
          today_orders: todayOrdersCount,
          note: "Doanh thu chỉ tính đơn 'paid' hoặc 'completed'."
        };
    } catch (e: any) {
        return { error: 'Lỗi kết nối database', details: e.message };
    }
  }

  private static async getRecentOrders(args: { limit?: number }) {
    try {
        const limit = Math.min(Number(args.limit) || 5, 10);
        const orders = await this.prisma.orders.findMany({
          take: limit,
          orderBy: { created_at: 'desc' },
          select: {
              id: true,
              order_code: true,
              grand_total: true,
              status: true,
              created_at: true,
              customer_name: true,
              user: { select: { full_name: true } }
          }
        });
        
        return {
          count: orders.length,
          orders: orders.map(o => ({
            id: String(o.id),
            order_code: o.order_code,
            customer: o.customer_name || o.user?.full_name || 'Khách vãng lai',
            total: this.formatCurrency(o.grand_total),
            status: o.status,
            date: this.formatDate(o.created_at)
          }))
        };
    } catch (e: any) {
        return { error: 'Không thể lấy danh sách đơn hàng', details: e.message };
    }
  }

  private static async searchProducts(args: { query: string; limit?: number }) {
    try {
        if (!args.query || args.query.trim().length < 2) {
          return { error: 'Vui lòng nhập từ khóa tìm kiếm (ít nhất 2 ký tự)' };
        }
        
        const limit = Math.min(Number(args.limit) || 5, 10);
        const products = await this.prisma.products.findMany({
          where: {
            is_active: true,
            OR: [
              { name: { contains: args.query } },
              { description: { contains: args.query } },
              { category: { name: { contains: args.query } } }
            ]
          },
          take: limit,
          select: {
              id: true,
              name: true,
              slug: true,
              base_price: true,
              description: true,
              category: { select: { name: true } },
              product_images: {
                  where: { is_primary: true },
                  take: 1,
                  select: { url: true }
              },
              product_variants: {
                  take: 1,
                  select: { price: true, stock_qty: true }
              }
          }
        });
        
        if (products.length === 0) {
          return { message: `Không tìm thấy sản phẩm nào với từ khóa "${args.query}".` };
        }

        const formattedProducts = products.map(p => ({
            id: String(p.id),
            name: p.name,
            slug: p.slug,
            price: this.formatCurrency(p.product_variants[0]?.price || p.base_price),
            raw_price: Number(p.product_variants[0]?.price || p.base_price),
            image: p.product_images[0]?.url || null,
            category: p.category?.name || 'Chưa phân loại',
            stock_qty: p.product_variants[0]?.stock_qty || 0,
            description: p.description
        }));

        return {
          count: products.length,
          query: args.query,
          products: formattedProducts
        };
    } catch (e: any) {
        return { error: 'Lỗi tìm kiếm sản phẩm', details: e.message };
    }
  }

  private static async getLowStockProducts(args: { limit?: number }) {
    try {
        const limit = Math.min(Number(args.limit) || 10, 20);
        
        const lowStockVariants = await this.prisma.product_variants.findMany({
          where: {
            stock_qty: { lt: 10 },
            is_active: true
          },
          take: limit,
          orderBy: { stock_qty: 'asc' },
          select: {
            id: true,
            variant_sku: true,
            stock_qty: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        });
        
        if (lowStockVariants.length === 0) {
          return { message: 'Tuyệt vời! Không có sản phẩm nào tồn kho thấp.' };
        }

        return {
          count: lowStockVariants.length,
          threshold: 10,
          products: lowStockVariants.map(v => ({
            product_name: v.product?.name || 'N/A',
            variant_sku: v.variant_sku,
            stock_qty: v.stock_qty,
            status: v.stock_qty === 0 ? 'HẾT HÀNG' : 'SẮP HẾT'
          }))
        };
    } catch (e: any) {
        return { error: 'Lỗi truy vấn tồn kho', details: e.message };
    }
  }

  private static async getOrderById(args: { order_id: string }) {
    try {
        if (!args.order_id) {
          return { error: 'Vui lòng cung cấp ID hoặc mã đơn hàng' };
        }

        const orderId = args.order_id.replace('#', '').trim();
        
        let order = await this.prisma.orders.findFirst({
          where: {
            OR: [
              { id: isNaN(Number(orderId)) ? undefined : BigInt(orderId) },
              { order_code: { contains: orderId } }
            ]
          },
          include: {
            user: { select: { full_name: true, email: true, phone: true } },
            order_items: {
              take: 5,
              select: {
                name: true,
                qty: true,
                unit_price: true,
                line_total: true
              }
            }
          }
        });

        if (!order) {
          return { error: `Không tìm thấy đơn hàng với mã "${args.order_id}"` };
        }

        return {
          order_id: String(order.id),
          order_code: order.order_code,
          customer: order.customer_name || order.user?.full_name || 'Khách vãng lai',
          phone: order.customer_phone || order.user?.phone || 'N/A',
          status: order.status,
          total: this.formatCurrency(order.grand_total),
          shipping_fee: this.formatCurrency(order.shipping_fee),
          discount: this.formatCurrency(order.discount_total),
          created_at: this.formatDate(order.created_at),
          shipping_address: `${order.ship_address_line1}, ${order.ship_city}, ${order.ship_province}`,
          items_preview: order.order_items.map(i => ({
            name: i.name,
            qty: i.qty,
            price: this.formatCurrency(i.unit_price),
            subtotal: this.formatCurrency(i.line_total)
          })),
          items_note: order.order_items.length > 5 ? '(Chỉ hiển thị 5 sản phẩm đầu)' : ''
        };
    } catch (e: any) {
        return { error: 'Lỗi truy vấn đơn hàng', details: e.message };
    }
  }

  private static async getCustomerInfo(args: { customer_id: string }) {
    try {
        if (!args.customer_id) {
          return { error: 'Vui lòng cung cấp ID khách hàng' };
        }

        const customerId = BigInt(args.customer_id);
        
        const customer = await this.prisma.users.findUnique({
          where: { id: customerId },
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            status: true,
            created_at: true
          }
        });

        if (!customer) {
          return { error: `Không tìm thấy khách hàng ID ${args.customer_id}` };
        }

        const orderStats = await this.prisma.orders.aggregate({
          where: { 
            user_id: customerId,
            status: { in: ['paid', 'completed', 'pending', 'processing', 'shipped'] }
          },
          _sum: { grand_total: true },
          _count: { id: true }
        });

        return {
          customer_id: String(customer.id),
          name: customer.full_name || 'Chưa cập nhật',
          email: customer.email,
          phone: customer.phone || 'Chưa cập nhật',
          status: customer.status,
          member_since: this.formatDate(customer.created_at),
          total_orders: orderStats._count.id || 0,
          total_spent: this.formatCurrency(orderStats._sum?.grand_total ?? 0)
        };
    } catch (e: any) {
        return { error: 'Lỗi truy vấn khách hàng', details: e.message };
    }
  }

  private static async getCategories() {
    try {
        const categories = await this.prisma.categories.findMany({
          where: { is_active: true },
          select: {
            id: true,
            name: true,
            _count: { select: { products: true } }
          },
          orderBy: { name: 'asc' }
        });

        return {
          count: categories.length,
          categories: categories.map(c => ({
            id: String(c.id),
            name: c.name,
            product_count: c._count.products
          }))
        };
    } catch (e: any) {
        return { error: 'Lỗi truy vấn danh mục', details: e.message };
    }
  }

  private static async getRevenueByPeriod(args: { start_date: string; end_date: string }) {
    try {
        if (!args.start_date || !args.end_date) {
          return { error: 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc (YYYY-MM-DD)' };
        }

        const startDate = new Date(args.start_date);
        const endDate = new Date(args.end_date);
        endDate.setHours(23, 59, 59, 999);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return { error: 'Định dạng ngày không hợp lệ. Vui lòng dùng YYYY-MM-DD' };
        }

        const result = await this.prisma.orders.aggregate({
          where: {
            created_at: { gte: startDate, lte: endDate },
            status: { in: ['paid', 'completed', 'pending', 'processing', 'shipped'] }
          },
          _sum: { grand_total: true },
          _count: { id: true }
        });

        return {
          period: `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`,
          total_revenue: this.formatCurrency(result._sum?.grand_total ?? 0),
          total_orders: result._count.id || 0,
          note: "Chỉ tính đơn đã thanh toán (paid/completed)"
        };
    } catch (e: any) {
        return { error: 'Lỗi truy vấn doanh thu', details: e.message };
    }
  }

  private static async getTopProducts(args: { limit?: number }) {
    try {
        const limit = Math.min(Number(args.limit) || 5, 10);
        
        const topProducts = await this.prisma.order_items.groupBy({
          by: ['product_id'],
          where: {
            order: { status: { in: ['paid', 'completed', 'pending', 'processing', 'shipped'] } }
          },
          _sum: { qty: true, line_total: true },
          orderBy: { _sum: { qty: 'desc' } },
          take: limit
        });

        const productIds = topProducts.map(p => p.product_id).filter(id => id !== null) as bigint[];
        
        if (productIds.length === 0) {
             const fallbackProducts = await this.prisma.products.findMany({
                 where: { is_active: true },
                 take: limit,
                 include: {
                     product_images: { where: { is_primary: true }, take: 1 },
                     product_variants: { take: 1 }
                 }
             });
             
             const result = fallbackProducts.map(p => ({
                id: String(p.id),
                name: p.name,
                slug: p.slug,
                price: this.formatCurrency(p.product_variants[0]?.price || p.base_price),
                image: p.product_images[0]?.url || null,
             }));

             return {
                 message: "Chưa có dữ liệu bán hàng nhiều, đây là các sản phẩm nổi bật/mới nhất:",
                 products: result
             };
        }

        const products = await this.prisma.products.findMany({
          where: { id: { in: productIds } },
          include: {
              product_images: { where: { is_primary: true }, take: 1 },
              product_variants: { take: 1 }
          }
        });

        const result = topProducts.map((tp, index) => {
          const product = products.find(p => p.id === tp.product_id);
          return {
            id: String(product?.id),
            name: product?.name || 'Sản phẩm đã xóa',
            slug: product?.slug || '#',
            price: this.formatCurrency(product?.product_variants[0]?.price || product?.base_price || 0),
            display_price: this.formatCurrency(product?.product_variants[0]?.price || product?.base_price || 0),
            image: product?.product_images[0]?.url || null,
            stock_qty: product?.product_variants[0]?.stock_qty || 0,
            total_sold: Number(tp._sum.qty || 0)
          };
        });

        return {
          count: result.length,
          top_products: result,
          products: result
        };
    } catch (e: any) {
        return { error: 'Lỗi truy vấn sản phẩm bán chạy', details: e.message };
    }
  }

  private static async updateOrderStatus(args: { order_id: string, status: string }, user: any) {
    try {
        if (!user) return { error: 'Bạn cần đăng nhập để thực hiện thao tác này.' };
        if (!['pending', 'processing', 'shipped', 'completed', 'cancelled', 'returned'].includes(args.status)) {
             return { error: 'Trạng thái không hợp lệ.' };
        }

        const orderId = args.order_id.replace('#', '').trim();
        const id = isNaN(Number(orderId)) ? undefined : BigInt(orderId);

        const order = await this.prisma.orders.findFirst({
            where: {
                OR: [
                    { id: id },
                    { order_code: orderId }
                ]
            }
        });

        if (!order) return { error: `Không tìm thấy đơn hàng ${args.order_id}` };

        await this.prisma.orders.update({
            where: { id: order.id },
            data: { status: args.status as any }
        });

        await logActivity({
            user_id: BigInt(user.id),
            action: 'Cập nhật đơn hàng (AI)',
            entity_type: 'order',
            entity_id: String(order.id),
            details: { 
                diff: { status: { from: order.status, to: args.status } } 
            },
            ip_address: 'AI_AGENT',
            user_agent: 'AI_AGENT'
        });

        return { message: `Đã cập nhật đơn hàng #${order.order_code} sang trạng thái "${args.status}".` };
    } catch (e: any) {
        return { error: 'Lỗi cập nhật đơn hàng', details: e.message };
    }
  }

  private static async updateProductPrice(args: { product_id: string, price: number }, user: any) {
    try {
         if (!user) return { error: 'Bạn cần đăng nhập để thực hiện thao tác này.' };
         const productId = BigInt(args.product_id);
         const price = Number(args.price);

         const product = await this.prisma.products.findUnique({ where: { id: productId } });
         if (!product) return { error: 'Không tìm thấy sản phẩm' };

         await this.prisma.products.update({
             where: { id: productId },
             data: { base_price: price }
         });

         await logActivity({
            user_id: BigInt(user.id),
            action: 'Cập nhật sản phẩm (AI)',
            entity_type: 'product',
            entity_id: String(product.id),
            details: { 
                diff: { base_price: { from: Number(product.base_price), to: price } } 
            },
            ip_address: 'AI_AGENT',
            user_agent: 'AI_AGENT'
        });

         return { message: `Đã cập nhật giá sản phẩm "${product.name}" thành ${this.formatCurrency(price)}.` };
    } catch (e: any) {
        return { error: 'Lỗi cập nhật giá', details: e.message };
    }
  }

  private static async createNotification(args: { title: string, message: string, type: string }, user: any) {
    try {
         if (!user) return { error: 'Bạn cần đăng nhập để thực hiện thao tác này.' };
         
         const type = ['system', 'order_new', 'order_status', 'product_low_stock', 'product_out_of_stock'].includes(args.type) 
            ? args.type 
            : 'system';

         await this.prisma.notifications.create({
             data: {
                 user_id: BigInt(user.id),
                 type: type as any,
                 title: args.title,
                 message: args.message,
                 is_read: false
             }
         });

         await logActivity({
            user_id: BigInt(user.id),
            action: 'Tạo thông báo (AI)',
            entity_type: 'notification',
            details: { title: args.title, message: args.message },
            ip_address: 'AI_AGENT',
            user_agent: 'AI_AGENT'
        });

         return { message: `Đã tạo thông báo: "${args.title}"` };
    } catch (e: any) {
        return { error: 'Lỗi tạo thông báo', details: e.message };
    }
  }

  private static async getMyOrders(args: { limit?: number }, user: any) {
    try {
        if (!user) return { message: 'Bạn vui lòng đăng nhập để xem đơn hàng của mình nhé! 🔒' };
        
        const limit = Math.min(Number(args.limit) || 5, 10);
        const orders = await this.prisma.orders.findMany({
            where: { user_id: BigInt(user.id) },
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                order_code: true,
                grand_total: true,
                status: true,
                created_at: true,
                order_items: {
                    take: 3,
                    select: { name: true, qty: true }
                }
            }
        });

        if (orders.length === 0) return { message: 'Bạn chưa có đơn hàng nào tại ShopFeshen.' };

        return {
            count: orders.length,
            orders: orders.map(o => ({
                code: o.order_code,
                date: this.formatDate(o.created_at),
                total: this.formatCurrency(o.grand_total),
                status: o.status,
                items: o.order_items.map(i => `${i.qty}x ${i.name}`).join(', ') + (o.order_items.length > 3 ? '...' : '')
            }))
        };
    } catch (e: any) {
        return { error: 'Lỗi lấy danh sách đơn hàng', details: e.message };
    }
  }

  private static async getMyInfo(user: any) {
    try {
        if (!user) return { message: 'Bạn chưa đăng nhập. Hãy đăng nhập để mình hỗ trợ tốt hơn nhé! 👋' };

        const stats = await this.prisma.orders.aggregate({
            where: { 
                user_id: BigInt(user.id),
                status: { in: ['paid', 'completed'] }
            },
            _sum: { grand_total: true },
            _count: { id: true }
        });

        return {
            name: user.full_name || user.username,
            email: user.email,
            role: user.role,
            total_orders: stats._count.id || 0,
            total_spent: this.formatCurrency(stats._sum.grand_total || 0),
            member_since: 'Thành viên thân thiết' 
        };
    } catch (e: any) {
        return { error: 'Lỗi lấy thông tin', details: e.message };
    }
  }

  // Search products by price range
  private static async searchByPriceRange(args: { min_price?: number; max_price?: number; category?: string; limit?: number }) {
    try {
      const { min_price = 0, max_price = 999999999, category, limit = 10 } = args;
      
      const whereClause: any = {
        is_active: true,
        base_price: {
          gte: min_price,
          lte: max_price
        }
      };

      // Filter by category if provided
      if (category) {
        whereClause.category = {
          name: { contains: category }
        };
      }

      const products = await this.prisma.products.findMany({
        where: whereClause,
        take: Math.min(limit, 10),
        orderBy: { base_price: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          base_price: true,
          description: true,
          category: { select: { name: true } },
          product_images: {
            where: { is_primary: true },
            take: 1,
            select: { url: true }
          },
          product_variants: {
            take: 1,
            select: { price: true, stock_qty: true }
          }
        }
      });

      if (products.length === 0) {
        return { message: `Không tìm thấy sản phẩm nào trong khoảng giá ${this.formatCurrency(min_price)} - ${this.formatCurrency(max_price)}.` };
      }

      return {
        products: products.map(p => ({
          id: String(p.id),
          name: p.name,
          slug: p.slug,
          price: this.formatCurrency(p.product_variants[0]?.price || p.base_price),
          category: p.category?.name || 'Chưa phân loại',
          image: p.product_images[0]?.url || null,
          stock_qty: p.product_variants[0]?.stock_qty || 0
        })),
        total: products.length,
        price_range: `${this.formatCurrency(min_price)} - ${this.formatCurrency(max_price)}`
      };
    } catch (e: any) {
      return { error: 'Lỗi tìm kiếm sản phẩm', details: e.message };
    }
  }

  // Compare two products
  private static async compareProducts(args: { product1: string; product2: string }) {
    try {
      const { product1, product2 } = args;
      
      // Find product by name or ID
      const findProduct = async (query: string) => {
        const product = await this.prisma.products.findFirst({
          where: {
            OR: [
              { id: !isNaN(Number(query)) ? BigInt(query) : BigInt(-1) },
              { name: { contains: query } },
              { slug: { contains: query.toLowerCase() } }
            ]
          },
          select: {
            id: true,
            name: true,
            slug: true,
            base_price: true,
            description: true,
            category: { select: { name: true } },
            product_images: {
              where: { is_primary: true },
              take: 1,
              select: { url: true }
            },
            product_variants: {
              take: 5,
              select: { price: true, stock_qty: true }
            }
          }
        }) as any;
        return product;
      };

      const [p1, p2] = await Promise.all([
        findProduct(product1),
        findProduct(product2)
      ]);

      if (!p1 || !p2) {
        return { error: 'Không tìm thấy một hoặc cả hai sản phẩm. Vui lòng kiểm tra lại tên sản phẩm.' };
      }

      const getPrice = (p: any) => Number(p.product_variants[0]?.price || p.base_price);
      const getStock = (p: any) => p.product_variants.reduce((sum: number, v: any) => sum + (v.stock_qty || 0), 0);
      const getSizes = (p: any) => [...new Set(p.product_variants.map((v: any) => v.size).filter(Boolean))].join(', ') || 'Freesize';

      // Build comparison
      const comparison = {
        product1: {
          name: p1.name,
          price: this.formatCurrency(getPrice(p1)),
          category: p1.category?.name || 'N/A',
          description: p1.description?.substring(0, 100) + '...' || 'Không có mô tả',
          stock: getStock(p1) > 0 ? `Còn ${getStock(p1)} sản phẩm` : 'Hết hàng',
          image: p1.product_images[0]?.url || null,
          sizes: getSizes(p1)
        },
        product2: {
          name: p2.name,
          price: this.formatCurrency(getPrice(p2)),
          category: p2.category?.name || 'N/A',
          description: p2.description?.substring(0, 100) + '...' || 'Không có mô tả',
          stock: getStock(p2) > 0 ? `Còn ${getStock(p2)} sản phẩm` : 'Hết hàng',
          image: p2.product_images[0]?.url || null,
          sizes: getSizes(p2)
        },
        price_difference: this.formatCurrency(Math.abs(getPrice(p1) - getPrice(p2))),
        cheaper: getPrice(p1) < getPrice(p2) ? p1.name : getPrice(p1) > getPrice(p2) ? p2.name : 'Bằng giá'
      };

      return comparison;
    } catch (e: any) {
      return { error: 'Lỗi so sánh sản phẩm', details: e.message };
    }
  }

  // --- TOOL EXECUTOR ---
  private static async executeTool(toolName: string, args: any, user?: any) {
    this.logDebug(`Executing tool`, { toolName, args });
    try {
        switch (toolName) {
            case 'get_dashboard_stats': return await this.getDashboardStats();
            case 'get_recent_orders': return await this.getRecentOrders(args);
            case 'search_products': return await this.searchProducts(args);
            case 'get_low_stock_products': return await this.getLowStockProducts(args);
            case 'get_order_by_id': return await this.getOrderById(args);
            case 'get_customer_info': return await this.getCustomerInfo(args);
            case 'get_categories': return await this.getCategories();
            case 'get_revenue_by_period': return await this.getRevenueByPeriod(args);
            case 'get_top_products': return await this.getTopProducts(args);
            case 'update_order_status': return await this.updateOrderStatus(args, user);
            case 'update_product_price': return await this.updateProductPrice(args, user);
            case 'create_notification': return await this.createNotification(args, user);
            case 'get_my_orders': return await this.getMyOrders(args, user);
            case 'get_my_info': return await this.getMyInfo(user);
            case 'search_by_price_range': return await this.searchByPriceRange(args);
            case 'compare_products': return await this.compareProducts(args);
            default: return { error: `Công cụ '${toolName}' không tồn tại.` };
        }
    } catch (error: any) {
        return { error: error.message };
    }
  }

  // --- MAIN CHAT LOGIC ---
  static async generateChatResponse(messages: ChatMessage[], user?: any) {
      // Admin Logic (Keep as is, or similar structure)
      // 1. Prepare messages
      const requestMessages = [...messages];
      if (requestMessages.length === 0 || requestMessages[0].role !== 'system') {
        requestMessages.unshift({ role: 'system', content: this.getSystemPrompt() });
      } else {
        requestMessages[0].content = this.getSystemPrompt();
      }

      const result = await this.runLLMFlow(requestMessages, false);
      return result.message; // Admin controller might expect string only, need to check
  }

  // Customer Chat Logic
  static async generateCustomerResponse(history: ChatMessage[], userMessage: string, user?: any) {
      const messages: ChatMessage[] = [
          { role: 'system', content: this.getCustomerSystemPrompt() },
          ...history,
          { role: 'user', content: userMessage }
      ];

      return await this.runLLMFlow(messages, true, user);
  }

  // Shared Logic
  private static async runLLMFlow(messages: ChatMessage[], isCustomer: boolean = false, user?: any): Promise<{ message: string, products?: any[], orders?: any[] }> {
      let retries = 0;
      const MAX_RETRIES = 1;
      let relatedProducts: any[] = [];

      while (retries <= MAX_RETRIES) {
        try {
            this.logDebug(`Requesting AI (Attempt ${retries + 1})`);
            
            const response = await ollama.chat({
                model: this.MODEL,
                messages: messages,
                stream: false,
                options: { temperature: 0.3 }
            });

            const content = response.message.content.trim();
            this.logDebug('AI Response', content);

            const toolCall = this.extractJson(content);
            
            // Validate customer access to tools
            if (toolCall && isCustomer && !this.CUSTOMER_TOOLS.includes(toolCall.tool)) {
                 messages.push({ role: 'assistant', content });
                 messages.push({ role: 'user', content: "Xin lỗi, tôi không có quyền truy cập thông tin này." });
                 continue;
            }

            if (toolCall) {
                if (this.TOOLS.find(t => t.name === toolCall.tool)) {
                    this.logDebug('Valid Tool Call', toolCall);
                    const toolResult: any = await this.executeTool(toolCall.tool, toolCall.args || {}, user);
                    
                    if (toolResult.products && Array.isArray(toolResult.products)) {
                        relatedProducts = toolResult.products;
                    }

                    const resultStr = JSON.stringify(toolResult);
                    const truncatedResult = resultStr.length > 2000 ? resultStr.substring(0, 2000) + "..." : resultStr;

                    messages.push({ role: 'assistant', content: content });
                    messages.push({ 
                        role: 'user', 
                        content: `KẾT QUẢ TỪ HỆ THỐNG: ${truncatedResult}
                        
Hãy trả lời khách hàng dựa trên thông tin này. Nếu là danh sách sản phẩm, hãy tóm tắt ngắn gọn và mời khách xem chi tiết bên dưới.` 
                    });

                    const finalResponse = await ollama.chat({
                        model: this.MODEL,
                        messages: messages,
                        stream: false,
                    });
                    
                    return {
                        message: finalResponse.message.content,
                        products: relatedProducts
                    };

                } else {
                     messages.push({ role: 'assistant', content });
                     messages.push({ role: 'user', content: "Lỗi: Công cụ không hợp lệ." });
                     retries++;
                }
            } else {
                return {
                    message: content,
                    products: []
                };
            }

        } catch (e: any) {
            console.error('AI Error:', e);
            // Fallback for customer
            if (isCustomer) {
                 return { message: "Xin lỗi, hệ thống AI đang quá tải. Bạn hãy thử lại sau nhé! 🤖", products: [] };
            }
            return { message: "Lỗi kết nối AI Service.", products: [] };
        }
      }
      
      return { message: "Hệ thống đang bận.", products: [] };
  }
}