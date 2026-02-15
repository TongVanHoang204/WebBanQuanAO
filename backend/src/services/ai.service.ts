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
    },
    {
      name: 'get_review_summary',
      description: 'Lấy tóm tắt đánh giá sản phẩm: tổng số review, trung bình sao, phân bố 1-5 sao, review mới nhất. Có thể lọc theo product_id.',
      parameters: '{"product_id": string, "limit": number}'
    },
    {
      name: 'suggest_restock',
      description: 'Gợi ý nhập hàng: sản phẩm tồn kho thấp nhưng bán chạy (dựa trên tốc độ bán 30 ngày qua). Trả về danh sách cần nhập kèm số lượng gợi ý.',
      parameters: '{"limit": number}'
    },
    {
      name: 'get_abandoned_carts',
      description: 'Lấy danh sách giỏ hàng bị bỏ rơi (có sản phẩm nhưng chưa đặt đơn, cập nhật >24h trước). Trả về thống kê và chi tiết giỏ hàng.',
      parameters: '{"limit": number}'
    },
    {
      name: 'get_revenue_forecast',
      description: 'Dự báo doanh thu dựa trên dữ liệu 30 ngày gần nhất. Trả về xu hướng, doanh thu trung bình/ngày, dự báo 7 ngày tiếp, và phân tích tăng trưởng.',
      parameters: '{}'
    },
    {
      name: 'get_new_arrivals',
      description: 'Lấy sản phẩm mới nhất vừa ra mắt (7 ngày gần nhất). Dùng khi khách hỏi "hàng mới", "mới về", "new arrivals".',
      parameters: '{"limit": number, "category": string}'
    },
    {
      name: 'get_product_reviews',
      description: 'Lấy đánh giá của một sản phẩm cụ thể. Dùng khi khách muốn xem review trước khi mua.',
      parameters: '{"product_name": string, "limit": number}'
    },
    {
      name: 'get_active_coupons',
      description: 'Lấy danh sách mã giảm giá đang có hiệu lực. Dùng khi khách hỏi "có khuyến mãi gì", "mã giảm giá", "voucher".',
      parameters: '{}'
    },
    {
      name: 'get_outfit_suggestion',
      description: 'Gợi ý outfit hoàn chỉnh theo dịp/phong cách. Tìm sản phẩm phù hợp theo từ khóa dịp (tiệc, công sở, dạo phố, hẹn hò...) và trả về combo outfit.',
      parameters: '{"occasion": string, "budget": number, "gender": string}'
    },
    {
      name: 'track_order',
      description: 'Theo dõi trạng thái đơn hàng theo mã đơn. Trả về timeline chi tiết và trạng thái hiện tại.',
      parameters: '{"order_code": string}'
    },
    {
      name: 'get_wishlist_items',
      description: 'Lấy danh sách sản phẩm yêu thích (wishlist) của người đang chat.',
      parameters: '{"limit": number}'
    }
  ];

  private static readonly CUSTOMER_TOOLS = [
    'search_products', 'get_top_products', 'get_categories', 'get_low_stock_products',
    'get_order_by_id', 'get_my_orders', 'get_my_info', 'search_by_price_range',
    'compare_products', 'get_new_arrivals', 'get_product_reviews', 'get_active_coupons',
    'get_outfit_suggestion', 'track_order', 'get_wishlist_items'
  ];

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
- Khi khách hỏi theo ngân sách ("dưới 500k", "từ 200-300k") -> Dùng 'search_by_price_range' với min_price, max_price
- Khi khách muốn so sánh 2 sản phẩm -> Dùng 'compare_products' với tên 2 sản phẩm
- Khi khách hỏi "hàng mới", "mới về", "new" -> Dùng 'get_new_arrivals'
- Khi khách hỏi "review", "đánh giá", "ai dùng rồi" -> Dùng 'get_product_reviews' với product_name
- Khi khách hỏi "khuyến mãi", "giảm giá", "voucher", "mã" -> Dùng 'get_active_coupons'
- Khi khách hỏi "mặc gì", "outfit", "phối đồ đi..." -> Dùng 'get_outfit_suggestion' với occasion, budget, gender
- Khi khách hỏi "đơn hàng đến đâu", "tracking", "theo dõi đơn" -> Dùng 'track_order' với order_code
- Khi khách hỏi "wishlist", "yêu thích", "đã lưu" -> Dùng 'get_wishlist_items'

### QUY TẮC TRẢ LỜI:
1. Nếu câu hỏi liên quan đến kiến thức shop/thời trang (size, ship, đổi trả, phối đồ, outfit chung) -> Trả lời từ kiến thức trên, KHÔNG gọi tool.
2. Nếu cần tìm sản phẩm CỤ THỂ -> Gọi tool rồi tóm tắt kết quả thân thiện.
3. Nếu khách chào hỏi -> Chào lại vui vẻ và giới thiệu khả năng hỗ trợ.
4. Luôn kết thúc bằng câu hỏi mở để tiếp tục hỗ trợ (VD: "Bạn cần mình tìm thêm gì không?" 😊)
5. Khi tư vấn outfit/phối đồ CỤ THỂ, gọi 'get_outfit_suggestion' để đề xuất sản phẩm thật.
6. Khi có khuyến mãi, chủ động gợi ý mã giảm giá nếu liên quan.
7. **QUAN TRỌNG**: Khi trả lời có đề cập sản phẩm, hãy format tên SP bold và kèm giá.

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

  // =====================================================================
  // TOOL HANDLERS: get_review_summary, suggest_restock, get_abandoned_carts, get_revenue_forecast
  // =====================================================================

  private static letterToScore(letter: any): number {
    if (typeof letter === 'number') return letter;
    const map: Record<string, number> = { 'A+': 98, 'A': 90, 'B+': 82, 'B': 75, 'C+': 65, 'C': 55, 'D': 35, 'F': 15 };
    return map[String(letter).toUpperCase()] ?? 50;
  }

  private static async getReviewSummary(args: any): Promise<any> {
    try {
      const where: any = {};
      if (args.product_id) where.product_id = BigInt(args.product_id);

      const [total, reviews, distribution] = await Promise.all([
        this.prisma.product_reviews.count({ where }),
        this.prisma.product_reviews.findMany({
          where,
          take: args.limit || 5,
          orderBy: { created_at: 'desc' },
          select: {
            id: true, rating: true, title: true, content: true,
            author_name: true, status: true, created_at: true,
            product: { select: { name: true } }
          }
        }),
        this.prisma.product_reviews.groupBy({
          by: ['rating'],
          where,
          _count: { id: true }
        })
      ]);

      const ratingMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      distribution.forEach(d => { ratingMap[d.rating] = d._count.id; });
      const avgRating = total > 0
        ? Object.entries(ratingMap).reduce((sum, [star, count]) => sum + Number(star) * count, 0) / total
        : 0;

      return {
        total_reviews: total,
        average_rating: Math.round(avgRating * 10) / 10,
        distribution: ratingMap,
        status_breakdown: {
          approved: await this.prisma.product_reviews.count({ where: { ...where, status: 'approved' } }),
          pending: await this.prisma.product_reviews.count({ where: { ...where, status: 'pending' } }),
          rejected: await this.prisma.product_reviews.count({ where: { ...where, status: 'rejected' } })
        },
        recent_reviews: reviews.map(r => ({
          id: String(r.id),
          product: r.product?.name || 'N/A',
          rating: r.rating,
          title: r.title,
          content: r.content?.substring(0, 120) || '',
          author: r.author_name || 'Ẩn danh',
          status: r.status,
          date: r.created_at
        }))
      };
    } catch (e: any) {
      return { error: 'Lỗi lấy tóm tắt đánh giá', details: e.message };
    }
  }

  private static async suggestRestock(args: any): Promise<any> {
    try {
      const limit = args.limit || 10;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get variants with low stock that have been selling recently
      const restockData = await this.prisma.$queryRaw`
        SELECT 
          p.id as product_id, p.name as product_name,
          pv.id as variant_id, pv.variant_sku, pv.stock_qty as current_stock,
          COALESCE(sales.total_sold, 0) as sold_30d,
          COALESCE(sales.total_sold, 0) / 30.0 as daily_avg,
          CASE 
            WHEN COALESCE(sales.total_sold, 0) > 0 
            THEN ROUND(pv.stock_qty / (COALESCE(sales.total_sold, 0) / 30.0))
            ELSE 999
          END as days_until_stockout
        FROM product_variants pv
        JOIN products p ON p.id = pv.product_id
        LEFT JOIN (
          SELECT oi.variant_id, SUM(oi.qty) as total_sold
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE o.status IN ('paid', 'completed', 'shipped', 'processing')
            AND o.created_at >= ${thirtyDaysAgo}
          GROUP BY oi.variant_id
        ) sales ON sales.variant_id = pv.id
        WHERE pv.is_active = true AND pv.stock_qty < 20
        ORDER BY days_until_stockout ASC, sold_30d DESC
        LIMIT ${limit}
      ` as unknown as any[];

      return {
        message: `Gợi ý nhập hàng cho ${restockData.length} sản phẩm có tồn kho thấp và bán chạy`,
        products: restockData.map((r: any) => ({
          product_name: r.product_name,
          sku: r.variant_sku,
          current_stock: Number(r.current_stock),
          sold_last_30d: Number(r.sold_30d),
          daily_avg_sold: Math.round(Number(r.daily_avg) * 10) / 10,
          estimated_days_left: Number(r.days_until_stockout),
          suggested_restock_qty: Math.max(Math.ceil(Number(r.daily_avg) * 30) - Number(r.current_stock), 10),
          urgency: Number(r.days_until_stockout) <= 3 ? 'CỰC KỲ CẤP' :
                   Number(r.days_until_stockout) <= 7 ? 'CẤP' :
                   Number(r.days_until_stockout) <= 14 ? 'SỚM' : 'BÌNH THƯỜNG'
        }))
      };
    } catch (e: any) {
      return { error: 'Lỗi gợi ý nhập hàng', details: e.message };
    }
  }

  private static async getAbandonedCarts(args: any): Promise<any> {
    try {
      const limit = args.limit || 10;
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

      const abandonedCarts = await this.prisma.carts.findMany({
        where: {
          updated_at: { lt: cutoff },
          cart_items: { some: {} } // Has at least 1 item
        },
        take: limit,
        orderBy: { updated_at: 'desc' },
        include: {
          user: { select: { id: true, full_name: true, email: true, phone: true } },
          cart_items: {
            include: {
              variant: {
                select: {
                  variant_sku: true, price: true,
                  product: { select: { name: true } }
                }
              }
            }
          }
        }
      });

      const totalAbandoned = await this.prisma.carts.count({
        where: { updated_at: { lt: cutoff }, cart_items: { some: {} } }
      });

      let totalValue = 0;
      const cartSummaries = abandonedCarts.map(cart => {
        const cartTotal = cart.cart_items.reduce((sum, item) => {
          const val = Number(item.price_at_add) * item.qty;
          totalValue += val;
          return sum + val;
        }, 0);

        return {
          cart_id: String(cart.id),
          customer: cart.user?.full_name || cart.user?.email || 'Khách vãng lai',
          email: cart.user?.email || null,
          phone: cart.user?.phone || null,
          items_count: cart.cart_items.length,
          total_value: this.formatCurrency(cartTotal),
          last_active: cart.updated_at,
          items: cart.cart_items.map(ci => ({
            product: ci.variant?.product?.name || 'N/A',
            sku: ci.variant?.variant_sku,
            qty: ci.qty,
            price: this.formatCurrency(Number(ci.price_at_add))
          }))
        };
      });

      return {
        total_abandoned_carts: totalAbandoned,
        total_potential_revenue: this.formatCurrency(totalValue),
        showing: cartSummaries.length,
        carts: cartSummaries
      };
    } catch (e: any) {
      return { error: 'Lỗi lấy giỏ hàng bỏ rơi', details: e.message };
    }
  }

  private static async getRevenueForecast(): Promise<any> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get daily revenue for last 30 days
      const dailyRevenue = await this.prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(grand_total), 0) as revenue,
          COUNT(*) as order_count
        FROM orders
        WHERE status IN ('paid', 'completed', 'shipped')
          AND created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      ` as unknown as any[];

      if (dailyRevenue.length === 0) {
        return { message: 'Không có dữ liệu doanh thu trong 30 ngày qua để dự báo.' };
      }

      const revenues = dailyRevenue.map((d: any) => Number(d.revenue));
      const totalRevenue = revenues.reduce((a: number, b: number) => a + b, 0);
      const avgDaily = totalRevenue / dailyRevenue.length;

      // Simple trend: compare last 7 days vs previous 7 days
      const recentDays = revenues.slice(-7);
      const prevDays = revenues.slice(-14, -7);
      const recentAvg = recentDays.length > 0 ? recentDays.reduce((a: number, b: number) => a + b, 0) / recentDays.length : 0;
      const prevAvg = prevDays.length > 0 ? prevDays.reduce((a: number, b: number) => a + b, 0) / prevDays.length : 0;
      const growthRate = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg * 100) : 0;

      // Simple linear forecast for next 7 days
      const forecastDaily = recentAvg * (1 + growthRate / 100 * 0.3); // Dampened growth
      const forecast7d = Math.round(forecastDaily * 7);

      // Find best and worst days
      const bestDay = dailyRevenue.reduce((best: any, d: any) => Number(d.revenue) > Number(best.revenue) ? d : best, dailyRevenue[0]);
      const worstDay = dailyRevenue.reduce((worst: any, d: any) => Number(d.revenue) < Number(worst.revenue) ? d : worst, dailyRevenue[0]);

      return {
        period: '30 ngày gần nhất',
        total_revenue_30d: this.formatCurrency(totalRevenue),
        avg_daily_revenue: this.formatCurrency(Math.round(avgDaily)),
        total_orders_30d: dailyRevenue.reduce((sum: number, d: any) => sum + Number(d.order_count), 0),
        trend: {
          recent_7d_avg: this.formatCurrency(Math.round(recentAvg)),
          previous_7d_avg: this.formatCurrency(Math.round(prevAvg)),
          growth_rate: `${growthRate >= 0 ? '+' : ''}${Math.round(growthRate * 10) / 10}%`,
          direction: growthRate > 5 ? 'TĂNG MẠNH' : growthRate > 0 ? 'TĂNG NHẸ' : growthRate > -5 ? 'GIẢM NHẸ' : 'GIẢM MẠNH'
        },
        forecast: {
          next_7d_estimated: this.formatCurrency(forecast7d),
          daily_estimated: this.formatCurrency(Math.round(forecastDaily)),
          confidence: dailyRevenue.length >= 20 ? 'Trung bình (đủ dữ liệu)' : 'Thấp (ít dữ liệu)'
        },
        highlights: {
          best_day: { date: bestDay.date, revenue: this.formatCurrency(Number(bestDay.revenue)) },
          worst_day: { date: worstDay.date, revenue: this.formatCurrency(Number(worstDay.revenue)) }
        },
        daily_data: dailyRevenue.map((d: any) => ({
          date: d.date,
          revenue: this.formatCurrency(Number(d.revenue)),
          orders: Number(d.order_count)
        }))
      };
    } catch (e: any) {
      return { error: 'Lỗi dự báo doanh thu', details: e.message };
    }
  }

  // =====================================================================
  // NEW AI ANALYSIS METHODS
  // =====================================================================

  private static async callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await ollama.chat({
      model: this.MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: false,
      options: { temperature: 0.4 }
    });
    return response.message.content.trim();
  }

  // 1. Dashboard AI Insight
  public static async analyzeDashboard(): Promise<string> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [
        totalOrders, todayOrders, yesterdayOrders,
        totalRevenue, todayRevenue, yesterdayRevenue,
        weekRevenue, pendingOrders, lowStockCount,
        newCustomers, totalProducts
      ] = await Promise.all([
        this.prisma.orders.count({ where: { status: { in: ['paid', 'completed', 'pending', 'processing', 'shipped'] } } }),
        this.prisma.orders.count({ where: { created_at: { gte: today } } }),
        this.prisma.orders.count({ where: { created_at: { gte: yesterday, lt: today } } }),
        this.prisma.orders.aggregate({ where: { status: { in: ['paid', 'completed', 'pending', 'processing', 'shipped'] } }, _sum: { grand_total: true } }),
        this.prisma.orders.aggregate({ where: { created_at: { gte: today }, status: { in: ['paid', 'completed', 'pending', 'processing', 'shipped'] } }, _sum: { grand_total: true } }),
        this.prisma.orders.aggregate({ where: { created_at: { gte: yesterday, lt: today }, status: { in: ['paid', 'completed', 'pending', 'processing', 'shipped'] } }, _sum: { grand_total: true } }),
        this.prisma.orders.aggregate({ where: { created_at: { gte: weekAgo }, status: { in: ['paid', 'completed', 'pending', 'processing', 'shipped'] } }, _sum: { grand_total: true } }),
        this.prisma.orders.count({ where: { status: 'pending' } }),
        this.prisma.product_variants.count({ where: { stock_qty: { lt: 10 }, is_active: true } }),
        this.prisma.users.count({ where: { role: 'customer', created_at: { gte: weekAgo } } }),
        this.prisma.products.count({ where: { is_active: true } })
      ]);

      const data = {
        total_orders: totalOrders,
        today_orders: todayOrders,
        yesterday_orders: yesterdayOrders,
        total_revenue: Number(totalRevenue._sum?.grand_total || 0),
        today_revenue: Number(todayRevenue._sum?.grand_total || 0),
        yesterday_revenue: Number(yesterdayRevenue._sum?.grand_total || 0),
        week_revenue: Number(weekRevenue._sum?.grand_total || 0),
        pending_orders: pendingOrders,
        low_stock_products: lowStockCount,
        new_customers_this_week: newCustomers,
        total_products: totalProducts
      };

      return await this.callLLM(
        `Bạn là AI phân tích dữ liệu cho cửa hàng thời trang ShopFeshen. Hãy viết BẢN TÓM TẮT NGẮN GỌN (3-5 câu) về tình hình kinh doanh hôm nay dựa trên dữ liệu. Giọng văn chuyên nghiệp, có emoji nhẹ. So sánh với hôm qua nếu có. Nêu điểm nổi bật và cảnh báo nếu cần. Dùng tiếng Việt.`,
        `Dữ liệu Dashboard hôm nay (${new Date().toLocaleDateString('vi-VN')}):\n${JSON.stringify(data, null, 2)}`
      );
    } catch (e: any) {
      throw new Error(`Dashboard analysis failed: ${e.message}`);
    }
  }

  // 2. Review Analysis (Sentiment + Auto-mod)
  public static async analyzeReviews(reviewIds?: string[]): Promise<any> {
    try {
      const whereClause: any = reviewIds?.length ? { id: { in: reviewIds.map(id => BigInt(id)) } } : {};
      const reviews = await this.prisma.product_reviews.findMany({
        where: whereClause,
        take: 20,
        orderBy: { created_at: 'desc' },
        select: {
          id: true, rating: true, title: true, content: true,
          author_name: true, status: true, created_at: true,
          product: { select: { name: true } }
        }
      });

      if (reviews.length === 0) return { analysis: 'Không có đánh giá nào để phân tích.', reviews: [] };

      const reviewData = reviews.map((r: any) => ({
        id: String(r.id),
        rating: r.rating,
        title: r.title,
        content: r.content,
        author: r.author_name,
        product: r.product?.name,
        status: r.status
      }));

      const analysis = await this.callLLM(
        `Bạn là AI phân tích đánh giá sản phẩm. Hãy phân tích các review sau và trả về JSON (KHÔNG markdown, chỉ JSON thuần):
{
  "summary": "Tóm tắt chung 2-3 câu",
  "sentiment": { "positive": số, "neutral": số, "negative": số },
  "themes": ["chủ đề 1", "chủ đề 2"],
  "alerts": ["cảnh báo nếu có review cần chú ý"],
  "auto_actions": [
    { "review_id": "id", "suggested_action": "approve|reject|flag", "reason": "lý do ngắn" }
  ]
}`,
        JSON.stringify(reviewData)
      );

      try {
        const parsed = JSON.parse(analysis.replace(/```json\s*/g, '').replace(/```/g, '').trim());
        return parsed;
      } catch {
        return { analysis, reviews: reviewData };
      }
    } catch (e: any) {
      throw new Error(`Review analysis failed: ${e.message}`);
    }
  }

  // 3. Analytics Narrative
  public static async analyzeAnalytics(startDate?: string, endDate?: string): Promise<string> {
    try {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      const [revenue, orderCount, topProducts, categoryRevenue, newCustomers] = await Promise.all([
        this.prisma.orders.aggregate({
          where: { created_at: { gte: start, lte: end }, status: { in: ['paid', 'completed', 'pending', 'processing', 'shipped'] } },
          _sum: { grand_total: true }, _avg: { grand_total: true }, _count: { id: true }
        }),
        this.prisma.orders.groupBy({
          by: ['status'],
          where: { created_at: { gte: start, lte: end } },
          _count: { id: true }
        }),
        this.prisma.order_items.groupBy({
          by: ['product_id'],
          where: { order: { created_at: { gte: start, lte: end }, status: { in: ['paid', 'completed'] } } },
          _sum: { qty: true, line_total: true },
          orderBy: { _sum: { qty: 'desc' } },
          take: 5
        }),
        this.prisma.$queryRaw`
          SELECT c.name, COALESCE(SUM(oi.line_total), 0) as revenue
          FROM categories c 
          LEFT JOIN products p ON p.category_id = c.id
          LEFT JOIN order_items oi ON oi.product_id = p.id
          LEFT JOIN orders o ON o.id = oi.order_id AND o.created_at >= ${start} AND o.created_at <= ${end}
          WHERE c.is_active = true
          GROUP BY c.id, c.name
          ORDER BY revenue DESC LIMIT 5
        ` as unknown as any[],
        this.prisma.users.count({ where: { role: 'customer', created_at: { gte: start, lte: end } } })
      ]);

      const productIds = topProducts.map(p => p.product_id).filter(Boolean) as bigint[];
      const products = productIds.length > 0 ? await this.prisma.products.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      }) : [];

      const data = {
        period: `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`,
        total_revenue: Number(revenue._sum?.grand_total || 0),
        avg_order_value: Number(revenue._avg?.grand_total || 0),
        total_orders: revenue._count?.id || 0,
        order_by_status: orderCount.map(o => ({ status: o.status, count: o._count.id })),
        top_products: topProducts.map(tp => {
          const p = products.find(pr => pr.id === tp.product_id);
          return { name: p?.name || 'N/A', sold: Number(tp._sum.qty || 0), revenue: Number(tp._sum.line_total || 0) };
        }),
        category_revenue: categoryRevenue.map((c: any) => ({ name: c.name, revenue: Number(c.revenue) })),
        new_customers: newCustomers
      };

      return await this.callLLM(
        `Bạn là AI phân tích kinh doanh cho ShopFeshen. Viết BÁO CÁO NARRATIVE ngắn gọn (4-6 câu) bằng tiếng Việt. Nêu bật xu hướng, điểm mạnh, và gợi ý hành động. Dùng format markdown nhẹ (bold tên số liệu). Dùng emoji nhẹ.`,
        `Dữ liệu Analytics:\n${JSON.stringify(data, null, 2)}`
      );
    } catch (e: any) {
      throw new Error(`Analytics narrative failed: ${e.message}`);
    }
  }

  // 4. Coupon AI Strategy
  public static async suggestCouponStrategy(): Promise<any> {
    try {
      const [aov, totalCustomers, recentCoupons, topCategories] = await Promise.all([
        this.prisma.orders.aggregate({
          where: { status: { in: ['paid', 'completed'] } },
          _avg: { grand_total: true }
        }),
        this.prisma.users.count({ where: { role: 'customer' } }),
        this.prisma.coupons.findMany({ take: 5, orderBy: { created_at: 'desc' }, select: { code: true, type: true, value: true, usage_limit: true, is_active: true } }),
        this.prisma.$queryRaw`
          SELECT c.name, COUNT(oi.id) as total_sold
          FROM categories c JOIN products p ON p.category_id = c.id
          JOIN order_items oi ON oi.product_id = p.id
          GROUP BY c.id, c.name ORDER BY total_sold DESC LIMIT 3
        ` as unknown as any[]
      ]);

      const data = {
        avg_order_value: Number(aov._avg?.grand_total || 0),
        total_customers: totalCustomers,
        recent_coupons: recentCoupons,
        top_categories: topCategories?.map((c: any) => ({ name: c.name, sold: Number(c.total_sold) })) || []
      };

      const suggestion = await this.callLLM(
        `Bạn là chuyên gia marketing cho ShopFeshen. Hãy trả về JSON (KHÔNG markdown, chỉ JSON thuần):
{
  "strategy": "Mô tả chiến lược coupon ngắn gọn 2-3 câu",
  "suggestions": [
    {
      "code": "MÃ_GỢI_Ý",
      "type": "percent hoặc fixed",
      "value": số,
      "min_subtotal": số hoặc null,
      "reason": "Lý do tạo mã này"
    }
  ],
  "tips": ["Mẹo 1", "Mẹo 2"]
}`,
        JSON.stringify(data)
      );

      try {
        return JSON.parse(suggestion.replace(/```json\s*/g, '').replace(/```/g, '').trim());
      } catch {
        return { strategy: suggestion, suggestions: [], tips: [] };
      }
    } catch (e: any) {
      throw new Error(`Coupon strategy failed: ${e.message}`);
    }
  }

  // 5. Customer Segmentation
  public static async analyzeCustomers(): Promise<any> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const [totalCustomers, newCustomers, highValueCustomers, atRiskCustomers, customerSpendData] = await Promise.all([
        this.prisma.users.count({ where: { role: 'customer' } }),
        this.prisma.users.count({ where: { role: 'customer', created_at: { gte: thirtyDaysAgo } } }),
        this.prisma.$queryRaw`
          SELECT COUNT(DISTINCT u.id) as count FROM users u
          JOIN orders o ON o.user_id = u.id
          WHERE u.role = 'customer' AND o.status IN ('paid', 'completed')
          GROUP BY u.id HAVING SUM(o.grand_total) > 2000000
        ` as unknown as any[],
        this.prisma.$queryRaw`
          SELECT COUNT(*) as count FROM users u
          WHERE u.role = 'customer' AND u.status = 'active'
          AND u.id NOT IN (
            SELECT DISTINCT user_id FROM orders WHERE created_at >= ${ninetyDaysAgo} AND user_id IS NOT NULL
          )
        ` as unknown as any[],
        this.prisma.$queryRaw`
          SELECT 
            CASE 
              WHEN COALESCE(total, 0) = 0 THEN 'no_purchase'
              WHEN COALESCE(total, 0) < 500000 THEN 'low_value'
              WHEN COALESCE(total, 0) < 2000000 THEN 'mid_value'
              ELSE 'high_value'
            END as segment,
            COUNT(*) as count
          FROM (
            SELECT u.id, COALESCE(SUM(o.grand_total), 0) as total
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id AND o.status IN ('paid', 'completed')
            WHERE u.role = 'customer'
            GROUP BY u.id
          ) sub
          GROUP BY segment
        ` as unknown as any[]
      ]);

      const data = {
        total_customers: totalCustomers,
        new_customers_30d: newCustomers,
        high_value_count: highValueCustomers?.length || 0,
        at_risk_count: Number(atRiskCustomers?.[0]?.count || 0),
        segments: customerSpendData?.map((s: any) => ({ segment: s.segment, count: Number(s.count) })) || []
      };

      const analysis = await this.callLLM(
        `Bạn là AI phân tích khách hàng cho ShopFeshen. Trả về JSON (KHÔNG markdown, chỉ JSON thuần):
{
  "summary": "Tóm tắt 2-3 câu",
  "segments": [
    { "name": "VIP", "count": số, "description": "Mô tả ngắn", "action": "Hành động gợi ý" }
  ],
  "insights": ["Insight 1", "Insight 2"],
  "recommendations": ["Hành động 1", "Hành động 2"]
}`,
        JSON.stringify(data)
      );

      try {
        return JSON.parse(analysis.replace(/```json\s*/g, '').replace(/```/g, '').trim());
      } catch {
        return { summary: analysis, segments: [], insights: [], recommendations: [] };
      }
    } catch (e: any) {
      throw new Error(`Customer analysis failed: ${e.message}`);
    }
  }

  // 6. Order Fraud Detection + Smart Status
  public static async analyzeOrder(orderId: string): Promise<any> {
    try {
      const id = BigInt(orderId);
      const order = await this.prisma.orders.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, full_name: true, email: true, created_at: true, status: true } },
          order_items: { select: { name: true, qty: true, unit_price: true, line_total: true } }
        }
      });

      if (!order) throw new Error('Không tìm thấy đơn hàng');

      // Get user order history
      let userHistory = null;
      if (order.user_id) {
        const history = await this.prisma.orders.aggregate({
          where: { user_id: order.user_id, status: { in: ['paid', 'completed'] } },
          _count: { id: true },
          _sum: { grand_total: true },
          _avg: { grand_total: true }
        });
        userHistory = {
          total_orders: history._count.id,
          total_spent: Number(history._sum?.grand_total || 0),
          avg_order: Number(history._avg?.grand_total || 0)
        };
      }

      const daysSinceCreated = order.user?.created_at
        ? Math.floor((Date.now() - new Date(order.user.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const data = {
        order_id: String(order.id),
        order_code: order.order_code,
        total: Number(order.grand_total),
        status: order.status,
        payment_method: (order as any).payment_method || 'N/A',
        items_count: order.order_items.length,
        items: order.order_items.map(i => ({ name: i.name, qty: i.qty, price: Number(i.unit_price) })),
        customer: order.customer_name,
        is_registered: !!order.user_id,
        account_age_days: daysSinceCreated,
        user_history: userHistory,
        shipping: { address: order.ship_address_line1, city: order.ship_city, province: order.ship_province },
        created_at: order.created_at
      };

      const analysis = await this.callLLM(
        `Bạn là AI phát hiện gian lận và tư vấn đơn hàng cho ShopFeshen. Trả về JSON (KHÔNG markdown, chỉ JSON thuần):
{
  "risk_level": "low|medium|high",
  "risk_score": 0-100,
  "flags": ["Cờ cảnh báo nếu có"],
  "customer_profile": "Mô tả ngắn về khách hàng",
  "status_suggestion": "Gợi ý trạng thái tiếp theo",
  "status_reason": "Lý do",
  "summary": "Tóm tắt 1-2 câu về đơn hàng"
}`,
        JSON.stringify(data)
      );

      try {
        return JSON.parse(analysis.replace(/```json\s*/g, '').replace(/```/g, '').trim());
      } catch {
        return { summary: analysis, risk_level: 'unknown', flags: [] };
      }
    } catch (e: any) {
      throw new Error(`Order analysis failed: ${e.message}`);
    }
  }

  // 7. Log Anomaly Detection
  public static async analyzeLogs(query?: string): Promise<any> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const logs = await this.prisma.activity_logs.findMany({
        where: { created_at: { gte: oneDayAgo } },
        take: 100,
        orderBy: { created_at: 'desc' },
        select: {
          action: true, entity_type: true, entity_id: true,
          ip_address: true, created_at: true,
          user: { select: { username: true, role: true } }
        }
      });

      const logSummary = {
        total_logs_24h: logs.length,
        actions: {} as Record<string, number>,
        users: {} as Record<string, number>,
        ips: {} as Record<string, number>
      };

      logs.forEach(l => {
        logSummary.actions[l.action] = (logSummary.actions[l.action] || 0) + 1;
        const user = l.user?.username || 'unknown';
        logSummary.users[user] = (logSummary.users[user] || 0) + 1;
        if (l.ip_address) logSummary.ips[l.ip_address] = (logSummary.ips[l.ip_address] || 0) + 1;
      });

      const prompt = query
        ? `Câu hỏi của admin: "${query}"\n\nDữ liệu log 24h:\n${JSON.stringify(logSummary, null, 2)}`
        : `Dữ liệu log 24h:\n${JSON.stringify(logSummary, null, 2)}`;

      const analysis = await this.callLLM(
        `Bạn là AI an ninh cho ShopFeshen. ${query ? 'Trả lời câu hỏi admin dựa trên dữ liệu log.' : 'Phát hiện bất thường trong log.'} Trả về JSON (KHÔNG markdown, chỉ JSON thuần):
{
  "summary": "Tóm tắt 2-3 câu",
  "anomalies": [{ "type": "loại", "description": "mô tả", "severity": "low|medium|high" }],
  "recommendations": ["Hành động 1"],
  "answer": "Trả lời nếu có câu hỏi, null nếu không"
}`,
        prompt
      );

      try {
        return JSON.parse(analysis.replace(/```json\s*/g, '').replace(/```/g, '').trim());
      } catch {
        return { summary: analysis, anomalies: [], recommendations: [] };
      }
    } catch (e: any) {
      throw new Error(`Log analysis failed: ${e.message}`);
    }
  }

  // 8. Banner Copy Generator
  public static async generateBannerCopy(context?: string): Promise<any> {
    try {
      const [topProducts, activeCoupons] = await Promise.all([
        this.prisma.products.findMany({
          where: { is_active: true },
          take: 3,
          orderBy: { created_at: 'desc' },
          select: { name: true, base_price: true, category: { select: { name: true } } }
        }),
        this.prisma.coupons.findMany({
          where: { is_active: true },
          take: 2,
          select: { code: true, type: true, value: true }
        })
      ]);

      const data = {
        context: context || 'Banner quảng cáo chung',
        new_products: topProducts.map(p => ({ name: p.name, price: Number(p.base_price), category: p.category?.name })),
        active_coupons: activeCoupons
      };

      const result = await this.callLLM(
        `Bạn là copywriter cho ShopFeshen. Tạo 3 phiên bản nội dung banner. Trả về JSON (KHÔNG markdown, chỉ JSON thuần):
{
  "banners": [
    { "headline": "Tiêu đề ngắn (<60 ký tự)", "subtext": "Mô tả phụ (<100 ký tự)", "cta": "Nút CTA (<20 ký tự)" }
  ]
}`,
        JSON.stringify(data)
      );

      try {
        return JSON.parse(result.replace(/```json\s*/g, '').replace(/```/g, '').trim());
      } catch {
        return { banners: [{ headline: result, subtext: '', cta: 'Xem ngay' }] };
      }
    } catch (e: any) {
      throw new Error(`Banner copy failed: ${e.message}`);
    }
  }

  // 9. Staff Performance Analysis
  public static async analyzeStaffPerformance(): Promise<any> {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const staffMembers = await this.prisma.users.findMany({
        where: { role: { in: ['admin', 'manager', 'staff'] } },
        select: { id: true, username: true, full_name: true, role: true }
      });

      const staffActivities = await Promise.all(
        staffMembers.map(async (staff) => {
          const activityCount = await this.prisma.activity_logs.count({
            where: { user_id: staff.id, created_at: { gte: weekAgo } }
          });
          const activities = await this.prisma.activity_logs.groupBy({
            by: ['action'],
            where: { user_id: staff.id, created_at: { gte: weekAgo } },
            _count: { id: true }
          });
          return {
            name: staff.full_name || staff.username,
            role: staff.role,
            total_actions: activityCount,
            breakdown: activities.map(a => ({ action: a.action, count: a._count.id }))
          };
        })
      );

      const analysis = await this.callLLM(
        `Bạn là AI quản lý nhân sự cho ShopFeshen. Phân tích hiệu suất nhân viên tuần qua dựa trên số thao tác. Trả về JSON (KHÔNG markdown, chỉ JSON thuần):
{
  "summary": "Tóm tắt 2-3 câu về hiệu suất chung",
  "staff_scores": [
    { "name": "tên", "score": 85, "action_count": 12, "role": "admin", "highlights": "điểm nổi bật", "suggestion": "gợi ý" }
  ],
  "highlights": ["Insight 1"],
  "suggestions": ["Hành động 1"]
}
Quan trọng: "score" PHẢI là số nguyên từ 0-100 (không phải chữ). Nếu nhân viên có 0 thao tác thì score thấp (0-20). Số thao tác càng nhiều, đa dạng càng cao điểm.`,
        JSON.stringify(staffActivities)
      );

      try {
        const parsed = JSON.parse(analysis.replace(/```json\s*/g, '').replace(/```/g, '').trim());
        // Merge actual action counts from DB into the AI response
        if (parsed.staff_scores && Array.isArray(parsed.staff_scores)) {
          parsed.staff_scores = parsed.staff_scores.map((s: any) => {
            const real = staffActivities.find(sa => sa.name === s.name);
            return {
              ...s,
              action_count: real?.total_actions ?? s.action_count ?? 0,
              role: real?.role ?? s.role ?? '',
              score: typeof s.score === 'number' ? s.score : this.letterToScore(s.score)
            };
          });
        }
        return parsed;
      } catch {
        return { summary: analysis, staff_scores: [], recommendations: [] };
      }
    } catch (e: any) {
      throw new Error(`Staff analysis failed: ${e.message}`);
    }
  }

  // 10. Product Content Generator (for Add/Edit form)
  public static async generateProductContent(name: string, category?: string, brand?: string, price?: number): Promise<any> {
    try {
      const prompt = `Sản phẩm: "${name}"${category ? `, Danh mục: ${category}` : ''}${brand ? `, Thương hiệu: ${brand}` : ''}${price ? `, Giá: ${price} VNĐ` : ''}`;

      const result = await this.callLLM(
        `Bạn là copywriter chuyên nghiệp cho cửa hàng thời trang ShopFeshen. Tạo nội dung cho sản phẩm. Trả về JSON (KHÔNG markdown, chỉ JSON thuần):
{
  "description": "Mô tả HTML hấp dẫn (150-200 từ, dùng <p>, <ul>, <li>, <strong>)",
  "meta_title": "Meta Title chuẩn SEO (<70 ký tự)",
  "meta_description": "Meta Description (<160 ký tự)",
  "meta_keywords": "keyword1, keyword2, keyword3",
  "tags": "tag1, tag2, tag3"
}`,
        prompt
      );

      try {
        return JSON.parse(result.replace(/```json\s*/g, '').replace(/```/g, '').trim());
      } catch {
        return { description: result, meta_title: name, meta_description: '', meta_keywords: '', tags: '' };
      }
    } catch (e: any) {
      throw new Error(`Product content generation failed: ${e.message}`);
    }
  }

  // =====================================================================
  // END NEW AI ANALYSIS METHODS
  // =====================================================================

  // =====================================================================
  // CUSTOMER-FACING TOOLS
  // =====================================================================

  // Get new arrivals (products added in last 7 days)
  private static async getNewArrivals(args: { limit?: number; category?: string }) {
    try {
      const limit = Math.min(Number(args.limit) || 8, 15);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const where: any = {
        is_active: true,
        created_at: { gte: sevenDaysAgo }
      };
      if (args.category) {
        where.category = { name: { contains: args.category } };
      }

      const products = await this.prisma.products.findMany({
        where,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true, name: true, slug: true, base_price: true, created_at: true,
          category: { select: { name: true } },
          product_images: { where: { is_primary: true }, take: 1, select: { url: true } },
          product_variants: { take: 1, select: { price: true, stock_qty: true } }
        }
      });

      if (products.length === 0) {
        // Fallback: get latest products overall
        const fallback = await this.prisma.products.findMany({
          where: { is_active: true },
          take: limit,
          orderBy: { created_at: 'desc' },
          select: {
            id: true, name: true, slug: true, base_price: true, created_at: true,
            category: { select: { name: true } },
            product_images: { where: { is_primary: true }, take: 1, select: { url: true } },
            product_variants: { take: 1, select: { price: true, stock_qty: true } }
          }
        });
        return {
          message: 'Không có hàng mới trong 7 ngày qua, đây là sản phẩm mới nhất:',
          count: fallback.length,
          products: fallback.map(p => ({
            id: String(p.id), name: p.name, slug: p.slug,
            price: this.formatCurrency(p.product_variants[0]?.price || p.base_price),
            raw_price: Number(p.product_variants[0]?.price || p.base_price),
            image: p.product_images[0]?.url || null,
            category: p.category?.name || 'Chưa phân loại',
            stock_qty: p.product_variants[0]?.stock_qty || 0,
            is_new: false
          }))
        };
      }

      return {
        count: products.length,
        products: products.map(p => ({
          id: String(p.id), name: p.name, slug: p.slug,
          price: this.formatCurrency(p.product_variants[0]?.price || p.base_price),
          raw_price: Number(p.product_variants[0]?.price || p.base_price),
          image: p.product_images[0]?.url || null,
          category: p.category?.name || 'Chưa phân loại',
          stock_qty: p.product_variants[0]?.stock_qty || 0,
          is_new: true
        }))
      };
    } catch (e: any) {
      return { error: 'Lỗi lấy sản phẩm mới', details: e.message };
    }
  }

  // Get product reviews (customer can check reviews before buying)
  private static async getProductReviews(args: { product_name?: string; limit?: number }) {
    try {
      if (!args.product_name) return { error: 'Vui lòng cung cấp tên sản phẩm.' };

      const product = await this.prisma.products.findFirst({
        where: {
          is_active: true,
          OR: [
            { name: { contains: args.product_name } },
            { slug: { contains: args.product_name.toLowerCase().replace(/\s+/g, '-') } }
          ]
        },
        select: { id: true, name: true, slug: true }
      });

      if (!product) return { error: `Không tìm thấy sản phẩm "${args.product_name}".` };

      const limit = Math.min(Number(args.limit) || 5, 10);

      const [reviews, stats] = await Promise.all([
        this.prisma.product_reviews.findMany({
          where: { product_id: product.id, status: 'approved' },
          take: limit,
          orderBy: { created_at: 'desc' },
          select: {
            rating: true, title: true, content: true,
            author_name: true, is_verified: true, created_at: true
          }
        }),
        this.prisma.product_reviews.aggregate({
          where: { product_id: product.id, status: 'approved' },
          _avg: { rating: true },
          _count: { id: true }
        })
      ]);

      return {
        product_name: product.name,
        total_reviews: stats._count.id,
        average_rating: Math.round((stats._avg.rating || 0) * 10) / 10,
        reviews: reviews.map(r => ({
          rating: r.rating,
          title: r.title || '',
          content: r.content?.substring(0, 200) || '',
          author: r.author_name || 'Khách hàng',
          verified: r.is_verified,
          date: r.created_at.toLocaleDateString('vi-VN')
        }))
      };
    } catch (e: any) {
      return { error: 'Lỗi lấy đánh giá', details: e.message };
    }
  }

  // Get active coupons for customers
  private static async getActiveCoupons() {
    try {
      const now = new Date();
      const coupons = await this.prisma.coupons.findMany({
        where: {
          is_active: true,
          OR: [
            { end_at: null },
            { end_at: { gte: now } }
          ],
          AND: [
            { OR: [{ start_at: null }, { start_at: { lte: now } }] }
          ]
        },
        select: {
          code: true, type: true, value: true,
          min_subtotal: true, max_discount: true,
          end_at: true, usage_limit: true,
          _count: { select: { coupon_redemptions: true } }
        },
        orderBy: { value: 'desc' },
        take: 10
      });

      if (coupons.length === 0) {
        return { message: 'Hiện tại không có mã giảm giá nào đang hoạt động.' };
      }

      return {
        count: coupons.length,
        coupons: coupons.map(c => ({
          code: c.code,
          type: c.type === 'percent' ? 'Giảm %' : 'Giảm tiền',
          value: c.type === 'percent' ? `${c.value}%` : this.formatCurrency(Number(c.value)),
          min_order: Number(c.min_subtotal) > 0 ? this.formatCurrency(Number(c.min_subtotal)) : 'Không yêu cầu',
          max_discount: c.max_discount ? this.formatCurrency(Number(c.max_discount)) : 'Không giới hạn',
          expires: c.end_at ? c.end_at.toLocaleDateString('vi-VN') : 'Không hết hạn',
          remaining: c.usage_limit ? Math.max(0, c.usage_limit - c._count.coupon_redemptions) : 'Không giới hạn'
        }))
      };
    } catch (e: any) {
      return { error: 'Lỗi lấy mã giảm giá', details: e.message };
    }
  }

  // Get outfit suggestion by occasion
  private static async getOutfitSuggestion(args: { occasion?: string; budget?: number; gender?: string }) {
    try {
      const occasion = args.occasion || 'dạo phố';
      const budget = args.budget || 2000000;
      const gender = args.gender || 'nữ';

      // Map occasion to keywords for product search
      const occasionKeywords: Record<string, string[]> = {
        'tiệc': ['đầm', 'váy dạ hội', 'vest', 'sơ mi'],
        'tiệc cưới': ['đầm dạ hội', 'vest', 'áo dài', 'váy'],
        'đám cưới': ['đầm dạ hội', 'vest', 'áo dài'],
        'công sở': ['sơ mi', 'quần âu', 'chân váy', 'blazer'],
        'dạo phố': ['áo thun', 'jeans', 'váy midi', 'sneaker'],
        'hẹn hò': ['đầm', 'váy', 'áo kiểu', 'sơ mi'],
        'party': ['váy sequin', 'crop top', 'áo bóng', 'đầm ngắn'],
        'thể thao': ['áo thun', 'quần jogger', 'giày thể thao'],
        'du lịch': ['áo thun', 'shorts', 'váy maxi', 'sandal'],
      };

      // Find best matching keywords
      let keywords = occasionKeywords['dạo phố'];
      for (const [key, kws] of Object.entries(occasionKeywords)) {
        if (occasion.toLowerCase().includes(key)) {
          keywords = kws;
          break;
        }
      }

      // Search products for each keyword
      const outfitItems: any[] = [];
      let totalBudget = 0;
      const perItemBudget = budget / keywords.length;

      for (const keyword of keywords) {
        const products = await this.prisma.products.findMany({
          where: {
            is_active: true,
            OR: [
              { name: { contains: keyword } },
              { description: { contains: keyword } },
              { category: { name: { contains: keyword } } }
            ]
          },
          take: 3,
          orderBy: { created_at: 'desc' },
          select: {
            id: true, name: true, slug: true, base_price: true,
            category: { select: { name: true } },
            product_images: { where: { is_primary: true }, take: 1, select: { url: true } },
            product_variants: { take: 1, select: { price: true, stock_qty: true } }
          }
        });

        if (products.length > 0) {
          // Pick the best-fit product within budget
          const best = products.find(p => {
            const price = Number(p.product_variants[0]?.price || p.base_price);
            return price <= perItemBudget && (p.product_variants[0]?.stock_qty || 0) > 0;
          }) || products[0];

          const price = Number(best.product_variants[0]?.price || best.base_price);
          totalBudget += price;
          outfitItems.push({
            id: String(best.id), name: best.name, slug: best.slug,
            price: this.formatCurrency(price),
            raw_price: price,
            image: best.product_images[0]?.url || null,
            category: best.category?.name || keyword,
            stock_qty: best.product_variants[0]?.stock_qty || 0,
            type: keyword
          });
        }
      }

      return {
        occasion,
        gender,
        total_price: this.formatCurrency(totalBudget),
        budget: this.formatCurrency(budget),
        within_budget: totalBudget <= budget,
        outfit_items: outfitItems,
        products: outfitItems // Also expose as products for card rendering
      };
    } catch (e: any) {
      return { error: 'Lỗi gợi ý outfit', details: e.message };
    }
  }

  // Track order by order code
  private static async trackOrder(args: { order_code?: string }, user?: any) {
    try {
      if (!args.order_code) return { error: 'Vui lòng cung cấp mã đơn hàng.' };

      const code = args.order_code.replace('#', '').trim();

      const order = await this.prisma.orders.findFirst({
        where: {
          order_code: { contains: code },
          ...(user?.id ? { user_id: BigInt(user.id) } : {})
        },
        select: {
          id: true, order_code: true, status: true,
          grand_total: true, shipping_fee: true,
          created_at: true, updated_at: true,
          ship_address_line1: true, ship_city: true, ship_province: true,
          user: { select: { full_name: true, email: true } },
          order_items: {
            select: {
              qty: true, unit_price: true, name: true,
              variant: { select: { variant_sku: true } }
            }
          }
        }
      }) as any;

      if (!order) return { error: `Không tìm thấy đơn hàng "${args.order_code}". Vui lòng kiểm tra lại mã.` };

      const statusLabels: Record<string, string> = {
        'pending': '⏳ Chờ xử lý',
        'confirmed': '✔️ Đã xác nhận',
        'paid': '💰 Đã thanh toán',
        'processing': '🔄 Đang xử lý',
        'shipped': '🚚 Đang giao hàng',
        'completed': '✅ Đã giao thành công',
        'cancelled': '❌ Đã hủy',
        'refunded': '↩️ Đã hoàn tiền'
      };

      const statusOrder = ['pending', 'confirmed', 'paid', 'processing', 'shipped', 'completed'];
      const currentIndex = statusOrder.indexOf(order.status);

      const timeline = statusOrder.map((s: string, i: number) => ({
        step: statusLabels[s] || s,
        completed: i <= currentIndex && order.status !== 'cancelled',
        current: i === currentIndex
      }));

      return {
        order_code: order.order_code,
        status: statusLabels[order.status] || order.status,
        raw_status: order.status,
        total: this.formatCurrency(Number(order.grand_total)),
        shipping_fee: this.formatCurrency(Number(order.shipping_fee || 0)),
        created_at: order.created_at.toLocaleDateString('vi-VN'),
        timeline,
        items: order.order_items.map((i: any) => ({
          name: i.name || 'Sản phẩm',
          sku: i.variant?.variant_sku || '',
          qty: i.qty,
          price: this.formatCurrency(Number(i.unit_price))
        })),
        items_count: order.order_items.length,
        shipping_address: [order.ship_address_line1, order.ship_city, order.ship_province].filter(Boolean).join(', ')
      };
    } catch (e: any) {
      return { error: 'Lỗi theo dõi đơn hàng', details: e.message };
    }
  }

  // Get user's wishlist items
  private static async getWishlistItems(user?: any) {
    try {
      if (!user?.id) return { error: 'Bạn cần đăng nhập để xem danh sách yêu thích.' };

      const wishlist = await this.prisma.wishlists.findUnique({
        where: { user_id: BigInt(user.id) },
        select: {
          wishlist_items: {
            take: 10,
            orderBy: { created_at: 'desc' },
            select: {
              product: {
                select: {
                  id: true, name: true, slug: true, base_price: true,
                  product_images: { where: { is_primary: true }, take: 1, select: { url: true } },
                  product_variants: { take: 1, select: { price: true, stock_qty: true } }
                }
              }
            }
          }
        }
      });

      if (!wishlist || wishlist.wishlist_items.length === 0) {
        return { message: 'Danh sách yêu thích của bạn đang trống. Hãy thêm sản phẩm yêu thích nhé! ❤️' };
      }

      const products = wishlist.wishlist_items.map((item: any) => {
        const p = item.product;
        return {
          id: String(p.id), name: p.name, slug: p.slug,
          price: this.formatCurrency(p.product_variants[0]?.price || p.base_price),
          raw_price: Number(p.product_variants[0]?.price || p.base_price),
          image: p.product_images[0]?.url || null,
          stock_qty: p.product_variants[0]?.stock_qty || 0
        };
      });

      return {
        count: products.length,
        products
      };
    } catch (e: any) {
      return { error: 'Lỗi lấy danh sách yêu thích', details: e.message };
    }
  }

  // --- TOOL EXECUTOR --- (existing)
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
            case 'get_review_summary': return await this.getReviewSummary(args);
            case 'suggest_restock': return await this.suggestRestock(args);
            case 'get_abandoned_carts': return await this.getAbandonedCarts(args);
            case 'get_revenue_forecast': return await this.getRevenueForecast();
            case 'get_new_arrivals': return await this.getNewArrivals(args);
            case 'get_product_reviews': return await this.getProductReviews(args);
            case 'get_active_coupons': return await this.getActiveCoupons();
            case 'get_outfit_suggestion': return await this.getOutfitSuggestion(args);
            case 'track_order': return await this.trackOrder(args, user);
            case 'get_wishlist_items': return await this.getWishlistItems(user);
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