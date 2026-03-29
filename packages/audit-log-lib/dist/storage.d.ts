import type { AuditLogEntry, AuditLogOptions } from './types';
export declare class AuditLogStorage {
    private db;
    private dbName;
    private storeName;
    constructor(options?: AuditLogOptions);
    init(): Promise<void>;
    log(entry: AuditLogEntry): Promise<void>;
    getAll(): Promise<AuditLogEntry[]>;
    clearAll(): Promise<void>;
    logRaw(entry: AuditLogEntry): Promise<void>;
}
//# sourceMappingURL=storage.d.ts.map