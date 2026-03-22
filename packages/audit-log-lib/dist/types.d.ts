export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export interface AuditLogEntry {
    action: string;
    payload: any;
    timestamp?: number;
    hash?: string;
    level?: LogLevel;
    context?: any;
}
export interface AuditLogOptions {
    dbName?: string;
    storeName?: string;
    maxDays?: number;
    maxEntries?: number;
}
export type DownloadFormat = 'json' | 'excel' | 'both';
//# sourceMappingURL=types.d.ts.map