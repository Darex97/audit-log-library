export interface AuditLogEntry {
  action: string;
  payload: any;
  timestamp?: number;
  hash?: string;
}

export interface AuditLogOptions {
  dbName?: string;
  storeName?: string;
  maxDays?: number;
  maxEntries?: number;
}

export type DownloadFormat = 'json' | 'excel' | 'both';