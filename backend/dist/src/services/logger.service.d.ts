interface LogData {
    user_id?: bigint;
    action: string;
    entity_type?: string;
    entity_id?: string;
    details?: any;
    ip_address?: string;
    user_agent?: string;
}
export declare const logActivity: (data: LogData) => Promise<void>;
export {};
//# sourceMappingURL=logger.service.d.ts.map