export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface AuditLogEntry {
  action: string;
  payload: any;
  timestamp?: number;
  level?: LogLevel;     
  context?: any;          
}

export type ReadableLogEntry = Omit<AuditLogEntry, 'timestamp'> & { timestamp: string };

export interface AuditLogOptions {
  dbName?: string;
  storeName?: string;
  maxDays?: number;
  maxEntries?: number;
  onStorageFull?: (logs: AuditLogEntry[]) => Promise<void>;
}

export type DownloadFormat = 'json' | 'excel' | 'both';