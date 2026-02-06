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
    static generateContent(prompt: string, type?: string): Promise<string>;
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
    static generateChatResponse(messages: ChatMessage[], user?: any): Promise<string>;
    static generateCustomerResponse(history: ChatMessage[], userMessage: string, user?: any): Promise<{
        message: string;
        products?: any[];
        orders?: any[];
    }>;
    private static runLLMFlow;
}
export {};
//# sourceMappingURL=ai.service.d.ts.map