import { AuditLogEntry, AuditLogOptions, LogLevel } from './types';
export { setupGlobalLogging } from './logging';
export declare class AuditLog {
    private storage;
    private maxDays;
    private maxEntries?;
    private onStorageFull?;
    private onLog?;
    private pruneInterval;
    constructor(options?: AuditLogOptions);
    private pruneIfNeeded;
    log(action: string, payload: any, level?: LogLevel, context?: any): Promise<void>;
    destroy(): void;
    getLogs(): Promise<AuditLogEntry[]>;
    downloadLogs(format?: "json" | "excel" | "both"): Promise<void>;
    clearLogs(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map