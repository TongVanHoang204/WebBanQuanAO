interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
}
export declare class AIService {
    static readonly MODEL: string;
    private static readonly prisma;
    private static logDebug;
    private static readonly TOOLS;
    private static readonly CUSTOMER_TOOLS;
    private static getSystemPrompt;
    private static getCustomerSystemPrompt;
    private static extractJson;
    private static formatCurrency;
    private static formatDate;
    static generateContent(prompt: string, type?: string): Promise<any>;
    /**
     * Phân tích ảnh bằng AI và trả về JSON cấu trúc:
     * { product_type, product_type_aliases, color, material, style, gender, search_phrases }
     */
    private static analyzeImageStructured;
    /**
     * Check if a product text matches any of the given type terms.
     * Returns true if the product name or tags contain the product_type or any alias.
     */
    private static matchesProductType;
    /**
     * Tính điểm tương đồng giữa sản phẩm và mô tả AI.
     * Điểm càng cao = sản phẩm càng phù hợp.
     * Hard filter: products that don't match the product_type get score = -100.
     */
    private static scoreProduct;
    /**
     * Calculate Perceptual Hash (pHash) for structural similarity.
     * Resizes to 8x8, converts to grayscale, compares pixels to mean.
     * Returns a 64-character binary string.
     */
    private static calculatePHash;
    /**
     * Calculate Hamming Distance between two 64-bit binary strings.
     * Lower is more similar. Max is 64.
     */
    private static hammingDistance;
    /**
     * Calculate Color Histogram for color distribution similarity.
     * Resizes to 64x64, quantizes RGB into 64 bins (4 bins per channel).
     * Returns an array of normalized frequencies.
     */
    private static calculateColorHistogram;
    /**
     * Calculate Euclidean Distance between two normalized histograms.
     * Lower is more similar.
     */
    private static histogramDistance;
    /**
     * Advanced Non-AI fallback: Extract pHash and Color Histogram from the uploaded image,
     * compute the same for top 50 recent products, and score by combined structural and color similarity.
     */
    private static algorithmicSearch;
    static visualSearch(imagePath: string): Promise<any>;
    private static getDashboardStats;
    private static getRecentOrders;
    private static searchProducts;
    private static getLowStockProducts;
    private static getOrderById;
    private static getCustomerInfo;
    private static getCategories;
    private static getRevenueByPeriod;
    private static getTopProducts;
    private static updateOrderStatus;
    private static updateProductPrice;
    private static createNotification;
    private static getMyOrders;
    private static getMyInfo;
    private static searchByPriceRange;
    private static compareProducts;
    private static executeTool;
    static generateChatResponse(messages: ChatMessage[], user?: any): Promise<any>;
    static generateCustomerResponse(history: ChatMessage[], userMessage: string, user?: any): Promise<{
        message: string;
        products?: any[];
        orders?: any[];
    }>;
    private static runLLMFlow;
}
export {};
//# sourceMappingURL=ai.service.d.ts.map