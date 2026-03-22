import { AuditLogEntry, DownloadFormat } from './types';
export declare function pruneOldLogs(logs: AuditLogEntry[], maxDays: number): AuditLogEntry[];
export declare function downloadLogs(logs: AuditLogEntry[], format?: DownloadFormat): Promise<void>;
export declare function checkStorageLimit(logs: AuditLogEntry[], maxEntries: number): Promise<boolean>;
//# sourceMappingURL=utils.d.ts.map