import { AuditLogStorage } from './storage';
import type { AuditLogEntry, AuditLogOptions } from './types';
import { pruneOldLogs, downloadLogs, checkStorageLimit } from './utils';

export class AuditLog {
  private storage: AuditLogStorage;
  private maxDays: number = 7;
  private maxEntries: number = 5000;

  constructor(options?: AuditLogOptions) {
    this.storage = new AuditLogStorage(options);
    this.maxDays = options?.maxDays ?? 7;
    this.maxEntries = options?.maxEntries ?? 5000;
    this.storage.init().catch(console.error);
  }

  async log(action: string, payload: any) {
    let logs = await this.storage.getAll();
    logs = pruneOldLogs(logs, this.maxDays);

    const shouldClear = await checkStorageLimit(logs, this.maxEntries);
    if (shouldClear) {
      await this.storage.clearAll();
      logs = [];
    }

    await this.storage.log({ action, payload });
  }

  async getLogs(): Promise<AuditLogEntry[]> {
    let logs = await this.storage.getAll();
    return pruneOldLogs(logs, this.maxDays);
  }

  async downloadLogs(format: 'json' | 'excel' | 'both' = 'json') {
    const logs = await this.getLogs();
    await downloadLogs(logs, format);
  }

  async clearLogs() {
    await this.storage.clearAll();
  }
}