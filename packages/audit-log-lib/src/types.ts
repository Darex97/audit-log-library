export interface AuditLogEntry {
  action: string;
  payload: any;
  timestamp?: number;
}

export interface AuditLogOptions {
  dbName?: string;
  storeName?: string;
}